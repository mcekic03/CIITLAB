// models/Sentence.js
const fs = require('fs');
const path = require('path');
const db = require('../config/db'); // Povezivanje sa bazom
const { parse } = require('json2csv');// Povezivanje sa bazom iz config fajla

class Sentence {
  // Metoda koja vraća  rečenicu sa statusom 0 uvek neka random recenica iz baze
  //status 0 je da moze da se koristi
  //status 1 je da je u procesu koriscenja
  //status 2 je zavrsena ona se ne dira
  static async getSentence() {
    try {
      // SQL upit sa LIMIT-om 10 za prvih 10 rečenica sa statusom 0
      const query = `SELECT * FROM sentences 
                     WHERE status = 0 
                     ORDER BY RAND() 
                     LIMIT 1;`;

      // Pokretanje upita
      const [rows] = await db.promise().query(query);

      const ids = rows.map(row => row.id);
      await Sentence.updateStatusInProgress(ids);

      return rows; // Vraća prvih 10 rečenica
    } catch (error) {
      throw new Error('Error getting sentences with status 0: ' + error.message);
    }
  }

  //ovo updejtuje recenicu koja je dosla iz baze da vise ne sme da se koristi
  // status namesta na 1
  static async updateStatusInProgress(ids) {
    try {
      // Pretvaramo niz ID-eva u string sa zapetama (npr. [1, 2, 3] -> '1, 2, 3')
      const idsString = ids.join(", ");
      
      // Upit za ažuriranje statusa na 1 za odgovarajuće rečenice
      const query = `UPDATE sentences SET status = 1 WHERE id IN (${idsString})`;

      // Izvršavanje upita
      await db.promise().query(query);
    } catch (error) {
      throw new Error('Greška prilikom ažuriranja statusa: ' + error.message);
    }
  }

  //ovde saljemo recenicu koju smo dobili sa klijenta gde je samo izmenjeno p ili n i na osnovu
  //njega delujemo, sentiment je star iz baze i na osnovu p i n se menja u bazi ako ima potrebe
  //to treba zovemo u rutu kada korisnik svaki put klikne da glasa na klijnetu izvrsava se promena sentensa na klijentu i radi se
  //api poziv koji vrca taj sentense ovde na proveru i upis
  static async updateSentence(sentence,user_id) {
    try {
      console.log('recenica koja je stigla sa klijenta')
      console.log(sentence);

      // 1. Uzmi vrednosti p, n, sentiment i id iz prosleđene rečenice
      const { id, p, n, sentiment } = sentence;

      // 2. Provera i formiranje upita na osnovu vrednosti p, n i sentimenta
      let updateQuery = '';
      let updateValues = [];

      //ako korisnik nije siguran idemo na status 3
      if(sentence.status === 3){
        updateQuery = `UPDATE sentences SET status = ? WHERE id = ?`;
        updateValues = [3,id];
        console.log('recenica vracena ne promenjena');
      }else{
        if (p === 2 && sentiment === 'negativan') {
          // Ako je p = 2 i sentiment negativan, menjamo sentiment u pozitivan
          updateQuery = `UPDATE sentences SET sentiment = ?, p = ?, status = ? WHERE id = ?`;
          updateValues = ['pozitivan', 2, 2, id];
          console.log('recenica je presla iz negativno u pozitivno');
  
        } else if (n === 2 && sentiment === 'pozitivan') {
          // Ako je n = 2 i sentiment pozitivan, menjamo sentiment u negativan
          updateQuery = `UPDATE sentences SET sentiment = ?, n = ?, status = ? WHERE id = ?`;
          updateValues = ['negativan', 2, 2, id];
          console.log('recenica je presla iz pozitivno u negativno');
  
        } else if (n === 2 && sentiment === 'negativan') {
          // Ako je n = 2 i sentiment negativan, samo postavljamo status na 2
          updateQuery = `UPDATE sentences SET status = ? WHERE id = ?`;
          updateValues = [2, id];
          console.log('recenica je 100% negativna');
  
        } else if (p === 2 && sentiment === 'pozitivan') {
          // Ako je p = 2 i sentiment pozitivan, postavljamo samo status na 2
          updateQuery = `UPDATE sentences SET status = ? WHERE id = ?`;
          updateValues = [2, id];
          console.log('recenica je 100% pozitivna');
  
        } else if (p === 1 && n === 1) {
          // Ako su p = 1 i n = 1, postavljamo oba na 1 i status na 0 jer nije gotovo pitanje
          updateQuery = `UPDATE sentences SET p = ?, n = ?,status = ? WHERE id = ?`;
          updateValues = [1, 1, 0, id];
          console.log('izjednaceno p i n');
        } else if ((p === 1 && n === 0) || (p === 0 && n === 1)){
          //ako recenica nije ocenjena ili nije menjana onda status se vraca na 0
          updateQuery = `UPDATE sentences SET status = ? WHERE id = ?`;
          updateValues = [0, id];
          console.log("status 0 vraca recenicu");
        }
      }

      // Ako je potrebno izvršiti upit, izvršavamo ga
      if (updateQuery) {
        await db.promise().query(updateQuery, updateValues);
        console.log(`Uspešno ažuriran status za rečenicu sa ID-em ${id}`);
        await this.insertSentimentAnalysis(id,user_id);
      } else {
        console.log('Nema potrebe za ažuriranjem rečenice sa ID-em', id);
      }






    } catch (error) {
      throw new Error('Greška pri ažuriranju rečenice: ' + error.message);
    }
  }

