const db = require('../config/db'); // Povezivanje sa bazom podataka

class Resource {
  // Metoda za pronalaženje resursa na osnovu researcher_id
  static async findByResearcherId(researcherId) {
    try {
      const query = `SELECT * FROM resources WHERE researcher_id = ?`;
      const [rows] = await db.promise().query(query, [researcherId]);

      return rows || []; // Vraća prazan niz ako nema resursa
    } catch (error) {
      throw new Error('Error finding resources by researcher ID: ' + error.message);
    }
  }

  static async addResource(title, description, url, researcher) {
    return new Promise((resolve, reject) => {
      try {
        // SQL upit za dodavanje resursa
        const query = 'INSERT INTO resources (title, description, url, researcher_id) VALUES (?, ?, ?, ?)';

        // Pozivamo upit za unos u bazu
        db.query(query, [title, description, url, researcher], (err, results) => {
          if (err) {
            console.error('Error inserting resource:', err);
            return reject({ status: 500, message: 'Error inserting resource' });
          }

          console.log('Resource inserted:', results);
          resolve({
            message: 'Resource added successfully!',
            resourceId: results.insertId,
          });
        });
      } catch (error) {
        console.error('Error adding resource:', error);
        reject({ status: 500, message: 'Server error' });
      }
    });
  }

  static async getAllResources() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM resources';

      db.query(query, (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return reject({ status: 500, message: 'Database query error' });
        }
        resolve(results);
      });
    });
  }

  static async getResearcherNameByResourceId(resourceId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.firstName, u.lastName 
        FROM users u
        JOIN resources r ON u.id = r.researcher_id
        WHERE r.id = ?;
      `;

      db.query(query, [resourceId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return reject({ status: 500, message: 'Database query error' });
        }

        if (results.length === 0) {
          return resolve(null); // Ako resurs nije pronađen, vraća null
        }

        resolve(results[0]); // Vraća objekat { firstName, lastName }
      });
    });
  }

  static async deleteResourceById(resourceId) {
    try {
      const query = `DELETE FROM resources WHERE id = ?`;
      const [result] = await db.promise().query(query, [resourceId]);

      if (result.affectedRows === 0) {
        throw new Error('Resource not found');
      }

      return result;
    } catch (error) {
      throw new Error('Error deleting resource: ' + error.message);
    }
  }

  static async updateResource(id, data) {
    try {
      const query = `
        UPDATE Resources 
        SET title = ?, description = ?, link = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      const [result] = await db.query(query, [data.title, data.description, data.link, id]);
      return { success: true, message: 'Resource updated successfully', affectedRows: result.affectedRows };
    } catch (error) {
      throw new Error('Failed to update resource');
    }
  }

  static async getResourceById(id) {
    try {
      const query = `SELECT * FROM resources WHERE id = ?`;
      const [result] = await db.promise().query(query, [id]);
      return result;
    } catch (error) {
      throw new Error('Failed to get resource by ID');
    }
  } 
}

module.exports = Resource;