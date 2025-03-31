const db = require('../config/db'); // Uključi postojeću konekciju sa bazom


  // Metoda za dodavanje veština korisniku
class Skill {

    // Metoda za ažuriranje veština korisnika (dodavanje i brisanje)
    static async updateSkillsForUser(userId, skills) {
      return new Promise((resolve, reject) => {
        try {
          // 1. Izlistaj trenutne skillove korisnika iz baze
          db.query('SELECT skill FROM userskills WHERE user_id = ?', [userId], (err, results) => {
            if (err) {
              console.error('Error querying current skills:', err);
              return reject({ status: 500, message: 'Database query error' });
            }
  
            // Trenutne veštine korisnika u bazi
            const currentSkills = results.map(row => row.skill);
  
            // 2. Pronađi skillove koje treba dodati
            const skillsToAdd = skills.filter(skill => !currentSkills.includes(skill));
  
            // 3. Pronađi skillove koje treba obrisati (koji su u bazi ali nisu poslati)
            const skillsToDelete = currentSkills.filter(skill => !skills.includes(skill));
  
            // 4. Brisanje skillova koji su uklonjeni
            if (skillsToDelete.length > 0) {
              const deleteQuery = 'DELETE FROM userskills WHERE user_id = ? AND skill IN (?)';
              db.query(deleteQuery, [userId, skillsToDelete], (deleteErr) => {
                if (deleteErr) {
                  console.error('Error deleting skills:', deleteErr);
                  return reject({ status: 500, message: 'Error deleting skills' });
                }
  
                console.log('Skills deleted:', skillsToDelete);
  
                // 5. Dodavanje novih skillova
                if (skillsToAdd.length > 0) {
                  const placeholders = skillsToAdd.map(() => '(?, ?)').join(',');
                  const values = skillsToAdd.flatMap(skill => [userId, skill]);
  
                  const insertQuery = `INSERT INTO userskills (user_id, skill) VALUES ${placeholders}`;
  
                  db.query(insertQuery, values, (insertErr) => {
                    if (insertErr) {
                      console.error('Error inserting new skills:', insertErr);
                      return reject({ status: 500, message: 'Error inserting new skills' });
                    }
  
                    console.log('New skills inserted:', skillsToAdd);
                    resolve({
                      message: 'Skills updated successfully!',
                      skillsAdded: skillsToAdd,
                      skillsDeleted: skillsToDelete,
                    });
                  });
                } else {
                  // Ako nema novih skillova za dodavanje
                  resolve({
                    message: 'Skills updated successfully!',
                    skillsAdded: [],
                    skillsDeleted: skillsToDelete,
                  });
                }
              });
            } else {
              // Ako nema skillova za brisanje, samo dodaj nove
              if (skillsToAdd.length > 0) {
                const placeholders = skillsToAdd.map(() => '(?, ?)').join(',');
                const values = skillsToAdd.flatMap(skill => [userId, skill]);
  
                const insertQuery = `INSERT INTO userskills (user_id, skill) VALUES ${placeholders}`;
  
                db.query(insertQuery, values, (insertErr) => {
                  if (insertErr) {
                    console.error('Error inserting new skills:', insertErr);
                    return reject({ status: 500, message: 'Error inserting new skills' });
                  }
  
                  console.log('New skills inserted:', skillsToAdd);
                  resolve({
                    message: 'Skills updated successfully!',
                    skillsAdded: skillsToAdd,
                    skillsDeleted: [],
                  });
                });
              } else {
                resolve({
                  message: 'No new skills to add or delete.',
                  skillsAdded: [],
                  skillsDeleted: [],
                });
              }
            }
          });
        } catch (error) {
          console.error('Error updating skills:', error);
          reject({ status: 500, message: 'Server error' });
        }
      });
    }
}

module.exports = Skill;