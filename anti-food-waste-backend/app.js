const express = require('express');
// pentru middleware
const bodyparser = require('body-parser');
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer=require('nodemailer');
//const groupRouter = require('./path/to/groupRouter');
//app.use('/groups', groupRouter);

const app = express();
const port = 5000; // Schimbă portul aici

const JWT_SECRET = 'cheia_secreta';

const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

const cors = require('cors');
app.use(cors());
app.use(bodyparser.json());

// Middleware pentru validarea token-ului JWT
function authenticateToken(req, res, next) {
  const authHeader = req.header('Authorization');
  console.log('Auth header:', authHeader); // pentru debug
  
  if (!authHeader) {
    console.log('Nu există header de autorizare');
    return res.status(403).json({ error: 'Lipsește header-ul de autorizare' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('Nu există token în header');
    return res.status(403).json({ error: 'Lipsește token-ul' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Eroare verificare token:', err);
      return res.status(403).json({ error: 'Token invalid sau expirat' });
    }
    
    console.log('User decodat din token:', user);
    req.user = user;
    next();
  });
}

// Obține toate produsele (pentru utilizatori autentificați)
app.get('/products', authenticateToken, (req, res) => {
  db.query('SELECT * FROM Produse WHERE id_client = ?', [req.user.id], (err, results) => {
    if (err) {
      res.status(500).send('Eroare la interogarea bazei de date');
    } else {
      res.json(results);
    }
  });
});

// Endpoint pentru adăugarea unui produs
app.post('/products', authenticateToken, (req, res) => {
  const { denumire, categorie, data_expirare} = req.body;
  const id_client= req.user.id;

  // Validarea datelor
  if (!denumire || !categorie || !data_expirare) {
    return res.status(400).send('Toate câmpurile sunt obligatorii!');
  }

  // Adăugăm produsul în baza de date
  db.query(
    'INSERT INTO Produse (denumire, categorie, data_expirare, id_client) VALUES (?, ?, ?, ?)',
    [denumire, categorie, data_expirare, id_client],
    (err, results) => {
      if (err) {
        return res.status(500).send('Eroare la adăugarea produsului');
      }
      res.status(201).json({ success: true, message: 'Produsul a fost adăugat cu succes!' });
    }
  );
});

// Endpoint pentru crearea unui nou utilizator
app.post('/register', (req, res) => {
  const { nume, email, parola } = req.body;

  // Verificăm dacă deja există utilizatorul
  db.query('SELECT * FROM Conturi_Utilizatori WHERE email=?', [email], (err, results) => {
    if (err) {
      return res.status(500).send('Eroare la verificarea utilizatorului');
    }

    if (results.length > 0) {
      return res.status(400).send('Utilizatorul cu acest email există deja');
    }

    // Criptarea parolei
    bcrypt.hash(parola, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).send('Eroare la criptarea parolei');
      }

      // Adăugăm utilizatorul în baza de date
      db.query(
        'INSERT INTO Conturi_Utilizatori (nume, email, parola) VALUES (?, ?, ?)',
        [nume, email, hashedPassword],
        (err, results) => {
          if (err) {
            return res.status(500).send('Eroare la crearea contului');
          }
          res.status(201).json({ success: true, message: 'Contul a fost creat cu succes!' });
        }
      );
    });
  });
});

// Endpoint pentru autentificare
app.post('/login', (req, res) => {
  const { email, parola } = req.body;
  // Verificăm dacă utilizatorul există
  db.query('SELECT * FROM Conturi_Utilizatori WHERE email=?', [email], (err, results) => {
    if (err) {
      return res.status(500).send('Eroare la verificarea utilizatorului');
    }
    if (results.length === 0) {
      return res.status(400).send('Email sau parola incorectă');
    }
    // Comparăm parola criptată cu cea trimisă de utilizator
    bcrypt.compare(parola, results[0].parola, (err, isMatch) => {
      if (err) {
        return res.status(500).send('Eroare la compararea parolei');
      }
      if (!isMatch) {
        return res.status(400).send('Email sau parola incorectă');
      }
      const token = jwt.sign({ id: results[0].id, email: results[0].email }, JWT_SECRET, {
        expiresIn: '1h',
      });
      res.status(200).json({ success: true, token });
    });
  });
});

