const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_123';

app.use(cors());
app.use(express.json());

// --- AUTHENTICATION ROUTES ---

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;

  db.run(sql, [username, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }

    const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: this.lastID, username } });
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT * FROM users WHERE username = ?`;

  db.get(sql, [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username } });
  });
});

// --- EXPENSES ROUTES (USER ISOLATED) ---

// Get all expenses for authenticated user
app.get('/api/expenses', authMiddleware, (req, res) => {
  const sql = `SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, time DESC`;
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add new expense
app.post('/api/expenses', authMiddleware, (req, res) => {
  const { title, amount, category, date, time } = req.body;
  if (!title || !amount || !date || !time) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = `
    INSERT INTO expenses (user_id, title, amount, category, date, time)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [req.user.id, title, parseFloat(amount), category || 'General', date, time];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: this.lastID,
      user_id: req.user.id,
      title,
      amount: parseFloat(amount),
      category: category || 'General',
      date,
      time
    });
  });
});

// Delete expense
app.delete('/api/expenses/:id', authMiddleware, (req, res) => {
  const sql = `DELETE FROM expenses WHERE id = ? AND user_id = ?`;
  db.run(sql, [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Expense not found.' });
    res.json({ message: 'Expense deleted successfully.' });
  });
});

app.listen(PORT, () => console.log(`🚀 Backend running at http://localhost:${PORT}`));