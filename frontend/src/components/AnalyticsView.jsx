import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, CreditCard, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Calendar, Utensils, Car, ShoppingBag, Film, Receipt, HelpCircle } from 'lucide-react';

const categoryColors = {
  'Food & Dining': '#f97316',
  'Transportation': '#3b82f6',
  'Shopping': '#ec4899',
  'Entertainment': '#a855f7',
  'Bills & Utilities': '#eab308',
  'Other': '#64748b',
};

export default function AnalyticsView({ expenses = [], viewDate = new Date(), onViewDateChange = () => {} }) {
  // Mode: 'month' | 'year'
  const [filterScope, setFilterScope] = useState('month');
  const [activeDate, setActiveDate] = useState(viewDate instanceof Date && !isNaN(viewDate) ? viewDate : new Date());

  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  const monthName = activeDate.toLocaleString('default', { month: 'long' });

  // Navigate between months
  const handlePrev = () => {
    const prev = new Date(year, month - 1, 1);
    setActiveDate(prev);
    onViewDateChange(prev);
  };

  const handleNext = () => {
    const next = new Date(year, month + 1, 1);
    setActiveDate(next);
    onViewDateChange(next);
  };

  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  // Filter based on Single Month or Entire Year
  const filteredExpenses = safeExpenses.filter((item) => {
    if (!item || !item.date) return false;
    const d = new Date(item.date);
    if (filterScope === 'year') {
      return d.getFullYear() === year;
    }
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const totalPeriodAmount = filteredExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Group by Category
  const categoryTotals = filteredExpenses.reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (Number(curr.amount) || 0);
    return acc;
  }, {});

  const categoryList = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalPeriodAmount > 0 ? Math.round((amount / totalPeriodAmount) * 100) : 0,
      color: categoryColors[category] || '#64748b'
    }))
    .sort((a, b) => b.amount - a.amount);

  // Group by Payment Mode
  const paymentTotals = filteredExpenses.reduce((acc, curr) => {
    const mode = curr.paymentMethod || 'UPI';
    acc[mode] = (acc[mode] || 0) + (Number(curr.amount) || 0);
    return acc;
  }, {});

  const paymentModes = [
    { name: 'UPI / GPay', key: 'UPI', icon: '📱', color: 'from-cyan-500 to-blue-500' },
    { name: 'Cash', key: 'Cash', icon: '💵', color: 'from-emerald-500 to-green-500' },
    { name: 'Card', key: 'Card', icon: '💳', color: 'from-purple-500 to-pink-500' },
    { name: 'Net Banking', key: 'Net Banking', icon: '🏦', color: 'from-amber-500 to-yellow-500' },
  ];

  // 📊 CALCULATE PAST 6 MONTHS COMPARISON
  const pastMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const mName = d.toLocaleString('default', { month: 'short' });
    const total = safeExpenses.reduce((acc, curr) => {
      if (!curr || !curr.date) return acc;
      const cDate = new Date(curr.date);
      if (cDate.getMonth() === m && cDate.getFullYear() === y) {
        return acc + (Number(curr.amount) || 0);
      }
      return acc;
    }, 0);
    pastMonths.push({ date: d, label: `${mName} '${y.toString().slice(-2)}`, total, isCurrent: i === 0 });
  }

  const maxMonthSpend = Math.max(...pastMonths.map((m) => m.total), 1);

  // SVG Donut calculation
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="space-y-6 select-none">
      {/* ================= TOP MONTH / SCOPE SWITCHER ================= */}
      <div className="glass-panel p-4 rounded-3xl border border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Month Arrows */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-white tracking-wide">
              {filterScope === 'year' ? `Full Year ${year}` : `${monthName} ${year}`}
            </h3>
            <p className="text-[11px] text-gray-400">
              Total Spent: <b className="text-cyan-300">₹{Math.round(totalPeriodAmount).toLocaleString('en-IN')}</b>
            </p>
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Month vs Full Year Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setFilterScope('month')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterScope === 'month' ? 'bg-cyan-500 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            {monthName} Only
          </button>
          <button
            onClick={() => setFilterScope('year')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterScope === 'year' ? 'bg-purple-500 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Full Year {year}
          </button>
        </div>
      </div>

      {/* ================= DONUT CHART & PAYMENT MODES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* DONUT CHART */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              Category Breakdown ({filterScope === 'year' ? `${year}` : `${monthName}`})
            </h3>
            <span className="text-xs text-gray-400 font-semibold">{categoryList.length} Categories</span>
          </div>

          {totalPeriodAmount === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              No spendings logged for {filterScope === 'year' ? year : `${monthName} ${year}`}.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* Glowing SVG Donut Chart */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="18"
                    fill="transparent"
                  />
                  {categoryList.map((cat, i) => {
                    const strokeDashoffset = circumference - (cat.percentage / 100) * circumference;
                    const rotation = (accumulatedPercent / 100) * 360;
                    accumulatedPercent += cat.percentage;

                    return (
                      <circle
                        key={i}
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke={cat.color}
                        strokeWidth="18"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{
                          transformOrigin: 'center',
                          transform: `rotate(${rotation}deg)`,
                          transition: 'stroke-dashoffset 0.8s ease'
                        }}
                      />
                    );
                  })}
                </svg>

                <div className="absolute flex flex-col items-center">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="text-base font-extrabold text-white">
                    ₹{totalPeriodAmount >= 1000 ? `${(totalPeriodAmount / 1000).toFixed(1)}k` : Math.round(totalPeriodAmount)}
                  </span>
                </div>
              </div>

              {/* Category Legend List */}
              <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
                {categoryList.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-gray-300 font-medium">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-white">₹{Math.round(cat.amount).toLocaleString('en-IN')}</span>
                      <span className="text-gray-400 text-[11px] font-normal w-9 text-right">({cat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PAYMENT MODES */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" /> Payment Modes
            </h3>
            <span className="text-[11px] text-gray-400">UPI vs Cash vs Cards</span>
          </div>

          <div className="space-y-4">
            {paymentModes.map((pm) => {
              const amount = paymentTotals[pm.key] || 0;
              const percent = totalPeriodAmount > 0 ? Math.round((amount / totalPeriodAmount) * 100) : 0;

              return (
                <div key={pm.key} className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span>{pm.icon}</span>
                      <span>{pm.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">₹{Math.round(amount).toLocaleString('en-IN')}</span>
                      <span className="text-gray-400 text-[10px]">({percent}%)</span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${pm.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300">
            💡 Tap any past month below to inspect that month's complete breakdown!
          </div>
        </div>
      </div>

      {/* ================= 3. MONTH-OVER-MONTH COMPARISON BARS ================= */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> Previous Months History & Comparison
            </h3>
            <p className="text-xs text-gray-400">Click any month to inspect its category chart and payment modes</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {pastMonths.map((pm, idx) => {
            const barHeight = Math.max(10, Math.round((pm.total / maxMonthSpend) * 100));
            const isSelected = filterScope === 'month' && pm.date.getMonth() === month && pm.date.getFullYear() === year;

            return (
              <div
                key={idx}
                onClick={() => {
                  setFilterScope('month');
                  setActiveDate(pm.date);
                  onViewDateChange(pm.date);
                }}
                className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${isSelected ? 'text-cyan-300' : 'text-gray-300'}`}>
                    {pm.label}
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                </div>

                {/* Vertical Bar Graph */}
                <div className="h-20 w-full flex items-end justify-center py-2">
                  <div className="w-8 rounded-lg bg-white/5 overflow-hidden flex items-end p-0.5">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{ duration: 0.6 }}
                      className={`w-full rounded-md ${
                        isSelected
                          ? 'bg-gradient-to-t from-cyan-500 to-purple-500'
                          : pm.total > 0
                          ? 'bg-purple-500/40'
                          : 'bg-white/10'
                      }`}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <span className={`text-xs font-extrabold ${isSelected ? 'text-pink-400' : 'text-gray-300'}`}>
                    ₹{pm.total >= 1000 ? `${(pm.total / 1000).toFixed(1)}k` : Math.round(pm.total)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}