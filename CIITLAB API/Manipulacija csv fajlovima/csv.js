const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../config/db'); // Uvoz postojećeg fajla za konekciju

// Putanja do CSV fajla (ako je u podfolderu pored ovog fajla)
const csvFilePath = path.join(__dirname, 'csv', 'recenice.csv');

const results = [];

fs.createReadStream(csvFilePath, { encoding: 'utf8' })
    .pipe(csv({ separator: ',' })) // Ako CSV koristi drugi separator, promeni ovde
    .on('data', (row) => {
        // Čisti navodnike iz svakog reda
        const cleanedReview = row.review.replace(/^"|"$/g, '').trim(); // Uklanja navodnike sa početka i kraja
        const cleanedSentiment = row.sentiment.replace(/^"|"$/g, '').trim(); // Uklanja navodnike sa početka i kraja

        // Dodajemo očišćene podatke u niz
        results.push([cleanedReview, cleanedSentiment]);
    })
    .on('end', async () => {
        console.log('CSV fajl uspešno pročitan.');

        const query = 'INSERT INTO sentences (sentence, sentiment) VALUES ?';
        
        try {
            const [res] = await db.query(query, [results]);
            console.log(`Uspešno ubačeno ${res.affectedRows} redova u bazu.`);
        } catch (err) {
            console.error('Greška pri unosu podataka:', err);
        }
    });

const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

module.exports = readCSV;
