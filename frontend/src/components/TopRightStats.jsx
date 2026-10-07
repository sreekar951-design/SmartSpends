import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar as CalIcon, LogOut } from 'lucide-react';

export default function TopRightStats({ expenses, user, onLogout, viewDate }) {
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  // Computes total strictly for whatever month/year you are viewing on the calendar
  const monthlyTotal = expenses.reduce((acc, curr) => {
    const d = new Date(curr.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return acc + curr.amount;
    }
    return acc;
  }, 0);

  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-4 border border-purple-500/20 shadow-xl flex flex-wrap items-center gap-4 justify-between"
    >
      {/* User Welcome */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold uppercase shadow-md">
          {user?.username?.slice(0, 2) || 'US'}
        </div>
        <div>
          <p className="text-xs text-gray-400">Welcome Back,</p>
          <p className="font-semibold text-white tracking-wide">{user?.username}</p>
        </div>
      </div>

      {/* Dynamic Month Spend Tag */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <CalIcon className="w-3 h-3" /> {monthName} Total
          </p>
          <p className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">
            ₹{Math.round(monthlyTotal).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        title="Logout"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </motion.div>
  );
}