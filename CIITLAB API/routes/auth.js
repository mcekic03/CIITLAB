const express = require('express');
const router = express.Router();
const db = require('../config/db');
const User = require('../models/User');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Prijava korisnika u sistem
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email adresa korisnika
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Lozinka korisnika
 *     responses:
 *       200:
 *         description: Uspešna prijava
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *                     status:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: JWT token za autentifikaciju
 *       401:
 *         description: Nevalidni kredencijali
 *       400:
 *         description: Greška pri prijavi
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials (Email).' });
    }

    // Check if the password matches
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials (Password).' });
    }

    // Generate token
    const token = User.generateAuthToken(user.id,user.email,user.role);

    // Respond with user data and token
    res.json({
      user,
      token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


module.exports = router;
