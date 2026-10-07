import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AnimatedCalendar({ expenses, selectedDate, onSelectDate, viewDate, onViewDateChange }) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Navigate to previous month
  const handlePrev = () => {
    onViewDateChange(new Date(year, month - 1, 1));
    onSelectDate(null); // reset day filter
  };

  // Navigate to next month
  const handleNext = () => {
    onViewDateChange(new Date(year, month + 1, 1));
    onSelectDate(null); // reset day filter
  };

  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  // Map expenses to days
  const getDaySpending = (dayNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayExpenses = expenses.filter((e) => e.date === dateStr);
    const sum = dayExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    return { count: dayExpenses.length, total: sum, dateStr };
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white tracking-wide">{monthName} {year}</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-gray-300"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-gray-300"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-gray-400">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty slots for start padding */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-20 rounded-2xl bg-white/[0.01] border border-transparent" />
        ))}

        {/* Days */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const { count, total, dateStr } = getDaySpending(dayNum);
          const isSelected = selectedDate === dateStr;

          return (
            <motion.div
              key={dayNum}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDate(selectedDate === dateStr ? null : dateStr)}
              className={`h-20 p-2 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-200 relative overflow-hidden ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20'
                  : count > 0
                  ? 'border-purple-500/40 bg-purple-500/10'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-gray-300'}`}>
                  {dayNum}
                </span>
                {count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>

              {count > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">{count} {count === 1 ? 'item' : 'items'}</p>
                  <p className="text-xs font-bold text-pink-400 truncate">
                    ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : Math.round(total)}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}