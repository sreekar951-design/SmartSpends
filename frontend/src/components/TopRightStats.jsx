import React from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, Calendar as CalIcon, LogOut } from 'lucide-react';

export default function TopRightStats({ expenses = [], user, onLogout, viewDate = new Date() }) {
  const safeDate = viewDate instanceof Date && !isNaN(viewDate) ? viewDate : new Date();
  const currentYear = safeDate.getFullYear();

  // Computes total strictly for the currently viewed YEAR (January to December)
  const yearlyTotal = (Array.isArray(expenses) ? expenses : []).reduce((acc, curr) => {
    if (!curr || !curr.date) return acc;
    const d = new Date(curr.date);
    if (d.getFullYear() === currentYear) {
      return acc + (Number(curr.amount) || 0);
    }
    return acc;
  }, 0);

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
          <p className="font-semibold text-white tracking-wide">{user?.username || 'Sreekar'}</p>
        </div>
      </div>

      {/* 🗓️ YEARLY SPEND CARD (NOW IN TOP-RIGHT) */}
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
        <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
          <CalendarRange className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <CalIcon className="w-3 h-3" /> {currentYear} Total
          </p>
          <p className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-300">
            ₹{Math.round(yearlyTotal).toLocaleString('en-IN')}
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