// Endpoint pentru actualizarea unui produs
app.put('/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;  // ID-ul produsului care trebuie editat
  const { denumire, categorie, data_expirare } = req.body;  // Datele actualizate pentru produs

  // Validăm că toate câmpurile necesare sunt prezente
  if (!denumire || !categorie || !data_expirare) {
    return res.status(400).send('Toate câmpurile sunt obligatorii!');
  }

  // Verificăm dacă produsul există în baza de date
  db.query('SELECT * FROM Produse WHERE id = ? AND id_client = ?', [id, req.user.id], (err, results) => {
    if (err) {
      return res.status(500).send('Eroare la verificarea produsului');
    }
    if (results.length === 0) {
      return res.status(404).send('Produsul nu a fost găsit!');
    }

    // Actualizăm produsul în baza de date
    db.query(
      'UPDATE Produse SET denumire = ?, categorie = ?, data_expirare = ? WHERE id = ?',
      [denumire, categorie, data_expirare, id],
      (err, results) => {
        if (err) {
          return res.status(500).send('Eroare la actualizarea produsului');
        }
        res.status(200).json({ success: true, message: 'Produsul a fost actualizat cu succes!' });
      }
    );
  });
});

// Endpoint pentru ștergerea unui produs
app.delete('/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const id_client = req.user.id; // Obținem id-ul clientului din token

  // Verificăm mai întâi dacă produsul există și aparține utilizatorului
  db.query(
    'SELECT * FROM Produse WHERE id = ? AND id_client = ?',
    [id, id_client],
    (err, results) => {
      if (err) {
        console.error('Eroare la verificarea produsului:', err);
        return res.status(500).send('Eroare la verificarea produsului');
      }

      if (results.length === 0) {
        return res.status(404).send('Produsul nu a fost găsit sau nu aparține acestui utilizator');
      }

      // Dacă produsul există și aparține utilizatorului, îl ștergem
      db.query(
        'DELETE FROM Produse WHERE id = ? AND id_client = ?',
        [id, id_client],
        (err, deleteResults) => {
          if (err) {
            console.error('Eroare la ștergerea produsului:', err);
            return res.status(500).send('Eroare la ștergerea produsului');
          }

          res.status(200).json({
            success: true,
            message: 'Produsul a fost șters cu succes'
          });
        }
      );
    }
  );
});

// Endpoint pentru verificarea și marcarea automată a produselor care expiră în 2 zile
app.get('/products/expiring', authenticateToken, (req, res) => {
  const id_client = req.user.id;
  
  const query = `
    SELECT *, 
      CASE 
        WHEN DATEDIFF(data_expirare, CURDATE()) < 0 THEN 'EXPIRATE'
        WHEN DATEDIFF(data_expirare, CURDATE()) BETWEEN 0 AND 2 THEN 'DISPONIBILE'
        ELSE 'NORMALE'
      END as status
    FROM Produse 
    WHERE id_client = ? 
    AND (DATEDIFF(data_expirare, CURDATE()) <= 2 OR DATEDIFF(data_expirare, CURDATE()) < 0)
  `;

  db.query(query, [id_client], (err, results) => {
    if (err) {
      console.error('Eroare la verificarea produselor:', err);
      return res.status(500).send('Eroare la verificarea produselor');
    }

    const expiredProducts = results.filter(product => product.status === 'EXPIRATE');
    const availableProducts = results.filter(product => product.status === 'DISPONIBILE');

    res.json({
      expired: expiredProducts,
      available: availableProducts
    });
  });
});

//endpoint pentru marcare disponibilitate
app.post('/products/:id/share', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { isShared } = req.body;
  
  console.log('Request primit pentru share:', {
    id: id,
    isShared: isShared,
    userId: req.user.id
  });

  // Verificăm mai întâi dacă produsul există
  db.query(
    'SELECT * FROM Produse WHERE id = ? AND id_client = ?',
    [id, req.user.id],
    (err, results) => {
      if (err) {
        console.error('Eroare la verificarea produsului:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Eroare la verificarea produsului' 
        });
      }

      if (results.length === 0) {
        console.log('Produsul nu a fost găsit sau nu aparține utilizatorului');
        return res.status(404).json({ 
          success: false, 
          message: 'Produsul nu a fost găsit sau nu aparține utilizatorului' 
        });
      }

      // Dacă produsul există, îl actualizăm
      db.query(
        'UPDATE Produse SET disponibil = 1 WHERE id = ? AND id_client = ?',
        [id, req.user.id],  // Convertim boolean la 0/1 pentru MySQL
        (updateErr, updateResult) => {
          if (updateErr) {
            console.error('Eroare la actualizarea produsului:', updateErr);
            return res.status(500).json({ 
              success: false, 
              message: 'Eroare la actualizarea produsului' 
            });
          }
          
          console.log('Produs actualizat cu succes:', {
            id: id,
            affected_rows: updateResult.affectedRows
          });

          res.json({ 
            success: true, 
            message: 'Produsul a fost marcat ca disponibil' 
          });
        }
      );
    }
  );
});

