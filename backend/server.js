// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./openings.db');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "A SECURISER EN PROD"; // à sécuriser en prod

app.use(cors());
app.use(express.json()); // pour parser le JSON

// ✅ Check si un nom d'ouverture existe déjà
app.post('/check-opening-name', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: "Name is required and must be a string." });
  }

  const query = `SELECT COUNT(*) AS count FROM openings WHERE LOWER(name) = LOWER(?)`;

  db.get(query, [name.trim()], (err, row) => {
    if (err) {
      console.error('Erreur SQL /check-opening-name:', err.message);
      return res.status(500).json({ error: "Erreur serveur." });
    }

    const exists = row.count > 0;
    res.json({ exists });
  });
});

// Liste des ouvertures officielles
app.get('/openings', (req, res) => {
  const sql = `SELECT * FROM openings`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Erreur SQL /openings:', err.message);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    const formatted = rows.map(row => ({
      id: row.id,
      name: row.name,
      fen: row.fen,
      moves: JSON.parse(row.moves)
    }));
    res.json(formatted);
  });
});

app.get('/community-openings', (req, res) => {
  const sql = `
    SELECT community_openings.id, community_openings.name, community_openings.fen, community_openings.moves, users.username
    FROM community_openings
    LEFT JOIN users ON community_openings.user_id = users.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Erreur SQL /community-openings:', err.message);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    const formatted = rows.map(row => ({
      id: row.id,
      name: row.name,
      fen: row.fen,
      moves: JSON.parse(row.moves),
      username: row.username || "Anonyme"
    }));
    res.json(formatted);
  });
});


// Création d'une nouvelle ouverture communautaire
app.post('/create-opening', authenticateToken, (req, res) => {
  const { name, fen, moves } = req.body;
  const userId = req.user.id; // ID utilisateur récupéré du token

  if (!name || !fen || !Array.isArray(moves)) {
    return res.status(400).json({ error: "Invalid data: name, fen, and moves are required." });
  }

  const id = `${userId}_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')}`;

  const sql = `INSERT INTO community_openings (id, name, fen, moves, user_id) VALUES (?, ?, ?, ?, ?)`;
  const params = [id, name.trim(), fen.trim(), JSON.stringify(moves), userId];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Erreur SQL /create-opening:', err.message);
      return res.status(500).json({ error: "Erreur serveur." });
    }

    res.status(201).json({ message: 'Ouverture ajoutée', id: id });
  });
});


app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Champs manquants" });

  const id = username.toLowerCase().replace(/\s+/g, '_');
  const passwordHash = bcrypt.hashSync(password, 10);

  db.run('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)', [id, username, passwordHash], function(err) {
    if (err) {
      console.error('Erreur SQL /register:', err.message);
      return res.status(500).json({ error: "Erreur serveur ou utilisateur existant" });
    }
    res.status(201).json({ message: "Utilisateur créé !" });
  });
});

// Login utilisateur
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) return res.status(401).json({ error: "Utilisateur introuvable" });

    if (bcrypt.compareSync(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });
      res.json({ token });
    } else {
      res.status(401).json({ error: "Mot de passe incorrect" });
    }
  });
});

app.get('/comments/:openingId', (req, res) => {
  const { openingId } = req.params;

  const sql = `
    SELECT comments.id, comments.message, comments.created_at, users.username
    FROM comments
    LEFT JOIN users ON comments.user_id = users.id
    WHERE comments.opening_id = ?
    ORDER BY comments.created_at ASC
  `;

  db.all(sql, [openingId], (err, rows) => {
    if (err) {
      console.error('Erreur SQL /comments:', err.message);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    res.json(rows);
  });
});


app.post('/comments', authenticateToken, (req, res) => {
  const { openingId, message } = req.body;
  const userId = req.user.id;

  if (!openingId || !message || message.length > 200) {
    return res.status(400).json({ error: "Champ invalide ou message trop long (max 200 caractères)." });
  }

  const sql = `
    INSERT INTO comments (opening_id, user_id, message)
    VALUES (?, ?, ?)
  `;
  db.run(sql, [openingId, userId, message], function(err) {
    if (err) {
      console.error('Erreur SQL /comments (POST):', err.message);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    res.status(201).json({ message: "Commentaire ajouté." });
  });
});



// Middleware pour authentifier
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ✅ Démarrer serveur
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
