const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const { checkRole,auth } = require('../middleware/auth');

/**
 * @swagger
 * /users/resources:
 *   get:
 *     summary: Dohvata resurse za određenog istraživača
 *     tags: [Resources]
 *     parameters:
 *       - in: query
 *         name: researcher
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID istraživača
 *     responses:
 *       200:
 *         description: Lista resursa za istraživača
 *       400:
 *         description: Nedostaje ID istraživača
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
      // Uzima researcher_id iz query string-a
      const { researcher } = req.query;
  
      if (!researcher) {
        return res.status(400).json({ message: 'Researcher ID is required' });
      }
  
      // Pronalaženje resursa na osnovu researcher_id
      const resources = await Resource.findByResearcherId(researcher);
  
      // Ako resursi nisu pronađeni, vraća prazan niz
      res.json(resources); // Vraća praznu listu ako nisu pronađeni resursi
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

/**
 * @swagger
 * /users/resources/all:
 *   get:
 *     summary: Dohvata sve resurse sa informacijama o istraživačima
 *     tags: [Resources]
 *     responses:
 *       200:
 *         description: Lista svih resursa sa informacijama o istraživačima
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   url:
 *                     type: string
 *                   researcher:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/all', async (req, res) => {
    try {
      // 1. Dohvati sve resurse iz baze
      const resources = await Resource.getAllResources();
  
      // 2. Iteriraj kroz svaki resurs i dodaj objekat researcher sa firstName i lastName
      const enrichedResources = await Promise.all(
        resources.map(async (resource) => {
          const researcher = await Resource.getResearcherNameByResourceId(resource.id);
  
          return {
            ...resource, // Dodaj postojeće podatke o resursu
            researcher: researcher
              ? {
                  firstName: researcher.firstName,
                  lastName: researcher.lastName,
                }
              : null,
          };
        })
      );
  
      // 3. Pošalji klijentu kompletne podatke
      res.json(enrichedResources);
    } catch (error) {
      console.error('Error fetching all resources:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

/**
 * @swagger
 * /users/resources/updateResources:
 *   post:
 *     summary: Ažurira ili dodaje novi resurs
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - url
 *               - researcher
 *             properties:
 *               title:
 *                 type: string
 *                 description: Naslov resursa
 *               description:
 *                 type: string
 *                 description: Opis resursa
 *               url:
 *                 type: string
 *                 description: URL resursa
 *               researcher:
 *                 type: integer
 *                 description: ID istraživača
 *     responses:
 *       200:
 *         description: Resurs uspešno ažuriran/dodat
 *       400:
 *         description: Nedostaju obavezni podaci
 *       401:
 *         description: Neautorizovan pristup
 *       500:
 *         description: Server error
 */
router.post('/updateResources',auth, async (req, res) => {
    const {title,description,url,researcher} = req.body;
    
    // Validacija podataka
    if (!title || !description || !url || !researcher) {
      return res.status(400).json({ error: 'All fields are required: title, description, url, userId' });
    }
  
    try {
      // Pozivanje metode iz klase Resource da dodamo resurs
      const result = await Resource.addResource(title, description, url, researcher);
      res.json(result); // Vraćanje rezultata klijentu
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || 'Server error' });
    }
  });

/**
 * @swagger
 * /users/resources/{resourceid}:
 *   delete:
 *     summary: Briše resurs po ID-u
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceid
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID resursa koji se briše
 *     responses:
 *       200:
 *         description: Resurs uspešno obrisan
 *       401:
 *         description: Neautorizovan pristup
 *       500:
 *         description: Server error
 */
router.delete('/:resourceid',auth,checkRole('researcher'), async (req, res) => {
    const { resourceid } = req.params;
  
    try {
      const result = await Resource.deleteResourceById(resourceid);
      res.status(200).json({ message: 'Resource deleted successfully', result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;