// Endpoint pentru crearea unui grup nou
app.post('/groups', authenticateToken, (req, res) => {
  const { nume_grup, eticheta } = req.body;
  const id_creator = req.user.id; // din token

  // Mai întâi creăm grupul
  db.query(
    'INSERT INTO Grupuri_Prieteni (nume_grup, eticheta, id_creator) VALUES (?, ?, ?)',
    [nume_grup, eticheta, id_creator],
    (err, result) => {
      if (err) {
        console.error('Eroare la crearea grupului:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Eroare la crearea grupului' 
        });
      }

      const groupId = result.insertId; // Obținem ID-ul grupului nou creat

      // Adăugăm creatorul ca primul membru al grupului
      db.query(
        'INSERT INTO Membri_Grup (id_grup, id_membru) VALUES (?, ?)',
        [groupId, id_creator],
        (err) => {
          if (err) {
            console.error('Eroare la adăugarea creatorului în grup:', err);
            // Ștergem grupul creat dacă nu putem adăuga creatorul
            db.query('DELETE FROM Grupuri_Prieteni WHERE id = ?', [groupId]);
            return res.status(500).json({ 
              success: false, 
              message: 'Eroare la adăugarea creatorului în grup' 
            });
          }

          res.status(201).json({ 
            success: true, 
            message: 'Grup creat cu succes',
            groupId: groupId // Returnăm ID-ul grupului pentru frontend
          });
        }
      );
    }
  );
});

// Adăugare membru în grup
app.post('/groups/:groupId/members', authenticateToken, (req, res) => {
  const { groupId } = req.params;
  const { email } = req.body; // Primim email-ul membrului de adăugat

  // Mai întâi găsim utilizatorul după email
  db.query(
      'SELECT id FROM Conturi_Utilizatori WHERE email = ?',
      [email],
      (err, results) => {
          if (err) {
              return res.status(500).json({
                  success: false,
                  message: 'Eroare la căutarea utilizatorului'
              });
          }

          if (results.length === 0) {
              return res.status(404).json({
                  success: false,
                  message: 'Utilizatorul nu a fost găsit'
              });
          }

          const memberId = results[0].id;

          // Adăugăm utilizatorul în grup
          db.query(
              'INSERT INTO Membri_Grup (id_grup, id_membru) VALUES (?, ?)',
              [groupId, memberId],
              (err) => {
                  if (err) {
                      return res.status(500).json({
                          success: false,
                          message: 'Eroare la adăugarea în grup'
                      });
                  }

                  res.json({
                      success: true,
                      message: 'Membru adăugat cu succes în grup'
                  });
              }
          );
      }
  );
});

// Obținere grupuri pentru utilizatorul curent
app.get('/groups', authenticateToken, (req, res) => {
  console.log('User autentificat:', req.user);
  
  const userId = req.user.id;
  
  const query = `
  SELECT g.* 
  FROM Grupuri_Prieteni g
  LEFT JOIN Membri_Grup mg ON g.id = mg.id_grup
  WHERE g.id_creator = ? OR mg.id_membru = ?
  GROUP BY g.id
`;

  console.log('Query pentru grupuri:', query);
  console.log('UserId pentru query:', userId);

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error('Eroare SQL:', err);
      return res.status(500).json({ error: 'Eroare la obținerea grupurilor' });
    }

    console.log('Rezultate găsite:', results);
    res.json(results);
  });
});
//obtinerea membrilor curenti
app.get('/groups/:groupId/members', authenticateToken, (req, res) => {
  const { groupId } = req.params;
  
  const query = `
    SELECT cu.email 
    FROM Membri_Grup mg
    JOIN Conturi_Utilizatori cu ON mg.id_membru = cu.id
    WHERE mg.id_grup = ?
  `;

  db.query(query, [groupId], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Eroare la obținerea membrilor'
      });
    }

    res.json(results);
  });
});

