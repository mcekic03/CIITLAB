const express = require('express');
const router = express.Router();
const { checkRole,auth } = require('../middleware/auth');
const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfiguracija za multer - za upload fajlova
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Dobavljamo title iz formData
    const title = req.body.title;
    
    // Kreiranje putanje za folder bloga
    const blogFolderPath = path.join(__dirname, '../public/blogs', title);
    
    // Kreiranje foldera ako ne postoji
    if (!fs.existsSync(blogFolderPath)) {
      fs.mkdirSync(blogFolderPath, { recursive: true });
    }
    
    cb(null, blogFolderPath);
  },
  filename: function (req, file, cb) {
    // Dobavljamo title iz formData
    const title = req.body.title;
    
    // Generisanje imena fajla prema formuli
    let filename;
    
    if (file.fieldname === 'banerImg') {
      // Za baner sliku: {title}-baner
      filename = `${title}-baner${path.extname(file.originalname)}`;
    } else if (file.fieldname === 'content') {
      // Za content slike: {title}-content-{broj slike}
      // Broj slike je redni broj u nizu content slika
      const contentFiles = req.files ? req.files['content'] || [] : [];
      const fileIndex = contentFiles.findIndex(f => f.originalname === file.originalname);
      const fileNumber = fileIndex >= 0 ? fileIndex + 1 : Date.now();
      filename = `${title}-content-${fileNumber}${path.extname(file.originalname)}`;
    } else {
      // Za ostale slike (ako ih ima)
      filename = `${title}-${file.fieldname}${path.extname(file.originalname)}`;
    }
    
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

router.get('/getAll', async (req, res) => {
    try {
        const blogs = await Blog.getAllBlogs();
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri dobavljanju blogova', error: error.message });
    }
});

router.get('/getBlog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.getBlogWithId(id);
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri dobavljanju bloga', error: error.message });
    }
});


router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.deleteBlog(id);
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Greška pri brisanju bloga', error: error.message });
    }
});

// Nova ruta za kreiranje bloga sa slikama
router.post('/create', upload.fields([
  { name: 'banerImg', maxCount: 1 },
  { name: 'content', maxCount: 10 } // Dozvoljavamo do 10 slika za sadržaj
]), async (req, res) => {
  try {
    // Provera da li je baner slika uploadovana
    if (!req.files['banerImg'] || req.files['banerImg'].length === 0) {
      return res.status(400).json({ message: 'Baner slika je obavezna' });
    }
    
    // Kreiranje URL-a za baner sliku
    const banerUrl = `/users/images/blogs/${req.body.title}/${req.files['banerImg'][0].filename}`;
    
    // Kreiranje niza URL-ova za slike iz content polja
    // Uvek inicijalizujemo kao prazan niz
    let imagesUrls = [];
    
    // Ako postoje slike u content polju, dodajemo njihove URL-ove
    if (req.files['content'] && req.files['content'].length > 0) {
      imagesUrls = req.files['content'].map(file => 
        `/users/images/blogs/${req.body.title}/${file.filename}`
      );
    }
    
    // Dodavanje URL-ova u req.body
    req.body.banerUrl = banerUrl;
    req.body.imagesUrls = imagesUrls;
    
    console.log(req.body);


    // Prosleđivanje podataka modelu za kreiranje bloga
    const newBlog = await Blog.createBlog(req.body);
    
    res.status(201).json(newBlog);
  } catch (error) {
    console.error('Greška pri kreiranje bloga:', error);
    res.status(500).json({ message: 'Greška pri kreiranje bloga', error: error.message });
  }
});

module.exports = router;
