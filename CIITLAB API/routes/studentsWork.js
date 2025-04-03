const express = require('express');
const router = express.Router();
const StudentsWork = require('../models/StudentWork');
const { auth,checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /studentsWork/getAll:
 *   get:
 *     summary: Dohvata sve studentske radove
 *     tags: [Students Work]
 *     responses:
 *       200:
 *         description: Lista svih studentskih radova
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   graduationYear:
 *                     type: integer
 *                   mentor_id:
 *                     type: integer
 *                   mentorFirstName:
 *                     type: string
 *                   mentorLastName:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/getAll', async (req, res) => {
  try {
    const works = await StudentsWork.getAllWorks();
    res.status(200).json(works);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching works', error: err.message });
  }
});

/**
 * @swagger
 * /studentsWork/GetWork/{id}:
 *   get:
 *     summary: Dohvata studentski rad po ID-u
 *     tags: [Students Work]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID studentskog rada
 *     responses:
 *       200:
 *         description: Detalji studentskog rada
 *       404:
 *         description: Rad nije pronađen
 */
router.get('/GetWork/:id', async (req, res) => {
  try {
    const work = await StudentsWork.getWorkById(req.params.id);
    res.status(200).json(work);
  } catch (err) {
    res.status(404).json({ message: 'Work not found', error: err.message });
  }
});

/**
 * @swagger
 * /studentsWork/GetWorksForMentor/{mentor_id}:
 *   get:
 *     summary: Dohvata sve radove za određenog mentora
 *     tags: [Students Work]
 *     parameters:
 *       - in: path
 *         name: mentor_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID mentora
 *     responses:
 *       200:
 *         description: Lista radova za mentora
 *       500:
 *         description: Server error
 */
router.get('/GetWorksForMentor/:mentor_id', async (req, res) => {
  try {
    const works = await StudentsWork.getWorksByMentorId(req.params.mentor_id);
    res.status(200).json(works);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching works by mentor', error: err.message });
  }
});

/**
 * @swagger
 * /studentsWork/delete/{id}:
 *   delete:
 *     summary: Briše studentski rad
 *     tags: [Students Work]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID studentskog rada
 *     responses:
 *       200:
 *         description: Rad uspešno obrisan
 *       401:
 *         description: Neautorizovan pristup
 *       500:
 *         description: Server error
 */
router.delete('/delete/:id',auth,checkRole('researcher','admin'), async (req, res) => {
  try {
    const result = await StudentsWork.deleteWork(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error deleting work', error: err.message });
  }
});

/**
 * @swagger
 * /studentsWork/create/{id}:
 *   post:
 *     summary: Kreira novi studentski rad
 *     tags: [Students Work]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID mentora
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - title
 *               - description
 *               - graduationYear
 *               - link
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Ime studenta
 *               lastName:
 *                 type: string
 *                 description: Prezime studenta
 *               title:
 *                 type: string
 *                 description: Naslov rada
 *               description:
 *                 type: string
 *                 description: Opis rada
 *               graduationYear:
 *                 type: integer
 *                 description: Godina diplomiranja
 *               link:
 *                 type: string
 *                 description: Link ka radu
 *     responses:
 *       200:
 *         description: Rad uspešno kreiran
 *       500:
 *         description: Server error
 */
router.post('/create/:id',auth,checkRole('researcher','admin'), async (req, res) => {
  try {
    const mentor_id = req.params.id;
    const workData = req.body;
    
    
    // Validacija obaveznih polja
    if (!workData.firstName || !workData.lastName || !workData.title || 
        !workData.description || !workData.graduationYear || !workData.url) {
      return res.status(400).json({ message: 'Sva polja su obavezna' });
    }

    const result = await StudentsWork.createWork(workData, mentor_id);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error creating work', error: err.message });
  }
});

module.exports = router;