// Obținere produse disponibile pentru un grup specific
app.get('/groups/:groupId/available-products', authenticateToken, (req, res) => {
  const { groupId } = req.params;

  db.query(
    `SELECT p.*, cu.email as email_utilizator 
     FROM Produse p
     JOIN Membri_Grup mg ON p.id_client = mg.id_membru
     JOIN Conturi_Utilizatori cu ON p.id_client = cu.id
     WHERE mg.id_grup = ? AND p.is_shared = true`,
    [groupId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Eroare la obținerea produselor'
        });
      }

      res.json(results);
    }
  );
});

app.delete('/groups/:groupId', authenticateToken, (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Verificăm mai întâi dacă utilizatorul este creatorul grupului
  db.query(
    'SELECT id_creator FROM Grupuri_Prieteni WHERE id = ?',
    [groupId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Eroare la verificarea grupului'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Grupul nu a fost găsit'
        });
      }

      if (results[0].id_creator !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Nu aveți permisiunea de a șterge acest grup'
        });
      }

      // Ștergem mai întâi toate înregistrările din Membri_Grup
      db.query(
        'DELETE FROM Membri_Grup WHERE id_grup = ?',
        [groupId],
        (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Eroare la ștergerea membrilor grupului'
            });
          }

          // Apoi ștergem grupul
          db.query(
            'DELETE FROM Grupuri_Prieteni WHERE id = ?',
            [groupId],
            (err) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: 'Eroare la ștergerea grupului'
                });
              }

              res.json({
                success: true,
                message: 'Grupul a fost șters cu succes'
              });
            }
          );
        }
      );
    }
  );
});

app.delete('/groups/:groupId/members/:email', authenticateToken, (req, res) => {
  const { groupId, email } = req.params;
  const userId = req.user.id;

  // Verificăm mai întâi dacă utilizatorul este creatorul grupului
  db.query(
    'SELECT id_creator FROM Grupuri_Prieteni WHERE id = ?',
    [groupId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Eroare la verificarea grupului'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Grupul nu a fost găsit'
        });
      }

      if (results[0].id_creator !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Nu aveți permisiunea de a șterge membri din acest grup'
        });
      }

      // Găsim ID-ul membrului după email
      db.query(
        'SELECT id FROM Conturi_Utilizatori WHERE email = ?',
        [email],
        (err, userResults) => {
          if (err || userResults.length === 0) {
            return res.status(404).json({
              success: false,
              message: 'Utilizatorul nu a fost găsit'
            });
          }

          const memberId = userResults[0].id;

          // Ștergem membrul din grup
          db.query(
            'DELETE FROM Membri_Grup WHERE id_grup = ? AND id_membru = ?',
            [groupId, memberId],
            (err) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: 'Eroare la ștergerea membrului din grup'
                });
              }

              res.json({
                success: true,
                message: 'Membrul a fost șters cu succes din grup'
              });
            }
          );
        }
      );
    }
  );
});

// Funcție pentru obținerea credențialelor emailului din baza de date
async function getEmailCredentials(userId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT email, parola FROM Conturi_Utilizatori WHERE id = ?', 
      [userId],
      (err, results) => {
        if (err) reject(err);
        if (results.length === 0) reject(new Error('Utilizator negăsit'));
        resolve(results[0]);
      }
    );
  });
}

// Funcție pentru obținerea detaliilor grupului
async function getGroupDetails(groupId) {
  return new Promise((resolve, reject) => {
    db.query('SELECT nume_grup FROM Grupuri_Prieteni WHERE id = ?',
      [groupId],
      (err, results) => {
        if (err) reject(err);
        if (results.length === 0) reject(new Error('Grup negăsit'));
        resolve(results[0]);
      }
    );
  });
}

