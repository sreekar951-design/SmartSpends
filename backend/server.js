const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_123';

// YOUR PERMANENT CLOUD MONGODB DATABASE LINK:
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://sreekar254_db_user:VpntolDR4AH5kii7@cluster0.t3gqaqm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to Cloud Database
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected permanently to Cloud MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Database Models
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'Food & Dining' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', expenseSchema);

app.use(cors());
app.use(express.json());

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

// --- AUTHENTICATION ROUTES ---

// 1. Register
app.post('/api/auth/register', async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

    username = username.trim().toLowerCase();
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists.' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '60d' });
    res.status(201).json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

    username = username.trim().toLowerCase();
    const user = await User.findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '60d' });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    let { username, newPassword } = req.body;
    username = username.trim().toLowerCase();

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const user = await User.findOneAndUpdate({ username }, { password: hashedPassword });
    if (!user) return res.status(404).json({ error: 'Username not found.' });

    res.json({ message: 'Password reset successful!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXPENSES ROUTES ---

// Get all expenses
app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1, time: -1 });
    const formatted = expenses.map(e => ({
      id: e._id,
      title: e.title,
      amount: e.amount,
      category: e.category,
      date: e.date,
      time: e.time
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new expense
app.post('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, date, time } = req.body;
    const expense = new Expense({
      userId: req.user.id,
      title,
      amount: Math.round(Number(amount)),
      category: category || 'Food & Dining',
      date,
      time
    });
    await expense.save();
    res.status(201).json({
      id: expense._id,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      time: expense.time
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete expense
app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bank SMS Auto-logger
app.post('/api/expenses/auto-sms', async (req, res) => {
  try {
    const { username, smsBody } = req.body;
    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const debitKeywords = ['debited', 'spent', 'paid', 'sent', 'transferred', 'withdrawn'];
    if (!debitKeywords.some(w => smsBody.toLowerCase().includes(w))) {
      return res.json({ message: 'Ignored non-debit SMS.' });
    }

    const amountMatch = smsBody.match(/(?:Rs\.?|INR|\₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
    if (!amount) return res.status(400).json({ error: 'No amount found.' });

    let merchant = 'Bank Transaction';
    const merchantMatch = smsBody.match(/(?:to|at|info\/|vpa)\s+([A-Za-z0-9\s._-]+?)(?:\s+on|\s+ref|\s+upi|\.|\,|$)/i);
    if (merchantMatch) merchant = merchantMatch[1].trim().slice(0, 30);

    let category = 'Other';
    const textLower = (smsBody + ' ' + merchant).toLowerCase();
    if (textLower.match(/swiggy|zomato|starbucks|restaurant|cafe|food/)) category = 'Food & Dining';
    else if (textLower.match(/uber|ola|rapido|petrol|fuel/)) category = 'Transportation';
    else if (textLower.match(/amazon|flipkart|myntra|shopping/)) category = 'Shopping';
    else if (textLower.match(/netflix|hotstar|spotify|cinema/)) category = 'Entertainment';

    const now = new Date();
    const expense = new Expense({
      userId: user._id,
      title: merchant,
      amount: Math.round(amount),
      category,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5)
    });
    await expense.save();
    res.status(201).json({ message: 'Saved from Bank SMS!', expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Cloud Backend running at http://localhost:${PORT}`));