const express = require('express');
const router = express.Router();
const { checkRole,auth } = require('../middleware/auth');
const User = require('../models/User');
const Skill = require('../models/Skill');

/**
 * @swagger
 * /users/me/{id}:
 *   get:
 *     summary: Dohvata podatke o trenutno prijavljenom korisniku
 *     tags: [Users]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *                 status:
 *                   type: string
 *       404:
 *         description: Korisnik nije pronađen
 *       500:
 *         description: Server error
 */
router.get('/me/:id', async (req, res) => {
  try {
    // Uzima ID korisnika iz tokena
    const userId = req.params.id;

    // Pronalaženje korisnika u bazi pomoću njegovog ID-a
    const user = await User.findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Korisnik nije pronađen.' });
    }

    // Vraća podatke o korisniku (ne uključujući lozinku)
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Došlo je do greške na serveru.' });
  }
});

/**
 * @swagger
 * /users/updateSkills/{userId}:
 *   post:
 *     summary: Ažurira veštine korisnika
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID korisnika
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Lista ID-eva veština
 *     responses:
 *       200:
 *         description: Veštine uspešno ažurirane
 *       401:
 *         description: Neautorizovan pristup
 *       500:
 *         description: Server error
 */
router.post('/updateSkills/:userId', auth, async(req, res) => {
  const { userId } = req.params; // Uzmi userId iz URL-a
  const { skills } = req.body;  // Uzmi skills iz tela zahteva

  // Ispisi podatke u konzol

  try {
    // Pozovi statičku metodu klase Skill
    const result = await Skill.updateSkillsForUser(userId, skills);
    res.json(result); // Pošaljemo rezultat klijentu
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Server error' });
  }
});

/**
 * @swagger
 * /users/all:
 *   get:
 *     summary: Dohvata sve korisnike
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista svih korisnika
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
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   bio:
 *                     type: string
 *                   profileImage:
 *                     type: string
 *                   status:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/all', async (req, res) => {
  try {
    const users = await User.getAllUsers(); // Poziv metode iz User klase
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

/**
 * @swagger
 * /users/getStudents:
 *   get:
 *     summary: Dohvata sve studente
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista svih studenata
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
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   bio:
 *                     type: string
 *                   profileImage:
 *                     type: string
 *                   status:
 *                     type: string
 *                   education:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         degree:
 *                           type: string
 *                         institution:
 *                           type: string
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *       500:
 *         description: Server error
 */
router.get('/getStudents', async (req, res) => {
  try {
    const students = await User.getAllStudents();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

/**
 * @swagger
 * /users/getResearchers:
 *   get:
 *     summary: Dohvata sve istraživače
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista svih istraživača
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
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                   bio:
 *                     type: string
 *                   profileImage:
 *                     type: string
 *                   status:
 *                     type: string
 *                   education:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         degree:
 *                           type: string
 *                         institution:
 *                           type: string
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *       500:
 *         description: Server error
 */
router.get('/getResearchers', async (req, res) => {
  try {
    const researchers = await User.getAllResearchers();
    res.status(200).json(researchers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching researchers', error: error.message });
  }
});

module.exports = router;
