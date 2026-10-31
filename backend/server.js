const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_123';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://sreekar254_db_user:VpntolDR4AH5kii7@cluster0.t3gqaqm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected permanently to Cloud MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Schema with strict: false so it reads both old and new MongoDB records safely
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, lowercase: true, trim: true },
  authType: { type: String, default: 'pin' },
  secretHash: { type: String },
  password: { type: String }, // Legacy field support
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'Food & Dining' },
  paymentMethod: { type: String, default: 'UPI' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { strict: false });

const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', expenseSchema);

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => res.status(200).send('awake'));

// --- AUTHENTICATION ROUTES ---

// 1. Create New Account
app.post('/api/auth/register-passcode', async (req, res) => {
  try {
    let { username, authType, secret } = req.body;
    if (!username || !secret) {
      return res.status(400).json({ error: 'Username and passcode/pattern are required.' });
    }

    username = username.trim().toLowerCase();
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken. Please choose another or login.' });
    }

    const secretHash = bcrypt.hashSync(secret.toString(), 10);
    const newUser = new User({
      username,
      authType: authType || 'pin',
      secretHash,
      password: secretHash
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '180d' });
    res.status(201).json({ token, user: { id: newUser._id, username: newUser.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Login with Passcode / Pattern (FIXED: Supports both old and new fields!)
app.post('/api/auth/login-passcode', async (req, res) => {
  try {
    let { username, secret } = req.body;
    if (!username || !secret) {
      return res.status(400).json({ error: 'Username and passcode/pattern required.' });
    }

    username = username.trim().toLowerCase();
    let user = await User.findOne({ username });

    // Handle sreekar / sreekar951
    if (!user && (username === 'sreekar' || username === 'sreekar951')) {
      user = await User.findOne({ username: { $in: ['sreekar', 'sreekar951'] } });
    }

    if (!user) {
      return res.status(404).json({ error: 'User does not exist. Click Create Account.' });
    }

    // Get the stored hash from either secretHash or legacy password
    const storedHash = user.secretHash || user.password;
    const secretStr = secret.toString();

    let isValid = false;

    // Direct check for master password or bcrypt compare
    if ((username === 'sreekar' || username === 'sreekar951') && secretStr === '100168') {
      isValid = true;
    } else if (storedHash) {
      isValid = bcrypt.compareSync(secretStr, storedHash);
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect Passcode or Pattern.' });
    }

    // Auto-update to secretHash so future logins are instant
    if (!user.secretHash) {
      user.secretHash = storedHash || bcrypt.hashSync(secretStr, 10);
      await user.save();
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '180d' });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// --- DATA-ISOLATED EXPENSES ROUTES ---
app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1, time: -1 });
    const formatted = expenses.map(e => ({
      id: e._id,
      title: e.title,
      amount: e.amount,
      category: e.category,
      paymentMethod: e.paymentMethod || 'UPI',
      date: e.date,
      time: e.time
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, paymentMethod, date, time } = req.body;
    const expense = new Expense({
      userId: req.user.id,
      title,
      amount: Math.round(Number(amount)),
      category: category || 'Food & Dining',
      paymentMethod: paymentMethod || 'UPI',
      date,
      time
    });
    await expense.save();
    res.status(201).json({
      id: expense._id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      date: expense.date,
      time: expense.time
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Multi-User Backend running at http://localhost:${PORT}`));