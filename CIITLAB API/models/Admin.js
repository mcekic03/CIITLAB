const { type } = require("express/lib/response");
const db = require("../config/db");
const User = require("./User");
const fs = require('fs');
const { parse } = require('json2csv');
const path = require('path');
const Publication = require("./Publication");



class Admin {
    // Simulacija metoda - u pravom sistemu bi ovo bili upiti ka bazi podataka

    static async getTotalResearchers() {
        const query = `SELECT COUNT(*) AS total FROM users where role = 'researcher'`;
        const [rows] = await db.promise().query(query);
  
         // Vraća prvi korisnik koji odgovara
        return rows[0].total;
    }

    static async getTotalStudents() {
        const query = `SELECT COUNT(*) AS total FROM users where role = 'student'`;
        const [rows] = await db.promise().query(query);
  
         // Vraća prvi korisnik koji odgovara
        return rows[0].total;
    }

    static async getTotalAnotators() {
        const query = `SELECT COUNT(*) AS total FROM users where role in ('anotator1','anotator2')`;
        const [rows] = await db.promise().query(query);
  
         // Vraća prvi korisnik koji odgovara
        return rows[0].total;
    }

    static async getTotalAnotators1() {
        const query = `SELECT COUNT(*) AS total FROM users where role in ('anotator1')`;
        const [rows] = await db.promise().query(query);
  
         // Vraća prvi korisnik koji odgovara
        return rows[0].total;
    }

    // Broj publikacija
    static async getTotalPublicationsFor(id) {

        console.log(id);
        const pub = await Publication.getPublicationsByUser(id);
        if (pub) {
            const count = await Publication.prebrojSveRedove(pub[0].url);
            return count;
        }
        return 0;

    }

    static async  getTotalPublications() {
        const query = `SELECT url FROM publications`;

        const [rows] = await db.promise().query(query);

        let total = 0;
        for (let row of rows) {
            const count = await Publication.prebrojSveRedove(row.url);
            total += count;
        }   
        return total;
    }

    // Broj resursa
    static async getTotalResources() {
        const query = `SELECT COUNT(*) AS total FROM resources`;
        const [rows] = await db.promise().query(query);
        return rows[0].total;
    }

    static async getTotalResourcesFor(id) {
        const query = `SELECT COUNT(*) AS total FROM resources where researcher_id = ?`;
        const [rows] = await db.promise().query(query, [id]);
        return rows[0].total;
    }

    // Broj blogova
    static async getTotalBlogs() {
        const query = `SELECT COUNT(*) AS total FROM blogs`;
        const [rows] = await db.promise().query(query);
        return rows[0].total;
    }

    static async getTotalWorks() {
        const query = `SELECT COUNT(*) AS total FROM studentswork`;
        const [rows] = await db.promise().query(query);
        return rows[0].total;
    }

    // Poslednje aktivnosti
    static async getRecentActivity() {

        const query1 = `
                SELECT * 
                FROM logs
                ORDER BY changed_at DESC;

            `;
        const query = `
            SELECT 'blogs' AS type, id, updated_at
            FROM blogs
            WHERE updated_at > NOW() - INTERVAL 7 DAY
            UNION ALL
            SELECT 'users' AS type, id, updated_at
            FROM users
            WHERE updated_at > NOW() - INTERVAL 7 DAY
            UNION ALL
            SELECT 'publications' AS type, id, updated_at
            FROM publications
            WHERE updated_at > NOW() - INTERVAL 7 DAY
            UNION ALL
            SELECT 'resources' AS type, id, updated_at
            FROM resources
            WHERE updated_at > NOW() - INTERVAL 7 DAY
            UNION ALL
            SELECT 'Students Work' AS type, id, updated_at
            FROM studentswork
            WHERE updated_at > NOW() - INTERVAL 7 DAY;
        `;
        const [rows] = await db.promise().query(query1);

        const rr = this.getRelatedData(rows);

        return rr;
    }

    static async updateUser(user) {
        try {
          // Proveravamo da li lozinka nije hešovana i hešujemo je ako nije
          let passwordToSave = user.password;
    
          if (user.password && !isHash(user.password)) {
            const saltRounds = 10;
            passwordToSave = await bcrypt.hash(user.password, saltRounds);
          }
    
          // SQL upit za ažuriranje korisničkih podataka
          const query = `
            UPDATE users
            SET firstName = ?, lastName = ?, email = ?, password = ?, bio = ?, role = ?, status = ?
            WHERE id = ?
          `;
          const values = [user.firstName, user.lastName, user.email, passwordToSave, user.bio, user.role, user.status, user.userId];
    
          // Izvršavamo upit
          const [result] = await db.promise().query(query, values);
    
          // Proveravamo da li je upit uspešno izvršen
          if (result.affectedRows > 0) {
            return { message: 'User updated successfully', affectedRows: result.affectedRows };
          } else {
            throw new Error('No user was updated. Please check the user ID.');
          }
    
        } catch (err) {
          console.error('Error during password hashing or database operation:', err);
          throw new Error('Error during password hashing or database operation');
        }
    }
   
//podlogika za aktivnosti//////////////////////////

