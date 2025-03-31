const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class User {
  // Dodavanje novog korisnika
  static async create(firstName, lastName, email, password, role = 'visitor', bio = '', profileImage = '', status = 'active') {
    try {
      const hashedPassword = await bcrypt.hash(password, 10); // Šifrovanje lozinke

      const query = `INSERT INTO users (first_name, last_name, email, password, role, bio, profile_image, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const [results] = await db.promise().query(query, [firstName, lastName, email, hashedPassword, role, bio, profileImage, status]);

      return results;
    } catch (error) {
      throw new Error('Error creating user: ' + error.message);
    }
  }

  // Pronalazak korisnika po emailu
  static async findByEmail(email) {
    try {
      const query = `SELECT * FROM users WHERE email = ?`;
      const [rows] = await db.promise().query(query, [email]);

      return rows[0]; // Vraća prvi korisnik koji odgovara
    } catch (error) {
      throw new Error('Error finding user by email: ' + error.message);
    }
  }

  // Pronalazak korisnika po ID-u
  static async findUserById(id) {
    try {
      const query = `
        SELECT u.*,
       GROUP_CONCAT(DISTINCT CONCAT(ue.degree, ',', ue.institution) ORDER BY ue.degree ASC SEPARATOR '|') AS education,
       GROUP_CONCAT(DISTINCT us.skill ORDER BY us.skill ASC) AS skills
      FROM users u
      LEFT JOIN usereducation ue ON u.id = ue.user_id
      LEFT JOIN userskills us ON u.id = us.user_id
      WHERE u.id = ?
      GROUP BY u.id;
      `;
  
      const [rows] = await db.promise().query(query, [id]);
  
      if (rows.length === 0) {
        return null;
      }
  
      const user = rows[0];
  
      // Split stringove sa zarezima u nizove
      
      user.skills = user.skills ? user.skills.split(',') : [];

      if (user.education) {
        user.education = user.education.split('|').map(entry => {
            const [degree, institution] = entry.split(',');
            return { degree, institution };
        });
      } else {
        user.education = [];
      }

      return user;
    } catch (error) {
      throw new Error('Error finding user by ID: ' + error.message);
    }
  }
  
  // Provera tačnosti lozinke
  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword); // Upoređuje unetu lozinku sa heširanom lozinkom
  }

  // Generisanje JWT tokena
  static generateAuthToken(userId,userEmail,userRole) {
    
            const token = jwt.sign(
                {    
                    id: userId,
                     email: userEmail,
                     role: userRole 
                },
                process.env.JWT_SECRET,
                { 
                    expiresIn: process.env.JWT_EXPIRES 
                }
            );
            return token
  }

  // Izlistavanje svih korisnika
  //izlistava sve usere sem admina i usera koji su anotatori
  static async getAllUsers(type = ' ') {
    try {

      let query = " ";

      if( type === 'all'){
         query = `SELECT * FROM users`;
      }
      else{
         query = `SELECT * FROM users where id !=7 and role != 'anotator1'`;
      }

      const [rows] = await db.promise().query(query);

      return rows; // Vraća sve korisnike
    } catch (error) {
      throw new Error('Error getting all users: ' + error.message);
    }
  }

  
  static async getAllResearchers() {
    try {

      let query = `  SELECT u.*,
       GROUP_CONCAT(DISTINCT CONCAT(ue.degree, ',', ue.institution) ORDER BY ue.degree ASC SEPARATOR '|') AS education,
       GROUP_CONCAT(DISTINCT us.skill ORDER BY us.skill ASC) AS skills
        FROM users u
        LEFT JOIN usereducation ue ON u.id = ue.user_id
        LEFT JOIN userskills us ON u.id = us.user_id
        WHERE u.role = 'researcher'
        GROUP BY u.id
        ORDER BY 
        FIELD(u.id, 3, 1, 2, 9, 10, 4, 5) > 0 DESC, 
        FIELD(u.id, 3, 1, 2, 9, 10, 4, 5), 
        u.id ASC; `;

      const query1 = `
        SELECT u.*,
        GROUP_CONCAT(DISTINCT CONCAT(ue.degree, ',', ue.institution) ORDER BY ue.degree ASC SEPARATOR '|') AS education,
        GROUP_CONCAT(DISTINCT us.skill ORDER BY us.skill ASC) AS skills
        FROM users u
        LEFT JOIN usereducation ue ON u.id = ue.user_id
        LEFT JOIN userskills us ON u.id = us.user_id
        WHERE u.role = 'researcher'
        GROUP BY u.id;
      `;
      
      const [rows] = await db.promise().query(query);
      
      // Procesiraj rezultate
      return rows.map(user => {
        user.skills = user.skills ? user.skills.split(',') : [];
        
        if (user.education) {
          user.education = user.education.split('|').map(entry => {
            const [degree, institution] = entry.split(',');
            return { degree, institution };
          });
        } else {
          user.education = [];
        }
        
        return user;
      });
    } catch (error) {
      throw new Error('Error fetching researchers: ' + error.message);
    }
  }

  // Izlistavanje svih studenata
  static async getAllStudents() {
    try {
      const query = `
        SELECT u.*,
        GROUP_CONCAT(DISTINCT CONCAT(ue.degree, ',', ue.institution) ORDER BY ue.degree ASC SEPARATOR '|') AS education,
        GROUP_CONCAT(DISTINCT us.skill ORDER BY us.skill ASC) AS skills
        FROM users u
        LEFT JOIN usereducation ue ON u.id = ue.user_id
        LEFT JOIN userskills us ON u.id = us.user_id
        WHERE u.role = 'student'
        GROUP BY u.id;
      `;
      
      const [rows] = await db.promise().query(query);
      
      // Procesiraj rezultate
      return rows.map(user => {
        user.skills = user.skills ? user.skills.split(',') : [];
        
        if (user.education) {
          user.education = user.education.split('|').map(entry => {
            const [degree, institution] = entry.split(',');
            return { degree, institution };
          });
        } else {
          user.education = [];
        }
        
        return user;
      });
    } catch (error) {
      throw new Error('Error fetching students: ' + error.message);
    }
  }

  // Azuriranje profila korisnika
  static async updateProfile(id, updates) {
    const allowedUpdates = ['first_name', 'last_name', 'email', 'bio', 'profile_image', 'status'];
    const updatesKeys = Object.keys(updates);

    // Provera da li su svi update-ovi dozvoljeni
    const isValidOperation = updatesKeys.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
      throw new Error('Invalid updates.');
    }

    try {
      const setQuery = updatesKeys.map((key) => `${key} = ?`).join(', ');
      const query = `UPDATE users SET ${setQuery} WHERE id = ?`;

      const params = [...updatesKeys.map((key) => updates[key]), id];
      const [result] = await db.promise().query(query, params);

      if (result.affectedRows === 0) {
        throw new Error('User not found');
      }

      return result;
    } catch (error) {
      throw new Error('Error updating profile: ' + error.message);
    }
  }

  // Brisanje korisnika
  static async deleteUser(id) {
    try {
      const query = `DELETE FROM users WHERE id = ?`;
      const [result] = await db.promise().query(query, [id]);

      if (result.affectedRows === 0) {
        throw new Error('User not found');
      }

      return result;
    } catch (error) {
      throw new Error('Error deleting user: ' + error.message);
    }
  }
}

module.exports = User;
