const fs = require('fs');
const path = require('path');

// Putanja do temp foldera
const tempFolderPath = path.join(__dirname, 'temp');

// Funkcija koja briše fajlove u temp folderu
const deleteOldFiles = () => {
  fs.readdir(tempFolderPath, (err, files) => {
    if (err) {
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(tempFolderPath, file);
      
      fs.unlink(filePath, (err) => {
        if (err) {
          return;
        }
      });
    });
  });
};

// Funkcija koja pokreće deleteOldFiles svakih 24h


// Exportuj funkciju koja startuje cleanup
module.exports = deleteOldFiles;
