const express = require('express');
const router = express.Router();
const db = require('../config/db');
const User = require('../models/User');
const { error } = require('winston');

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
    console.log("user find");
    // Check if the password matches
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials (Password).' });
    }

    // Generate token
    const token = User.generateAuthToken(user.id,user.email,user.role);

    if(process.env.SYSTEM_LOCKED === "true" && !JSON.parse(process.env.SYSTEM_ADMINISTATORS).includes(user.id)){
      return res.status(403).json({ message: 'System is locked. Contact administrator.' });
    }
    else{
      console.log("User logged in: ",user.email);
      res.status(200).json({
        user,
        token,
      });
    }


    // Respond with user data and token
    
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { id } = req.body;
    console.log("izlogovan id: ",id);
    
    //const re = await User.updateIsLoggedIn(id, 0);
    
      res.status(200).json({ message: 'User logged out successfully' });
   
  } catch (error) { 
    console.log("error: ",error);
    res.status(400).json({ message: error.message });
  }
});



module.exports = router;
