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
      const query = 'DELETE FROM publications WHERE user_id = ?';
      const [result] = await db.promise().query(query, [id]);
      return { success: true, message: 'Publication deleted successfully', affectedRows: result.affectedRows };
    } catch (error) {
      throw new Error('Failed to delete publication');
    }
  }

  static async prebrojSveRedove(link) {
    
    const rp = this.extractRP(link);
    let linkic = "https://enauka.gov.rs/ToolForStatistics/rest/statistics/open/"+rp;
    try {
      const response = await fetch(linkic);

      if (!response.ok) {
          throw new Error(`HTTP greška! Status: ${response.status}`);
        }

          const data = await response.json();
          const spojeniNiz = [...data.other, ...data.open];
          return spojeniNiz.reduce((acc, num) => acc + num, 0);

        } catch (error) {
          console.error("Fetch greška:", error);
          return null;

        }

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

  static extractRP(inputString) {
    const match = inputString.match(/rp\d+/); // Traži "rp" + brojevi
    return match ? match[0] : null; // Ako nađe, vraća taj deo; ako ne, vraća null
}

}

module.exports = Publication;
