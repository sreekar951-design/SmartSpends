import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, CreditCard, Utensils, Car, ShoppingBag, Film, Receipt, HelpCircle } from 'lucide-react';

const categoryColors = {
  'Food & Dining': '#f97316',
  'Transportation': '#3b82f6',
  'Shopping': '#ec4899',
  'Entertainment': '#a855f7',
  'Bills & Utilities': '#eab308',
  'Other': '#64748b',
};

const categoryIcons = {
  'Food & Dining': <Utensils className="w-4 h-4 text-orange-400" />,
  'Transportation': <Car className="w-4 h-4 text-blue-400" />,
  'Shopping': <ShoppingBag className="w-4 h-4 text-pink-400" />,
  'Entertainment': <Film className="w-4 h-4 text-purple-400" />,
  'Bills & Utilities': <Receipt className="w-4 h-4 text-yellow-400" />,
  'Other': <HelpCircle className="w-4 h-4 text-gray-400" />,
};

export default function AnalyticsView({ expenses = [], viewDate = new Date() }) {
  const safeDate = viewDate instanceof Date && !isNaN(viewDate) ? viewDate : new Date();
  const currentMonth = safeDate.getMonth();
  const currentYear = safeDate.getFullYear();
  const monthName = safeDate.toLocaleString('default', { month: 'long' });

  // 1. Filter month's expenses
  const monthExpenses = (Array.isArray(expenses) ? expenses : []).filter((item) => {
    if (!item || !item.date) return false;
    const d = new Date(item.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalMonthAmount = monthExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // 2. Group by Category
  const categoryTotals = monthExpenses.reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + (Number(curr.amount) || 0);
    return acc;
  }, {});

  const categoryList = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalMonthAmount > 0 ? Math.round((amount / totalMonthAmount) * 100) : 0,
      color: categoryColors[category] || '#64748b'
    }))
    .sort((a, b) => b.amount - a.amount);

  // 3. Group by Payment Mode (UPI vs Cash vs Card)
  const paymentTotals = monthExpenses.reduce((acc, curr) => {
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

  // SVG Donut Chart helper (strokeDasharray)
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-cyan-400" /> Spending Analytics
          </h2>
          <p className="text-xs text-gray-400">Category & Payment Mode Breakdown for {monthName} {currentYear}</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-cyan-300 font-bold">
          Total: ₹{Math.round(totalMonthAmount).toLocaleString('en-IN')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= 1. CATEGORY DONUT CHART ================= */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Category Breakdown</h3>

          {totalMonthAmount === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              No spendings logged for {monthName} {currentYear}.
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

                {/* Center Value */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-xs text-gray-400">Total</span>
                  <span className="text-base font-extrabold text-white">
                    ₹{totalMonthAmount >= 1000 ? `${(totalMonthAmount / 1000).toFixed(1)}k` : Math.round(totalMonthAmount)}
                  </span>
                </div>
              </div>

              {/* Category Legend List */}
              <div className="flex-1 w-full space-y-2.5 max-h-56 overflow-y-auto pr-1">
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

        {/* ================= 2. PAYMENT MODE INSIGHTS ================= */}
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
              const percent = totalMonthAmount > 0 ? Math.round((amount / totalMonthAmount) * 100) : 0;

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

                  {/* Progress Bar */}
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

          {/* Quick takeaway tip */}
          <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300">
            💡 {paymentTotals['UPI'] > (paymentTotals['Cash'] || 0)
              ? 'Most of your spendings are digital via UPI. Great for tracking!'
              : 'Remember to save receipts when spending cash to keep accurate records.'}
          </div>
        </div>
      </div>
    </div>
  );
}