//CLAIM PRODUSE
app.post('/products/:productId/claim', authenticateToken, async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id; // presupunem că authenticateToken adaugă user-ul la request

  try {
      // Actualizăm produsul pentru a-l marca ca revendicat
      await new Promise((resolve, reject) => {
          const query = 'UPDATE Produse SET is_claimed = TRUE, claimed_by = ?, claimed_at = NOW() WHERE id = ? AND is_claimed = FALSE';
          db.query(query, [userId, productId], (err, result) => {
              if (err) {
                  return reject(err);
              }
              if (result.affectedRows === 0) {
                  return reject(new Error('Produsul nu a putut fi revendicat sau a fost deja revendicat.'));
              }
              resolve();
          });
      });

      res.json({ message: 'Produsul a fost revendicat cu succes.' });
  } catch (error) {
      console.error('Eroare la revendicarea produsului:', error);
      res.status(500).json({ message: 'Eroare la server' });
  }
});


//pentru vizitarea profilului
app.get('/users/:email', authenticateToken, async (req, res) => {
  const { email } = req.params;
  console.log("Căutare utilizator după email:", email); // pentru debugging

  try {
      const user = await new Promise((resolve, reject) => {
          const query = 'SELECT id, nume, email FROM Conturi_Utilizatori WHERE email = ?';
          console.log("Query:", query, "Email:", email); // pentru debugging

          db.query(query, [email], (err, results) => {
              if (err) {
                  console.error("DB Error:", err);
                  reject(err);
              } else {
                  resolve(results[0]);
              }
          });
      });

      if (!user) {
          console.log("Nu s-a găsit utilizatorul cu email:", email);
          return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
      }

      res.json(user);
  } catch (error) {
      console.error('Eroare la obținerea informațiilor despre utilizator:', error);
      res.status(500).json({ message: 'Eroare la server' });
  }
});

app.get('/users/:email/shared-products', authenticateToken, async (req, res) => {
  const { email } = req.params;
  try {
      const user = await new Promise((resolve, reject) => {
          db.query('SELECT id FROM Conturi_Utilizatori WHERE email = ?', [email], (err, results) => {
              if (err) reject(err);
              else resolve(results[0]);
          });
      });

      if (!user) {
          return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
      }

      const products = await new Promise((resolve, reject) => {
          db.query('SELECT * FROM Produse WHERE id_client = ? AND is_shared = TRUE', [user.id], (err, results) => {
              if (err) reject(err);
              else resolve(results);
          });
      });
      res.json(products);
  } catch (error) {
      console.error('Eroare la obținerea produselor partajate ale utilizatorului:', error);
      res.status(500).json({ message: 'Eroare la server' });
  }
});

// INVITATII
// Configurează transportorul de email pentru Gmail
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD // folosește o parolă de aplicație
  }
});

// Verifică conexiunea la server
emailTransporter.verify(function(error, success) {
  if (error) {
    console.error('Eroare la conectarea la serverul SMTP:', error);
  } else {
    console.log('Server gata pentru trimiterea emailurilor');
  }
});

