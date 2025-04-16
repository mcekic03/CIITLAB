const db = require('../config/db');
 // Pretpostavljam da imaš neki modul za konekciju sa bazom

class Blog {

  static async getBlogWithId(id) {
    try {
      const query = `select b.*, u.firstName,u.lastName,u.bio from blogs b
                      inner join users u on u.id = b.author_id where b.id = ?`;
        const [rows] = await db.promise().query(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return rows[0];
    } catch (err) {
      console.error('Error fetching blog with id:', err);
      throw new Error('Error fetching blog with id');
    }
  }
  // Metoda za izlistavanje svih blogova
  static async getAllBlogs() {
    try {
      // SQL upit za dobijanje svih blogova
      const query = `select b.*, u.firstName,u.lastName,u.bio from blogs b
                      inner join users u on u.id = b.author_id`;
      
      // Izvršavanje upita
      const [rows] = await db.promise().query(query);
      

      if (rows.length === 0) {
        return null;
      }
      const processedRows = await Promise.all(rows.map(async row => {
        const imagesUrls = row.imagesUrls ? row.imagesUrls.split(',') : [];
        return {
          ...row,
          imagesUrls
        };
      }));

      // Vraćanje blogova
      return processedRows;

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

  static async createBlog(blogData) {
    console.log(blogData);
  } 
}

module.exports = Blog;