    static async getRelatedData(rows) {

        let results = [];
        // Iteriramo kroz sve redove
        for (let row of rows) {
            let data = null;

            switch(row.table_name) {
                case 'resources':
                    // Ako je tip resurs, uzimamo kolonu 'title' iz tabele 'resources'
                    data = await this.getResourceData(row.record_id);
                    break;
                case 'publications':
                    // Ako je tip publikacija, uzimamo kolonu 'url' iz tabele 'publications'
                    data = await this.getPublicationData(row.record_id);
                    break;
                case 'users':
                    // Ako je tip korisnik, uzimamo 'firstName' i 'lastName' iz tabele 'users'
                    data = await this.getUserData(row.record_id);
                    break;
                    case 'blogs':
                    // Ako je tip korisnik, uzimamo 'title' iz tabele 'users'
                    data = await this.getBlogsData(row.record_id);
                    break;
                    case 'studentswork':
                    // Ako je tip korisnik, uzimamo 'title' iz tabele 'users'
                    data = await this.getStudentsWorkData(row.record_id);
                    break;
                default:
                    data = null; // Ako tip nije prepoznat, ništa ne radimo
                    break;
            }
            // Ako smo dobili podatke, dodajemo ih u rezultate
            if (data) {
                results.push({
                    type: row.table_name,
                    timestamp: row.changed_at,
                    description: `Operation: `+row.operation_type+` in `+row.table_name.toUpperCase()+` | Object name: `+ data.bold() +` with id: `+row.record_id
                });
            }
        }
        return results; // Vraćamo sve rezultate
    }

    // Metoda za uzimanje podataka o resursu
    static async getResourceData(id) {
        const query = `SELECT title FROM resources WHERE id = ?`;
        const [rows] = await db.promise().query(query, [id]);
        return rows.length > 0 ? rows[0].title : null;
    }

    // Metoda za uzimanje podataka o publikaciji
    static async getPublicationData(id) {
        const query = `SELECT url FROM publications WHERE id = ?`;
        const [rows] = await db.promise().query(query, [id]);
        if (rows.length > 0) {
            return  rows[0].url
        }
        return null;
    }

    // Metoda za uzimanje podataka o korisniku
    static async getUserData(id) {
        const query = `SELECT firstName, lastName FROM users WHERE id = ?`;
        const [rows] = await db.promise().query(query, [id]);
        if (rows.length > 0) {
            return `${rows[0].firstName} ${rows[0].lastName}`;
        }
        return null;
    }

    static async getBlogsData(id) {
        const query = `SELECT title FROM blogs WHERE id = ?`;
        const [rows] = await db.promise().query(query, [id]);
        if (rows.length > 0) {
            return rows[0].title; // Vraća 'title' bloga
        }
        return null; // Ako nema rezultata, vraća null
    }

    static async getStudentsWorkData(id) {
        const query = `SELECT title FROM studentswork WHERE id = ?`;
        const [rows] = await db.promise().query(query, [id]);
        return rows.length > 0 ? rows[0].title : null;
    }

    //podlogika za updateUser////////////////////

    static isHash(password){
        // Provera da li lozinka izgleda kao bcrypt hash (počinje sa "$2a$" ili "$2b$")
        return password.startsWith('$2a$') || password.startsWith('$2b$');
    }

    // sentiment_analysis dashboard
    static async getSentimentCountPerAnnotator() {
        const query = `
            SELECT 
                u.id AS annotator_id, 
                CONCAT(u.firstName, ' ', u.lastName) AS annotator, 
                COUNT(sa.sentence_id) AS total_sentences,
                MAX(sa.created_at) AS last_time
                FROM sentiment_analysis sa
                JOIN users u ON sa.annotator_id = u.id
                GROUP BY sa.annotator_id, annotator;
        `;
        const [rows] = await db.promise().query(query);
        return rows;
    }
      
    static async AnotatorGenerateCSV(user_id) {
        try {
            const query = `select sa.created_at,s.sentence,s.sentiment,s.status from sentiment_analysis sa 
                            join sentences s on sa.sentence_id = s.id
                            where annotator_id = ?`;

            const [rows] = await db.promise().query(query,[user_id]);

            if (rows.length === 0) {
                throw new Error("Nema podataka sa statusom 2");
            }
      
            // Konvertujemo rezultate u CSV format
            const csv = parse(rows);
      
            // Definišemo putanju za fajl
            const filePath = path.join(__dirname, '../temp', `sentences_foruser_${user_id}_${Date.now()}.csv`);
      
            // Upisujemo CSV u fajl
            fs.writeFileSync(filePath, csv);
      
            // Vraćamo putanju fajla
            return filePath;
        } catch (error) {
            throw new Error('Greška pri generisanju CSV fajla: ' + error.message);
        }
    }
    
      

    
    


}

module.exports = Admin;