// Endpoint pentru trimiterea invitațiilor
app.post('/groups/:groupId/invite', authenticateToken, async (req, res) => {
  const { groupId } = req.params;
  const { emails } = req.body;
  const userId = req.user.id;

  console.log('Received emails:', emails); // Verifică ce primește backend-ul

  if (!Array.isArray(emails)) {
    return res.status(400).json({
      success: false,
      message: 'Emails should be an array'
    });
  }

  try {
    // Verifică dacă utilizatorul are dreptul să trimită invitații
    const groupCheck = await new Promise((resolve, reject) => {
      db.query(
        'SELECT id_creator, nume_grup FROM Grupuri_Prieteni WHERE id = ?',
        [groupId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    if (groupCheck.length === 0 || groupCheck[0].id_creator !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Nu aveți permisiunea de a trimite invitații pentru acest grup'
      });
    }

    const groupName = groupCheck[0].nume_grup;

    // Procesează fiecare invitație
    const invitationPromises = emails.map(async (email) => {
      // Verifică dacă emailul este deja membru
      const memberCheck = await new Promise((resolve, reject) => {
        db.query(
          'SELECT cu.id FROM Conturi_Utilizatori cu ' +
          'JOIN Membri_Grup mg ON cu.id = mg.id_membru ' +
          'WHERE cu.email = ? AND mg.id_grup = ?',
          [email, groupId],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });

      if (memberCheck.length > 0) {
        return {
          email,
          status: 'skip',
          message: 'Utilizatorul este deja membru'
        };
      }

      // Salvează invitația în baza de date
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO group_invitations (id_grup, email, status, data_invitatie) ' +
          'VALUES (?, ?, "pending", NOW()) ' +
          'ON DUPLICATE KEY UPDATE data_invitatie = NOW(), status = "pending"',
          [groupId, email],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      // Trimite email-ul de invitație
      const mailOptions = {
        from: process.env.GMAIL_EMAIL,
        to: email,
        subject: `Invitație în grupul ${groupName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Ai fost invitat în grupul ${groupName}!</h2>
            <p>Bună,</p>
            <p>Ai fost invitat să te alături grupului nostru de partajare a produselor.</p>
            <p>Pentru a accepta invitația, te rugăm să accesezi aplicația și să te conectezi cu contul tău.</p>
            <p>Cu stimă,<br>${process.env.GMAIL_EMAIL}</p>
          </div>
        `
      };

      try {
        await emailTransporter.sendMail(mailOptions);
        return {
          email,
          status: 'success',
          message: 'Invitație trimisă cu succes'
        };
      } catch (error) {
        console.error('Eroare detaliată la trimiterea emailului:', error); // Log detaliat
        return {
          email,
          status: 'error',
          message: 'Eroare la trimiterea emailului'
        };
      }
    });

    const results = await Promise.all(invitationPromises);

    res.json({
      success: true,
      message: 'Procesare invitații finalizată',
      results
    });

  } catch (error) {
    console.error('Eroare la procesarea invitațiilor:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la procesarea invitațiilor',
      error: error.message
    });
  }
});

// Endpoint pentru obținerea membrilor grupului
app.get('/groups/:groupId/members', authenticateToken, (req, res) => {
  const { groupId } = req.params;

  const query = `
      SELECT cu.id, cu.nume, cu.email
      FROM Membri_Grup mg
      JOIN Conturi_Utilizatori cu ON mg.id_membru = cu.id
      WHERE mg.id_grup = ?
  `;

  db.query(query, [groupId], (err, results) => {
      if (err) {
          return res.status(500).json({
              success: false,
              message: 'Eroare la obținerea membrilor'
          });
      }

      res.json(results);
  });
});

// Testarea trimiterea emailului
const sendTestEmail = async () => {
  try {
    const testMailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: 'deliaa86@gmail.com', // Înlocuiește cu adresa ta de email
      subject: 'Test Email',
      text: 'This is a test email to verify nodemailer'
    };

    await emailTransporter.sendMail(testMailOptions);
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Error sending test email:', error);
  }
};

//AUTOMATIZARE BAZA DE DATE
const port1=3000;
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234', // Folosește parola pentru utilizatorul root
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MariaDB!');

    // Creează baza de date dacă nu există
    connection.query('CREATE DATABASE IF NOT EXISTS anti_food_waste', (err, result) => {
        if (err) throw err;
        console.log('Database anti_food_waste created or already exists.');

        // Folosește baza de date
        connection.query('USE anti_food_waste', (err, result) => {
            if (err) throw err;
            console.log('Using anti_food_waste database.');

            // Citește fișierul SQL folosind calea relativă
            const sql = fs.readFileSync(path.join(__dirname, 'sql_backup', 'backup.sql')).toString();

            // Împarte fișierul SQL în comenzi individuale
            const queries = sql.split(';').filter(Boolean);

            // Filtrează și execută fiecare comandă individual
            queries.forEach((query, index) => {
                query = query.trim();
                // Ignoră comenzi specifice MySQL/MariaDB care pot provoca erori
                if (!query.startsWith('/*!') && !query.startsWith('--') && query) {
                    connection.query(query, (err, result) => {
                        if (err) {
                            console.error(`Error executing query #${index + 1}:`, err);
                            return;
                        }
                        console.log(`Query #${index + 1} executed successfully.`);
                    });
                }
            });

            connection.end();

            // Pornește serverul Node.js după inițializarea bazei de date
            // app.listen(port, () => {
            //     console.log(`Server running at http://localhost:${port}/`);
            // });
        });
    });
});

console.log('Începe serverul...');
app.listen(port, () => {
  console.log(`Serverul rulează la http://localhost:${port}`);
});