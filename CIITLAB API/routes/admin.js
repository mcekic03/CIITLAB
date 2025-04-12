const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin"); // Učitaj Admin klasu
const { auth,checkRole } = require("../middleware/auth");
const bcrypt = require('bcrypt');

const User = require("../models/User");
const Publication = require("../models/Publication");
const Resource = require("../models/Resource");
const Blog = require("../models/Blog");
const Sentence = require('../models/Sentence');
const deleteFiles = require('../autodeleteCSV')

const fs = require('fs');

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Dobija podatke za admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Uspešno dobavljeni podaci za dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   description: Ukupan broj korisnika
 *                 totalResearchers:
 *                   type: integer
 *                   description: Ukupan broj istraživača
 *                 totalStudents:
 *                   type: integer
 *                   description: Ukupan broj studenata
 *                 totalPublications:
 *                   type: integer
 *                   description: Ukupan broj publikacija
 *                 totalResources:
 *                   type: integer
 *                   description: Ukupan broj resursa
 *       401:
 *         description: Neautorizovan pristup
 *       403:
 *         description: Zabranjen pristup
 *       500:
 *         description: Server error
 */
router.get("/dashboard",auth,checkRole('admin'), async (req, res) => {
    try {
        // Provera autentifikacije iz Authorization header-a
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Ako treba, ovde možeš validirati authToken (JWT provera ili upit ka bazi)

        // Pozivanje metoda Admin klase da dobije potrebne podatke
        const totalResearchers = await Admin.getTotalResearchers();
        const totalPublications = await Admin.getTotalPublications();
        const totalResources = await Admin.getTotalResources();
        const totalBlogs = await Admin.getTotalBlogs();
        const totalWorks = await Admin.getTotalWorks();
        const recentActivity = await Admin.getRecentActivity();
        const totalStudents = await Admin.getTotalStudents();
        const totalAnnotators = await Admin.getTotalAnotators();

        // Slanje odgovora klijentu
        res.json({
            totalResearchers,
            totalPublications,
            totalResources,
            totalBlogs,
            recentActivity,
            totalWorks,
            totalStudents,
            totalAnnotators
        });
    } catch (error) {
        console.error("Greška pri učitavanju dashboard podataka:", error);
        res.status(500).json({ error: "Failed to load dashboard data" });
    }
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Dobija listu svih korisnika
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Broj stranice
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Broj korisnika po stranici
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pretraga po imenu ili email-u
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [researcher, student]
 *         description: Filter po ulozi
 *     responses:
 *       200:
 *         description: Uspešno dobavljena lista korisnika
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       profileImage:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                   description: Ukupan broj korisnika
 *                 pages:
 *                   type: integer
 *                   description: Ukupan broj stranica
 *       401:
 *         description: Neautorizovan pristup
 *       403:
 *         description: Zabranjen pristup
 *       500:
 *         description: Server error
 */
router.get('/getAllUsers', auth, checkRole('admin'), async (req, res) => {
    try {
        // Pozivamo metodu iz klase Users da dobijemo sve korisnike
        const users = await User.getAllUsers(type = 'all');
        
        // Vraćamo korisnike kao JSON odgovor
        res.status(200).json(users);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

/**
 * @swagger
 * /admin/getResearcher/{id}:
 *   get:
 *     summary: Dohvata istraživača po ID-u
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID istraživača
 *     responses:
 *       200:
 *         description: Podaci o istraživaču
 *       500:
 *         description: Server error
 */
router.get('/getResearcher/:id',auth,checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        // Pozivamo metodu iz klase Users da dobijemo sve korisnike
        const users = await User.findUserById(id);
        
        // Vraćamo korisnike kao JSON odgovor
        res.status(200).json(users);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

/**
 * @swagger
 * /admin/getUser/{id}:
 *   get:
 *     summary: Dohvata korisnika po ID-u
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID korisnika
 *     responses:
 *       200:
 *         description: Podaci o korisniku
 *       500:
 *         description: Server error
 */
router.get('/getUser/:id',auth,checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        // Pozivamo metodu iz klase Users da dobijemo sve korisnike
        const users = await User.findUserById(id);
        
        // Vraćamo korisnike kao JSON odgovor
        res.status(200).json(users);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

/**
 * @swagger
 * /admin/publications:
 *   get:
 *     summary: Dobija listu svih publikacija
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Broj stranice
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Broj publikacija po stranici
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pretraga po naslovu
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [journal, conference, book]
 *         description: Filter po tipu publikacije
 *     responses:
 *       200:
 *         description: Uspešno dobavljena lista publikacija
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                       authors:
 *                         type: array
 *                         items:
 *                           type: string
 *                       year:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                   description: Ukupan broj publikacija
 *                 pages:
 *                   type: integer
 *                   description: Ukupan broj stranica
 *       401:
 *         description: Neautorizovan pristup
 *       403:
 *         description: Zabranjen pristup
 *       500:
 *         description: Server error
 */
router.get('/getAllPublications', auth, checkRole('admin'), async (req, res) => {
    try {
        // Pozivamo metodu iz klase Publications da dobijemo sve publikacije
        let publications = await Publication.getAllPublications();
        
        publications = await Promise.all(publications.map(async (p) => {
          const u = await User.findUserById(p.user_id);
          if (u) {
              return {
                  ...p,
                  firstName: u.firstName,
                  lastName: u.lastName
              };
          }
          return p;
        }));
        res.status(200).json(publications);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching publications:', error);
        res.status(500).json({ message: 'Failed to fetch publications' });
    }
});

/**
 * @swagger
 * /admin/resources:
 *   get:
 *     summary: Dobija listu svih resursa
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Broj stranice
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Broj resursa po stranici
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pretraga po nazivu
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [equipment, software, material]
 *         description: Filter po tipu resursa
 *     responses:
 *       200:
 *         description: Uspešno dobavljena lista resursa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                       quantity:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                   description: Ukupan broj resursa
 *                 pages:
 *                   type: integer
 *                   description: Ukupan broj stranica
 *       401:
 *         description: Neautorizovan pristup
 *       403:
 *         description: Zabranjen pristup
 *       500:
 *         description: Server error
 */
router.get('/getAllResources', auth, checkRole('admin'), async (req, res) => {
    try {
        // Pozivamo metodu iz klase Resources da dobijemo sve resurse
        let resources = await Resource.getAllResources();

        resources = await Promise.all(resources.map(async (p) => {
          const u = await User.findUserById(p.researcher_id);
          if (u) {
              return {
                  ...p,
                  firstName: u.firstName,
                  lastName: u.lastName
              };
          }
          return p;
      }));
        
        // Vraćamo resurse kao JSON odgovor
        res.status(200).json(resources);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching resources:', error);
        res.status(500).json({ message: 'Failed to fetch resources' });
    }
});

//vraca sve istrazivace
router.get('/getAllResearchers',auth,checkRole('admin'), async (req, res) => {
    try {
        // Pozivamo metodu iz klase Users da dobijemo sve korisnike
        const users = await User.getAllResearchers();

        const enrichedRes = await Promise.all(
            users.map(async (re) => {
                const publicationC = await Admin.getTotalPublicationsFor(re.id);
                const ResourcesC = await Admin.getTotalResourcesFor(re.id);
              return {
                ...re, // Dodaj postojeće podatke o resursu
                publications: publicationC,
                resources: ResourcesC
              };
            })
          );

        // Vraćamo korisnike kao JSON odgovor

        res.status(200).json(enrichedRes);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});
//get all blogs 
router.get('/getAllBlogs',auth,checkRole('admin'), async (req, res) => {
    try {
        // Pozivamo metodu iz klase Users da dobijemo sve korisnike
        let b = await Blog.getAllBlogs();

        b = await Promise.all(b.map(async (p) => {
          const u = await User.findUserById(p.author_id);
          if (u) {
              return {
                  ...p,
                  firstName: u.firstName,
                  lastName: u.lastName
              };
          }
          return p;
      }));
        
        // Vraćamo korisnike kao JSON odgovor
        res.status(200).json(b);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});
//updejtovanje usera
router.post('/updateUser/:id',auth,checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const userr = req.body; // Ceo objekat 'user' koji dolazi u telu zahteva

        //treba da se sredi;

        const u = await User.findUserById(id);

        if(userr.password == ' '){
            userr.password = u.password;
        }
        else{
            userr.password = await bcrypt.hash(userr.password, 10);
        }

        User.updateUser(id,userr);

  
        // Ako je ažuriranje korisnika uspešno
        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
      // Ako se desi greška prilikom ažuriranja
      console.error('Error updating user:', err);
      res.status(500).json({ message: 'Error updating user', error: err });
    }
});

//dodavanje usera       radiiiiiiiiiiii
router.post('/createUser',auth,checkRole('admin'), async (req, res) => {
    try {
        const user = req.body; // Ceo objekat 'user' koji dolazi u telu zahteva

        //treba da se sredi;
        User.create(user.firstName, user.lastName, user.email, user.password,user.role, user.bio,user.profileImage,user.status);

  
        // Ako je ažuriranje korisnika uspešno
        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
      // Ako se desi greška prilikom ažuriranja
      console.error('Error updating user:', err);
      res.status(500).json({ message: 'Error updating user', error: err });
    }
});

//brisanje usera po id     radiiiiiiiiiiiiii
router.delete('/deleteUser/:id',auth,checkRole('admin'), async (req, res) => {
    try {
      const id = req.params.id; // Ceo objekat 'user' koji dolazi u telu zahteva
  
      // Pozivanje funkcije koja ažurira korisničke podatke u bazi
      await User.deleteUser(id)
  
      // Ako je ažuriranje korisnika uspešno
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
      // Ako se desi greška prilikom ažuriranja
      console.error('Error updating user:', err);
      res.status(500).json({ message: 'Error deleting user', error: err });
    }
});

//brisanje publikacije po id              radiiii
router.delete('/deletePublication/:id',auth,checkRole('admin'), async (req, res) => {
    try {
      const id = req.params.id; // Ceo objekat 'user' koji dolazi u telu zahteva
  
      // Pozivanje funkcije koja ažurira korisničke podatke u bazi
      await Publication.deletePublication(id)
  
      // Ako je ažuriranje korisnika uspešno
      res.status(200).json({ message: 'publication deleted successfully' });
    } catch (err) {
      // Ako se desi greška prilikom ažuriranja
      console.error('Error updating user:', err);
      res.status(500).json({ message: 'Error deleting publication', error: err });
    }
});

//brisanje resursa po id            radiiiii
router.delete('/deleteResource/:id',auth,checkRole('admin'), async (req, res) => {
    try {
      const id = req.params.id; // Ceo objekat 'user' koji dolazi u telu zahteva
  
      // Pozivanje funkcije koja ažurira korisničke podatke u bazi
      await Resource.deleteResourceById(id)
  
      // Ako je ažuriranje korisnika uspešno
      res.status(200).json({ message: 'resource deleted successfully' });
    } catch (err) {
      // Ako se desi greška prilikom ažuriranja
      console.error('Error updating resource:', err);
      res.status(500).json({ message: 'Error deleting user', error: err });
    }
});

//brisanje bloga    radiiiiii
router.delete('/deleteBlogs/:id',auth,checkRole('admin'), async (req, res) => {
    try {
      const id = req.params.id; // Ceo objekat 'user' koji dolazi u telu zahteva
  
      // Pozivanje funkcije koja ažurira korisničke podatke u bazi
      await Blog.deleteBlog(id);
  
      // Ako je ažuriranje korisnika uspešno
      res.status(200).json({ message: 'blog deleted successfully' });
    } catch (err) {
      // Ako se desi greška prilikom ažuriranja
      console.error('Error updating user:', err);
      res.status(500).json({ message: 'Error deleting blog', error: err });
    }
});


// sentiment_analysis dashboard////////////////////////

router.get('/sentimentAnalysis/dashboard',auth,checkRole('admin'), async (req, res) => {
    try {
        const sentimentCount = await Admin.getSentimentCountPerAnnotator();
        const countDoneSentences = await Sentence.getCountDoneSentences();
        const countNotSureSentences = await Sentence.getCountNotSureSentences();
        const countFreeSentences = await Sentence.getCountFreeSentences();
        const countAnnotators = await Admin.getTotalAnotators1();
       
        
        // Slanje odgovora klijentu
        res.status(200).json({
            sentimentCount,
            countDoneSentences,
            countNotSureSentences,
            countFreeSentences,
            countAnnotators  
        });
    } catch (error) {
        console.error('Error fetching sentiment count:', error);
        res.status(500).json({ message: 'Error fetching sentiment count', error: error });
    }
});


//downloads

router.get('/downloadAnotatorSentencesCSV/:user_id', async (req, res) => {
    try {
        const user_id = req.params.user_id;
        // Pozivamo metodu iz Sentence klase koja generiše CSV
        const filePath = await Admin.AnotatorGenerateCSV(user_id);
    
        res.on('finish', () => {
          deleteFiles();
        });
  
        // Proveravamo da li fajl postoji
        if (fs.existsSync(filePath)) {
          // Ako fajl postoji, šaljemo ga kao download
          res.download(filePath, `sentences_${user_id}.csv`, (err) => {
            if (err) {
              console.error('Greška pri slanju fajla: ', err);
              res.status(500).send('Greška pri preuzimanju fajla.');
            } else {
              // Brišemo fajl nakon što je preuzet
              fs.unlinkSync(filePath);
            }
          });
        } else {
          res.status(404).send('Fajl nije pronađen.');
        }
      } catch (error) {
        console.error('Greška pri generisanju CSV fajla: ', error);
        res.status(500).send('Greška pri generisanju CSV fajla.');
      }
});

//ruta za skidanje gotovih recenica
router.get('/downloadDoneCSV',auth,checkRole('admin'), async (req, res) => {
    try {
      // Pozivamo metodu iz Sentence klase koja generiše CSV
      const filePath = await Sentence.generateCSV(2);
  
      res.on('finish', () => {
        deleteFiles();
      });

      // Proveravamo da li fajl postoji
      if (fs.existsSync(filePath)) {
        // Ako fajl postoji, šaljemo ga kao download
        res.download(filePath, 'sentences.csv', (err) => {
          if (err) {
            console.error('Greška pri slanju fajla: ', err);
            res.status(500).send('Greška pri preuzimanju fajla.');
          } else {
            // Brišemo fajl nakon što je preuzet
            fs.unlinkSync(filePath);
          }
        });
      } else {
        res.status(404).send('Fajl nije pronađen.');
      }
    } catch (error) {
      console.error('Greška pri generisanju CSV fajla: ', error);
      res.status(500).send('Greška pri generisanju CSV fajla.');
    }
});
//ruta za skidanje notsure recenica sa statusom 3
router.get('/downloadNotSureCSV',auth,checkRole('admin'), async (req, res) => {
  try {
    // Pozivamo metodu iz Sentence klase koja generiše CSV
    const filePath = await Sentence.generateCSV(3);

    res.on('finish', () => {
      deleteFiles();
    });

    // Proveravamo da li fajl postoji
    if (fs.existsSync(filePath)) {
      // Ako fajl postoji, šaljemo ga kao download
      res.download(filePath, 'sentences_status_3.csv', (err) => {
        if (err) {
          console.error('Greška pri slanju fajla: ', err);
          res.status(500).send('Greška pri preuzimanju fajla.');
        } else {
          // Brišemo fajl nakon što je preuzet
          fs.unlinkSync(filePath);
        }
      });
    } else {
      res.status(404).send('Fajl nije pronađen.');
    }
  } catch (error) {
    console.error('Greška pri generisanju CSV fajla: ', error);
    res.status(500).send('Greška pri generisanju CSV fajla.');
  }
});
//ruta za skidanje ne procesiranih recenica
router.get('/downloadNotProcessCSV',auth,checkRole('admin'), async (req, res) => {
    try {
      // Pozivamo metodu iz Sentence klase koja generiše CSV
      const filePath = await Sentence.generateCSV(0);
  
      res.on('finish', () => {
        deleteFiles();
      });
  
      // Proveravamo da li fajl postoji
      if (fs.existsSync(filePath)) {
        // Ako fajl postoji, šaljemo ga kao download
        res.download(filePath, 'sentences_status_0.csv', (err) => {
          if (err) {
            console.error('Greška pri slanju fajla: ', err);
            res.status(500).send('Greška pri preuzimanju fajla.');
          } else {
            // Brišemo fajl nakon što je preuzet
            fs.unlinkSync(filePath);
          }
        });
      } else {
        res.status(404).send('Fajl nije pronađen.');
      }
    } catch (error) {
      console.error('Greška pri generisanju CSV fajla: ', error);
      res.status(500).send('Greška pri generisanju CSV fajla.');
    }
  });



module.exports = router;
  