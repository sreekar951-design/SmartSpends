import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import AuthModal from './components/AuthModal';
import TopRightStats from './components/TopRightStats';
import AnimatedCalendar from './components/AnimatedCalendar';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  // Check both localStorage (persistent) and sessionStorage (temporary)
  const initialToken = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  const initialUser = localStorage.getItem('user') || sessionStorage.getItem('user');

  const [user, setUser] = useState(initialUser ? JSON.parse(initialUser) : null);
  const [token, setToken] = useState(initialToken);
  const [expenses, setExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const fetchExpenses = async (jwtToken) => {
    if (!jwtToken) return;
    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
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

      const handleFocus = () => fetchExpenses(token);
      window.addEventListener('focus', handleFocus);

      const interval = setInterval(() => {
        fetchExpenses(token);
      }, 10000);

      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(interval);
      };
    }
  }, [token]);

  const handleLoginSuccess = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    fetchExpenses(jwtToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
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

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-100 p-4 md:p-8 relative selection:bg-purple-500 selection:text-white">
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[160px] pointer-events-none" />

      {!user ? (
        <AuthModal onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
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

          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFormOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
            >
              <Plus className="w-5 h-5" /> Add Spending
            </motion.button>
          </div>

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
              />
            </div>
          </div>

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