const fs = require('fs');
const express = require('express');
const router = express.Router();
const Sentence = require('../models/Sentence');
const { checkRole,auth } = require('../middleware/auth');
const deleteFiles = require('../autodeleteCSV')

/**
 * @swagger
 * /sentences/getSentence:
 *   get:
 *     summary: Dohvata prvih 10 rečenica sa statusom 0
 *     tags: [Sentences]
 *     responses:
 *       200:
 *         description: Lista rečenica
 *       500:
 *         description: Server error
 */
router.get('/getSentence',auth,checkRole('researcher','admin','anotator1'), async (req, res) => {
  try {
    
    const sentence = await Sentence.getSentence();
    res.json(sentence);
  } catch (error) {
    console.error('Error getting sentences:', error);
    res.status(500).json({ message: 'Error getting sentences' });
  }
});

/**
 * @swagger
 * /sentences/postSentence:
 *   post:
 *     summary: Ažurira rečenicu
 *     tags: [Sentences]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sentence
 *             properties:
 *               sentence:
 *                 type: object
 *                 description: Objekat sa podacima o rečenici
 *     responses:
 *       200:
 *         description: Rečenica uspešno ažurirana
 *       400:
 *         description: Nedostaje rečenica
 *       500:
 *         description: Server error
 */
router.post('/postSentence',auth,checkRole('researcher','admin','anotator1'), async (req, res) => {
  const sentence = req.body; // Pretpostavljamo da klijent šalje objekt sa 'sentence' poljem
  const id = req.user.id
  if (!sentence) {
    return res.status(400).json({ message: 'Sentence is required' });
  }

  try {
    await Sentence.updateSentence(sentence,id);
    res.status(200).json({ message: 'Sentence updated successfully' });
  } catch (error) {
    console.error('Error updating sentence:', error);
    res.status(500).json({ message: 'Error updating sentence' });
  }
});

/////////////////Admin///////////////////////////////

/**
 * @swagger
 * /sentences/getDoneSentences:
 *   get:
 *     summary: Dohvata rečenice sa statusom 2 iz zadnjih 24h
 *     tags: [Sentences]
 *     responses:
 *       200:
 *         description: Lista završenih rečenica
 *       500:
 *         description: Server error
 */
router.get('/getDoneSentences24h',auth,checkRole('admin'), async (req, res) => {
  try {
    const sentences = await Sentence.getUpdatedSentences24h();
    res.json(sentences); // Vraća rezultate u JSON formatu
  } catch (error) {
    console.error('Error getting sentences:', error);
    res.status(500).json({ message: 'Error getting sentences' });
  }
});
//ruta vraca recenice koje su sa statusom 2
router.get('/getDoneSentences',auth,checkRole('admin'), async (req, res) => {
    try {
      const sentences = await Sentence.getAllUpdatedSentences();
      res.json(sentences); // Vraća rezultate u JSON formatu
    } catch (error) {
      console.error('Error getting sentences:', error);
      res.status(500).json({ message: 'Error getting sentences' });
    }
});
//ruta vraca recenice koje su sa statusom 3
router.get('/getNotSureSentences',auth,checkRole('admin'), async (req, res) => {
  try {
    const sentences = await Sentence.getNotSureSentences();
    res.json(sentences); // Vraća rezultate u JSON formatu
  } catch (error) {
    console.error('Error getting sentences:', error);
    res.status(500).json({ message: 'Error getting sentences' });
  }
});


module.exports = router;
