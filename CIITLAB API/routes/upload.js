const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const fs = require('fs');
const sharp = require('sharp');

const url = "http://160.99.40.221:3500/users/images/";

const router = express.Router();

// Konfiguracija za multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/'); // Direktorijum gde će se čuvati slike
    },
    filename: function (req, file, cb) {
        const userId = req.params.id; // Uzimanje ID korisnika iz URL-a
        const baseFilename = 'user-' + userId;
        
        // Provera i brisanje postojećih slika sa istim imenom (bez ekstenzije)
        fs.readdir('public/', (err, files) => {
            if (err) {
                console.error('Greška pri čitanju direktorijuma:', err);
                return cb(err);
            }
            
            // Pronađi sve fajlove koji počinju sa baseFilename
            const existingFiles = files.filter(file => file.startsWith(baseFilename));
            
            // Obriši sve postojeće fajlove
            existingFiles.forEach(existingFile => {
                fs.unlink(path.join('public/', existingFile), (err) => {
                    if (err) {
                        console.error('Greška pri brisanju postojećeg fajla:', err);
                    }
                });
            });
            
            // Prvo sačuvaj originalni fajl sa privremenom ekstenzijom
            cb(null, baseFilename + '_temp' + path.extname(file.originalname));
        });
    }
});

const upload = multer({ storage: storage });

// Middleware za konverziju u WebP
const convertToWebP = async (req, res, next) => {
    if (!req.file) return next();
    
    try {
        const tempFilePath = req.file.path;
        const finalFilePath = tempFilePath.replace('_temp' + path.extname(req.file.originalname), '.webp');
        
        // Proveri da li je slika već u WebP formatu
        if (path.extname(req.file.originalname).toLowerCase() === '.webp') {
            // Ako je već WebP, samo preimenuj fajl
            fs.rename(tempFilePath, finalFilePath, (err) => {
                if (err) {
                    console.error('Greška pri preimenovanju WebP fajla:', err);
                }
            });
            
            // Ažuriraj putanju u req.file
            req.file.path = finalFilePath;
            req.file.filename = path.basename(finalFilePath);
            
            return next();
        }
        
        // Konvertuj sliku u WebP format
        await sharp(tempFilePath)
            .webp({ quality: 100 })
            .toFile(finalFilePath);
        
        // Sačekaj malo pre brisanja privremenog fajla
        setTimeout(() => {
            fs.unlink(tempFilePath, (err) => {
                if (err) {
                    console.error('Greška pri brisanju privremenog fajla:', err);
                }
            });
        }, 1000);
        
        // Ažuriraj putanju u req.file
        req.file.path = finalFilePath;
        req.file.filename = path.basename(finalFilePath);
        
        next();
    } catch (error) {
        console.error('Greška pri konverziji slike:', error);
        next(error);
    }
};

/**
 * @swagger
 * /users/updateProfile/ImageAndData/{id}:
 *   post:
 *     summary: Отпремање слике профила и ажурирање података корисника
 *     tags: [Профил]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID корисника
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Слика профила
 *               firstName:
 *                 type: string
 *                 description: Име корисника
 *               lastName:
 *                 type: string
 *                 description: Презиме корисника
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Е-пошта корисника
 *               bio:
 *                 type: string
 *                 description: Биографија корисника
 *     responses:
 *       200:
 *         description: Слика је успешно отпремљена
 *       400:
 *         description: Није изабрана слика
 *       500:
 *         description: Грешка при отпремању слике
 */
router.post('/ImageAndData/:id', auth, checkRole('researcher','student'), upload.single('image'), convertToWebP, async (req, res) => {
    try {
       
        if (!req.file) {
            return res.status(400).send('Nije izabrana slika.');
        }
        const userId = req.params.id; // Uzimanje ID korisnika iz URL-a
        const imageUrl = `${url}${req.file.filename}`; // Spajanje URL-a sa nazivom fajla
        
        const firstName = req.body.firstName; // Dodatni podaci
        const lastName = req.body.lastName;
        const email = req.body.email;
        const bio = req.body.bio;

        await User.updateUserImage(userId, imageUrl);
        await User.updateUserProfile(userId, { firstName, lastName, email, bio });

        res.send('Slika je uspešno uploadovana.');
    } catch (error) {
        console.error('Greška prilikom uploadovanja slike:', error);
        res.status(500).send('Greška prilikom uploadovanja slike.');
    }
});

/**
 * @swagger
 * /users/updateProfile/Data/{id}:
 *   post:
 *     summary: Ажурирање података корисника без слике
 *     tags: [Профил]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID корисника
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Име корисника
 *               lastName:
 *                 type: string
 *                 description: Презиме корисника
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Е-пошта корисника
 *               bio:
 *                 type: string
 *                 description: Биографија корисника
 *     responses:
 *       200:
 *         description: Подаци су успешно ажурирани
 *       500:
 *         description: Грешка при ажурирању података
 */
router.post('/Data/:id',express.json(),auth,checkRole('researcher','student'), async (req, res) => {
    try {
        const userId = req.params.id; // Uzimanje ID korisnika iz URL-a
        const firstName = req.body.firstName; // Dodatni podaci
        const lastName = req.body.lastName;
        const email = req.body.email;
        const bio = req.body.bio;

        await User.updateUserProfile(userId, { firstName, lastName, email, bio });

        res.send('Slika je uspešno uploadovana.');
    } catch (error) {
        console.error('Greška prilikom uploadovanja slike:', error);
        res.status(500).send('Greška prilikom uploadovanja slike.');
    }
});

module.exports = router; 