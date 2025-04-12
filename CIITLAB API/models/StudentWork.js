const db = require('../config/db'); // Povezivanje sa bazom

class StudentsWork {
  // 📌 1️⃣ Izlistavanje svih radova
  static async getAllWorks() {
    try {
      const query = `
        SELECT sw.*, u.firstName AS mentorFirstName, u.lastName AS mentorLastName
        FROM StudentsWork sw
        JOIN users u ON sw.mentor_id = u.id
        ORDER BY sw.created_at DESC
      `;
      const [rows] = await db.promise().query(query);
      return rows;
    } catch (err) {
      console.error('Error fetching works:', err);
      throw new Error('Database error');
    }
  }

  // 📌 2️⃣ Izlistavanje rada po ID-u
  static async getWorkById(id) {
    try {
      const query = `
        SELECT *
        FROM studentswork
        WHERE id = ?
      `;
      const [rows] = await db.promise().query(query, [id]);
      if (rows.length === 0) throw new Error('Work not found');
      return rows[0];
    } catch (err) {
      console.error('Error fetching work by ID:', err);
      throw new Error('Database error');
    }
  }

  // 📌 4️⃣ Izlistavanje radova po mentor_id
  static async getWorksByMentorId(mentor_id) {
    try {
      const query = `SELECT * FROM studentswork WHERE mentor_id = ? ORDER BY created_at DESC`;
      const [rows] = await db.promise().query(query, [mentor_id]);
      return rows;
    } catch (err) {
      console.error('Error fetching works by mentor ID:', err);
      throw new Error('Database error');
    }
  }

  // 📌 5️⃣ Brisanje rada po ID-u
  static async deleteWork(id) {
    try {
      const query = `DELETE FROM StudentsWork WHERE id = ?`;
      const [result] = await db.promise().query(query, [id]);
      if (result.affectedRows === 0) throw new Error('No work deleted. Check the ID.');
      return { message: 'Work deleted successfully', affectedRows: result.affectedRows };
    } catch (err) {
      console.error('Error deleting work:', err);
      throw new Error('Database error');
    }
  }

  // 📌 6️⃣ Kreiranje novog rada
  static async createWork(workData, mentor_id) {
    try {
      const query = `
        INSERT INTO StudentsWork 
        (firstName, lastName, title, description, graduationYear, link, mentor_id, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      
      const values = [
        workData.firstName,
        workData.lastName,
        workData.title,
        workData.description,
        workData.graduationYear,
        workData.url,
        mentor_id
      ];

      const [result] = await db.promise().query(query, values);
      return { 
        message: 'Work created successfully', 
        id: result.insertId,
        affectedRows: result.affectedRows 
      };
    } catch (err) {
      console.error('Error creating work:', err);
      throw new Error('Database error');
    }
  }

  static async updateWork(id, workData) {
    try {
      const query = `
        UPDATE studentswork 
        SET firstName = ?, lastName = ?, title = ?, description = ?, graduationYear = ?, link = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      const [result] = await db.promise().query(query, [
        workData.firstName,
        workData.lastName,
        workData.title,
        workData.description,
        workData.graduationYear,
        workData.link,
        id
      ]);
      return { 
        message: 'Work updated successfully', 
        affectedRows: result.affectedRows 
      };
    } catch (err) {
      console.error('Error updating work:', err);
      throw new Error('Database error');
    }
  }

}

module.exports = StudentsWork;
