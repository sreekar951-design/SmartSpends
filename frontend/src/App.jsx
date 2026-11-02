import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, TrendingUp } from 'lucide-react';
import AuthModal from './components/AuthModal';
import TopRightStats from './components/TopRightStats';
import AnimatedCalendar from './components/AnimatedCalendar';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Navbar from './components/Navbar';
import AnalyticsView from './components/AnalyticsView';
import BudgetView from './components/BudgetView';
import SearchView from './components/SearchView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'analytics' | 'budget' | 'search'
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  const [expenses, setExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // Auto-lock when minimized
  useEffect(() => {
    const handleAutoLock = () => {
      if (document.visibilityState === 'hidden') {
        setUser(null);
        setToken('');
      }
    };

    document.addEventListener('visibilitychange', handleAutoLock);
    window.addEventListener('pagehide', handleAutoLock);

    return () => {
      document.removeEventListener('visibilitychange', handleAutoLock);
      window.removeEventListener('pagehide', handleAutoLock);
    };
  }, []);

  const fetchExpenses = async (authToken) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Failed to load expenses', err);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchExpenses(token);
    }
  }, [token, user]);

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    fetchExpenses(authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setExpenses([]);
  };

  const handleAddExpense = async (newExpense) => {
    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newExpense)
      });
      if (res.ok) {
        const saved = await res.json();
        setExpenses([saved, ...expenses]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setExpenses(expenses.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Monthly Total for current viewDate
  const safeDate = viewDate instanceof Date && !isNaN(viewDate) ? viewDate : new Date();
  const currentMonth = safeDate.getMonth();
  const currentYear = safeDate.getFullYear();
  const monthName = safeDate.toLocaleString('default', { month: 'long' });

  const monthlyTotal = (Array.isArray(expenses) ? expenses : []).reduce((acc, curr) => {
    if (!curr || !curr.date) return acc;
    const d = new Date(curr.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return acc + (Number(curr.amount) || 0);
    }
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-100 p-4 md:p-8 relative selection:bg-purple-500 selection:text-white">
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none" />

      {!user ? (
        <AuthModal onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                SmartSpends
              </h1>
              <p className="text-xs text-gray-400">Personal Expense Tracker</p>
            </div>

            <TopRightStats 
              expenses={expenses} 
              user={user} 
              onLogout={handleLogout} 
              viewDate={viewDate}
            />
          </div>

          {/* PAGE NAVIGATION TABS */}
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Action Row: Monthly Card + Add Spending Button */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl shadow-lg">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {monthName} Total
                </p>
                <p className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">
                  ₹{Math.round(monthlyTotal).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFormOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
            >
              <Plus className="w-5 h-5" /> Add Spending
            </motion.button>
          </div>

          {/* ================= PAGE SWITCHER ================= */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <AnimatedCalendar
                  expenses={expenses}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  viewDate={viewDate}
                  onViewDateChange={setViewDate}
                />
              </div>

              <div className="lg:col-span-5">
                <ExpenseList
                  expenses={expenses}
                  onDelete={handleDeleteExpense}
                  filterDate={selectedDate}
                  onClearFilter={() => setSelectedDate(null)}
                  viewDate={viewDate}
                />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView 
              expenses={expenses} 
              viewDate={viewDate} 
              onViewDateChange={setViewDate} 
            />
          )}

          {activeTab === 'budget' && (
            <BudgetView 
              expenses={expenses} 
              viewDate={viewDate} 
            />
          )}

          {activeTab === 'search' && (
            <SearchView 
              expenses={expenses} 
              onDelete={handleDeleteExpense} 
            />
          )}

          {/* Add Expense Popup */}
          <ExpenseForm
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onAddExpense={handleAddExpense}
          />
        </div>
      )}
    </div>
  );
}