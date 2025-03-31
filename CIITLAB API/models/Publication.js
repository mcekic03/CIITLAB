const db = require('../config/db');
const axios = require("axios");
const cheerio = require("cheerio");

class Publication {
  // Dodavanje nove publikacije
  static async create(userId, url) {
    try {
      // SQL upit za umetanje nove publikacije u bazu
      const query = `
        INSERT INTO publications (user_id, url)
        VALUES (?, ?)
      `;
      
      const [results] = await db.promise().query(query, [userId, url]);

      return results;
    } catch (error) {
      throw new Error('Error creating publication: ' + error.message);
    }
  }

  // Pronalazak svih publikacija
  static async getAllPublications() {
    try {
      const query = `SELECT * FROM publications`;
      const [rows] = await db.promise().query(query);

      return rows; // Vraća sve publikacije
    } catch (error) {
      throw new Error('Error getting all publications: ' + error.message);
    }
  }

  // Pronalazak publikacija po korisniku (userId)
  static async getPublicationsByUser(userId) {
    try {
      const query = `SELECT * FROM publications WHERE user_id = ?`;
      const [rows] = await db.promise().query(query, [userId]);
      
      if(rows.length>0){
        return rows;
      }
      else{
        return null;
      }
      
       // Vraća publikacije koje pripadaju korisniku
    } catch (error) {
      throw new Error('Error getting publications by user: ' + error.message);
    }
  }

  // Ažuriranje URL-a publikacije
  static async updatePublicationUrl(id, newUrl) {
    try {
      // Provera da li postoji publikacija sa tim user_id
      const checkQuery = `SELECT * FROM publications WHERE user_id = ?`;
      const [existingPublication] = await db.promise().query(checkQuery, [id]);
  
      if (existingPublication.length > 0) {
        // Ako postoji, ažuriraj URL
        const updateQuery = `UPDATE publications SET url = ? WHERE user_id = ?`;
        const [result] = await db.promise().query(updateQuery, [newUrl, id]);
  
        if (result.affectedRows === 0) {
          throw new Error('Error updating publication URL');
        }
  
        return result; // Vraća rezultat ažuriranja
      } else {
        // Ako ne postoji, pozovi metodu create da kreira novu publikaciju
        const createResult = await this.create(id, newUrl);
        return createResult; // Vraća rezultat kreiranja nove publikacije
      }
    } catch (error) {
      throw new Error('Error updating or creating publication URL: ' + error.message);
    }
  }

  // Brisanje publikacije
  static async deletePublication(id) {
    try {
      const query = 'DELETE FROM Publications WHERE user_id = ?';
      const [result] = await db.promise().query(query, [id]);
      return { success: true, message: 'Publication deleted successfully', affectedRows: result.affectedRows };
    } catch (error) {
      throw new Error('Failed to delete publication');
    }
  }

  static async prebrojSveRedove(link) {
    let ukupnoRedova = 0;
    let start = 0;
    let korak = 21; // Broj redova po stranici
    let nastavi = true;

    while (nastavi) {
        try {
            const url = `${link}?startall=${start}`;
            console.log(`Preuzimam podatke sa: ${url}`);
            console.log(url);
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            let brojRedova = $("tbody tr").length; // Broji redove unutar <tbody>
            ukupnoRedova += brojRedova;

            if (brojRedova === 0) {
                nastavi = false; // Ako nema više redova, prekidamo petlju
            } else {
                start += korak; // Prelazimo na sledeću stranicu
            }
        } catch (error) {
            console.error(`Greška pri preuzimanju sa startall=${start}:`, error.message);
            nastavi = false;
        }
    }

    console.log(`Ukupan broj redova u tabeli: ${ukupnoRedova-1}`);
    let broj = ukupnoRedova-1;
    return broj;
  }

  static async updatePublication(id, data) {
    try {
      const query = `
        UPDATE Publications 
        SET title = ?, description = ?, link = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      const [result] = await db.promise().query(query, [data.title, data.description, data.link, id]);
      return { success: true, message: 'Publication updated successfully', affectedRows: result.affectedRows };
    } catch (error) {
      throw new Error('Failed to update publication');
    }
  }

}

module.exports = Publication;
