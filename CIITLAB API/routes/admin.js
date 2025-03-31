const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin"); // Učitaj Admin klasu
const { auth,checkRole } = require("../middleware/auth");
const bcrypt = require('bcrypt');

const User = require("../models/User");
const Publication = require("../models/Publication");
const Resource = require("../models/Resource");
const Blog = require("../models/Blog");

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Dohvata podatke za admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Podaci za dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalResearchers:
 *                   type: integer
 *                 totalPublications:
 *                   type: integer
 *                 totalResources:
 *                   type: integer
 *                 totalBlogs:
 *                   type: integer
 *                 recentActivity:
 *                   type: array
 *       401:
 *         description: Neautorizovan pristup
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
 * /admin/getAllUsers:
 *   get:
 *     summary: Dohvata sve korisnike
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Lista svih korisnika
 *       500:
 *         description: Server error
 */
router.get('/getAllUsers', async (req, res) => {
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
router.get('/getResearcher/:id', async (req, res) => {
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
router.get('/getUser/:id', async (req, res) => {
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
 * /admin/getAllPublications:
 *   get:
 *     summary: Dohvata sve publikacije
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Lista svih publikacija
 *       500:
 *         description: Server error
 */
router.get('/getAllPublications', async (req, res) => {
    try {
        
        const pub = await Publication.getAllPublications();
        
        res.status(200).json(pub);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});
//vraca sve resurse
router.get('/getAllResources', async (req, res) => {
    try {
        
        const re = await Resource.getAllResources();
        
        res.status(200).json(re);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});
//vraca sve istrazivace
router.get('/getAllResearchers', async (req, res) => {
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
router.get('/getAllBlogs', async (req, res) => {
    try {
        // Pozivamo metodu iz klase Users da dobijemo sve korisnike
        const b = await Blog.getAllBlogs();
        
        // Vraćamo korisnike kao JSON odgovor
        res.status(200).json(b);
    } catch (error) {
        // U slučaju greške vraćamo 500 status sa porukom o grešci
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});
//updejtovanje usera
router.post('/updateUser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userr = req.body; // Ceo objekat 'user' koji dolazi u telu zahteva

        console.log(req.body);
        //treba da se sredi;


      // Pozivanje funkcije koja ažurira korisničke podatke u bazi
      //await Admin.updateUser(user);
  
        // Ako je ažuriranje korisnika uspešno
        res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
      // Ako se desi greška prilikom ažuriranja
      console.error('Error updating user:', err);
      res.status(500).json({ message: 'Error updating user', error: err });
    }
});

//brisanje usera po id
router.delete('/deleteUser', async (req, res) => {
    try {
      const id = req.body; // Ceo objekat 'user' koji dolazi u telu zahteva
  
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

//brisanje publikacije po id
router.delete('/deletePublication', async (req, res) => {
    try {
      const id = req.body; // Ceo objekat 'user' koji dolazi u telu zahteva
  
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

//brisanje resursa po id
router.delete('/deleteResource', async (req, res) => {
    try {
      const id = req.body; // Ceo objekat 'user' koji dolazi u telu zahteva
  
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

//brisanje bloga
router.delete('/deleteBlogs', async (req, res) => {
    try {
      const id = req.body; // Ceo objekat 'user' koji dolazi u telu zahteva
  
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






module.exports = router;
