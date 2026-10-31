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
  paymentMethod: { type: String, default: 'UPI' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', expenseSchema);

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => res.status(200).send('awake'));

// --- AUTOMATIC DATA MERGE & PASSCODE LOGIN ---
app.post('/api/auth/passcode-login', async (req, res) => {
  try {
    // 1. Find or create the primary user
    let primaryUser = await User.findOne({ username: 'sreekar' });
    if (!primaryUser) {
      const hashedPassword = bcrypt.hashSync('100168', 10);
      primaryUser = new User({ username: 'sreekar', password: hashedPassword });
      await primaryUser.save();
    }

    // 2. Find ALL other previous accounts (like sreekar951, SREEKAR, etc.)
    const oldUsers = await User.find({ username: { $ne: 'sreekar' } });
    if (oldUsers.length > 0) {
      const oldUserIds = oldUsers.map(u => u._id);
      // Migrate ALL expenses from old accounts to the current primary user!
      await Expense.updateMany({ userId: { $in: oldUserIds } }, { userId: primaryUser._id });
    }

    // Also migrate any expenses that might be unlinked
    await Expense.updateMany({ userId: { $exists: false } }, { userId: primaryUser._id });

    const token = jwt.sign({ id: primaryUser._id, username: 'Sreekar' }, JWT_SECRET, { expiresIn: '180d' });
    res.json({ token, user: { id: primaryUser._id, username: 'Sreekar' } });
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

// --- EXPENSES ROUTES ---
app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    // Fetch all expenses belonging to primary user, plus any global expenses
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
    await Expense.findOneAndDelete({ _id: req.params.id });
    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-SMS Webhook
app.post('/api/expenses/auto-sms', async (req, res) => {
  try {
    const { smsBody } = req.body;
    let user = await User.findOne({ username: 'sreekar' });
    if (!user) {
      user = await User.findOne();
    }
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
      paymentMethod: 'UPI',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5)
    });
    await expense.save();
    res.status(201).json({ message: 'Saved from Bank SMS!', expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running with auto-data migration at http://localhost:${PORT}`));