  static async insertSentimentAnalysis(id,user_id){
    try {
      const query = `INSERT INTO sentiment_analysis (annotator_id, sentence_id,created_at) 
                      VALUES (?,? , NOW());`
                      
      await db.promise().query(query,[user_id,id]);
    } catch (error) {
      throw new Error('Greška pri unosu sentimenta: ' + error.message);
    }
  }

  static async getUpdatedSentences24h() {
    try {
      const query = `
        SELECT * FROM sentences 
        WHERE status = 2 
        AND updated_at >= NOW() - INTERVAL 1 DAY
      `; // Ovaj upit dobija sve recenice sa statusom 2 koje su ažurirane u poslednjih 24h

      const [rows] = await db.promise().query(query);
      return rows; // Vraća sve recenice koje zadovoljavaju uslove
    } catch (error) {
      throw new Error('Error getting sentences with status 2 in last 24h: ' + error.message);
    }
  }

  static async getAllUpdatedSentences() {
    try {
      const query = `
        SELECT * FROM sentences 
        WHERE status = 2
      `; // Ovaj upit dobija sve recenice sa statusom 2 koje su ažurirane u poslednjih 24h

      const [rows] = await db.promise().query(query);
      return rows; // Vraća sve recenice koje zadovoljavaju uslove
    } catch (error) {
      throw new Error('Error getting sentences with status 2 in last 24h: ' + error.message);
    }
  }

  static async getNotSureSentences() {
    try {
      const query = `
        SELECT * FROM sentences 
        WHERE status = 3
      `; // Ovaj upit dobija sve recenice sa statusom 2 koje su ažurirane u poslednjih 24h

      const [rows] = await db.promise().query(query);
      return rows; // Vraća sve recenice koje zadovoljavaju uslove
    } catch (error) {
      throw new Error('Error getting sentences with status 2 in last 24h: ' + error.message);
    }
  }

  static async getNotProcessSentences() {
    try {
      const query = `
        SELECT * FROM sentences 
        WHERE status = 0
      `;
      const [rows] = await db.promise().query(query);
      return rows; // Vraća sve recenice koje zadovoljavaju uslove
    } catch (error) {
      throw new Error('Error getting sentences with status 0: ' + error.message);
    }
  }
  

  static async generateCSV(type) {
    try {
      let rows = null;
      //ako je gotova
      if(type === 2){
        rows = await this.getAllUpdatedSentences();
      }
      //ako je neodredjena
      else if(type === 3){
        rows = await this.getNotSureSentences();
      }
      else if(type === 0){
        rows = await this.getNotProcessSentences();
      }

      // SQL upit za izlistavanje svih recenica sa statusom 2
      

      // Proveravamo da li imamo podatke
      if (rows.length === 0) {
        throw new Error("Nema podataka sa statusom 2");
      }

      // Konvertujemo rezultate u CSV format
      const csv = parse(rows);

      // Definišemo putanju za fajl
      const filePath = path.join(__dirname, '../temp', `sentences_status_${type}_${Date.now()}.csv`);

      // Upisujemo CSV u fajl
      fs.writeFileSync(filePath, csv);

      // Vraćamo putanju fajla
      return filePath;
    } catch (error) {
      throw new Error('Greška pri generisanju CSV fajla: ' + error.message);
    }
  }

  static async getCountDoneSentences(){
    try {
      const query = `select count(*) as 'count' from sentences where status = 2`;
      const [rows] = await db.promise().query(query);
      return rows[0].count;
    } catch (error) {
      throw new Error('Greška pri dobijanju broja gotovih recenica: ' + error.message);
    }
  }

  static async getCountNotSureSentences(){
    try {
      const query = `select count(*) as 'count' from sentences where status = 3`;
      const [rows] = await db.promise().query(query);
      return rows[0].count;
    } catch (error) {
      throw new Error('Greška pri dobijanju broja neodredjenih recenica: ' + error.message);
    }
  }

  static async getCountFreeSentences(){
    try {
      const query = `select count(*) as 'count' from sentences where status = 0`;
      const [rows] = await db.promise().query(query);
      return rows[0].count;
    } catch (error) {
      throw new Error('Greška pri dobijanju broja slobodnih recenica: ' + error.message);
    } 
  }

}

module.exports = Sentence;
