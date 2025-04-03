const express = require('express');
const Publication = require('../models/Publication'); // Importuj Publication model
const router = express.Router();
const { checkRole,auth } = require('../middleware/auth');

/**
 * @swagger
 * /users/publications/all:
 *   get:
 *     summary: Dohvata sve publikacije
 *     tags: [Publications]
 *     responses:
 *       200:
 *         description: Lista svih publikacija
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   url:
 *                     type: string
 *                   userId:
 *                     type: integer
 *       500:
 *         description: Server error
 */
router.get('/all', async (req, res) => {
  try {
    const publications = await Publication.getAllPublications();
    res.status(200).json(publications); // Vraća sve publikacije
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/publications/find/{userId}:
 *   get:
 *     summary: Dohvata publikacije za određenog korisnika
 *     tags: [Publications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID korisnika
 *     responses:
 *       200:
 *         description: Lista publikacija korisnika
 *       404:
 *         description: Nema pronađenih publikacija
 *       500:
 *         description: Server error
 */
router.get('/find/:userId', async (req, res) => {
  const { userId } = req.params;
    
  try {
    const publications = await Publication.getPublicationsByUser(userId);
    if (publications.length === 0) {
      return res.status(404).json({ error: 'No publications found for this user.' });
    }
    res.status(200).json(publications); // Vraća publikacije za određenog korisnika
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/publications/update/{id}:
 *   post:
 *     summary: Ažurira URL publikacije
 *     tags: [Publications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID publikacije
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publications
 *             properties:
 *               publications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *     responses:
 *       200:
 *         description: Publikacija uspešno ažurirana
 *       400:
 *         description: Nedostaju podaci
 *       401:
 *         description: Neautorizovan pristup
 *       500:
 *         description: Server error
 */
router.post('/update/:user_id',auth, async (req, res) => {
  const { user_id } = req.params;
  const { publications } = req.body;
  console.log(publications);
  if(!publications[0]){
    Publication.deletePublication(user_id);
    return res.status(200).json({ message: 'publications is deleted.' });
  }

  if (!publications) {
    return res.status(400).json({ error: 'publications is required.' });
  }
  try {
    const updatedPublication = await Publication.updatePublicationUrl(user_id, publications[0].url);
    res.status(200).json(updatedPublication); // Vraća ažuriranu publikaciju
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /users/publications/count:
 *   post:
 *     summary: Prebrojava redove u publikaciji
 *     tags: [Publications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - link
 *             properties:
 *               link:
 *                 type: string
 *                 description: URL publikacije
 *     responses:
 *       200:
 *         description: Broj redova u publikaciji
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 broj_redova:
 *                   type: integer
 *       400:
 *         description: Nedostaje link parametar
 *       500:
 *         description: Server error
 */
router.post("/count", async (req, res) => {
  const { link } = req.body;
  
  if (!link) {
      return res.status(400).json({ error: "Nedostaje link parametar u body-ju" });
  }

  try {
      const brojRedova = await Publication.prebrojSveRedove(link);
      res.json({ broj_redova: brojRedova });
  } catch (error) {
      res.status(500).json({ error: "Greška prilikom prebrojavanja redova" });
  }
});

module.exports = router;
