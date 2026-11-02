import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, CheckCircle, Edit3, Save } from 'lucide-react';

export default function BudgetView({ expenses = [], viewDate = new Date() }) {
  const safeDate = viewDate instanceof Date && !isNaN(viewDate) ? viewDate : new Date();
  const currentMonth = safeDate.getMonth();
  const currentYear = safeDate.getFullYear();
  const monthName = safeDate.toLocaleString('default', { month: 'long' });

  const budgetKey = `smartspends_budget_${currentYear}_${currentMonth}`;
  const [budgetLimit, setBudgetLimit] = useState(() => {
    return Number(localStorage.getItem(budgetKey)) || 20000;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetLimit.toString());

  // Month total spend
  const monthExpenses = (Array.isArray(expenses) ? expenses : []).filter((item) => {
    if (!item || !item.date) return false;
    const d = new Date(item.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = monthExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const remainingBudget = Math.max(0, budgetLimit - totalSpent);
  const spentPercent = budgetLimit > 0 ? Math.min(100, Math.round((totalSpent / budgetLimit) * 100)) : 0;
  const isOverBudget = totalSpent > budgetLimit;

  // Days left in this month calculation
  const now = new Date();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const isCurrentMonthView = now.getMonth() === currentMonth && now.getFullYear() === currentYear;
  const daysRemaining = isCurrentMonthView ? Math.max(1, daysInMonth - now.getDate() + 1) : daysInMonth;
  const dailyAllowance = Math.round(remainingBudget / daysRemaining);

  // Status color logic (🟢 Green < 70%, 🟡 Yellow 70-90%, 🔴 Red > 90%)
  let statusColor = 'from-emerald-500 to-green-500';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let statusText = 'On Track';

  if (isOverBudget) {
    statusColor = 'from-rose-500 to-red-600';
    badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse';
    statusText = 'Budget Exceeded!';
  } else if (spentPercent >= 85) {
    statusColor = 'from-rose-500 to-amber-500';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    statusText = 'Critical Alert';
  } else if (spentPercent >= 70) {
    statusColor = 'from-amber-500 to-yellow-500';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    statusText = 'Nearing Limit';
  }

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = Number(tempBudget);
    if (!isNaN(val) && val > 0) {
      setBudgetLimit(val);
      localStorage.setItem(budgetKey, val.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" /> Monthly Budget Goal
          </h2>
          <p className="text-xs text-gray-400">Budget management for {monthName} {currentYear}</p>
        </div>

        <button
          onClick={() => {
            setTempBudget(budgetLimit.toString());
            setIsEditing(!isEditing);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 text-xs font-semibold transition"
        >
          <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel' : 'Set Budget'}
        </button>
      </div>

      {/* Edit Budget Form */}
      {isEditing && (
        <form onSubmit={handleSaveBudget} className="p-4 glass-panel rounded-2xl border border-cyan-500/30 flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-300">New Budget: ₹</span>
          <input
            type="number"
            step="500"
            required
            value={tempBudget}
            onChange={(e) => setTempBudget(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400 text-sm"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/25"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </form>
      )}

      {/* Main Budget Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Total Monthly Budget</p>
            <p className="text-3xl font-extrabold text-white">₹{budgetLimit.toLocaleString('en-IN')}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${badgeColor}`}>
            {isOverBudget ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {statusText} ({spentPercent}%)
          </div>
        </div>

        {/* Large Visual Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPercent}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r ${statusColor} shadow-lg`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Spent: ₹{Math.round(totalSpent).toLocaleString('en-IN')}</span>
            <span>Target: ₹{budgetLimit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-gray-400">Remaining Budget</p>
            <p className={`text-xl font-bold mt-1 ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isOverBudget ? `-₹${Math.round(totalSpent - budgetLimit).toLocaleString('en-IN')}` : `₹${Math.round(remainingBudget).toLocaleString('en-IN')}`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-gray-400">Days Remaining</p>
            <p className="text-xl font-bold text-cyan-300 mt-1">{daysRemaining} Days</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-gray-400">Recommended Daily Spend</p>
            <p className="text-xl font-bold text-purple-300 mt-1">
              ₹{dailyAllowance.toLocaleString('en-IN')}/day
            </p>
          </div>
        </div>

        {/* Smart Advice */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-gray-300">
          {isOverBudget ? (
            <span className="text-rose-400 font-medium">
              ⚠️ You have exceeded your budget by ₹{Math.round(totalSpent - budgetLimit).toLocaleString('en-IN')}. Try reducing non-essential expenses for the rest of {monthName}.
            </span>
          ) : (
            <span>
              💡 Staying under <b className="text-cyan-300">₹{dailyAllowance.toLocaleString('en-IN')} per day</b> for the next {daysRemaining} days will keep you safely within your monthly budget goal!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}