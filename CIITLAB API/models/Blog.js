const db = require('../config/db'); // Pretpostavljam da imaš neki modul za konekciju sa bazom

class Blog {
  // Metoda za izlistavanje svih blogova
  static async getAllBlogs() {
    try {
      // SQL upit za dobijanje svih blogova
      const query = 'SELECT * FROM blogs';
      
      // Izvršavanje upita
      const [rows] = await db.promise().query(query);
      
      // Vraćanje blogova
      return rows;

    } catch (err) {
      console.error('Error fetching blogs:', err);
      throw new Error('Error fetching blogs');
    }
  }

  // Metoda za brisanje bloga po ID-u
  static async deleteBlog(blogId) {
    try {
      // SQL upit za brisanje bloga na osnovu ID-a
      const query = 'DELETE FROM blogs WHERE id = ?';
      
      // Izvršavanje upita
      const [result] = await db.promise().query(query, [blogId]);

      // Proveravamo da li je blog uspešno obrisan
      if (result.affectedRows > 0) {
        return { message: 'Blog deleted successfully', affectedRows: result.affectedRows };
      } else {
        throw new Error('No blog found with the provided ID.');
      }

    } catch (err) {
      console.error('Error during delete operation:', err);
      throw new Error('Error during delete operation');
    }
  }
}

module.exports = Blog;
