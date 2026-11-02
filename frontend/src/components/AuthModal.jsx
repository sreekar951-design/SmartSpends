import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnimatedCalendar({ expenses, selectedDate, onSelectDate, viewDate, onViewDateChange }) {
  const [direction, setDirection] = useState(0); // 1 = slide next, -1 = slide prev

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Slide to previous month (Swipe Right)
  const handlePrev = () => {
    setDirection(-1);
    onViewDateChange(new Date(year, month - 1, 1));
    onSelectDate(null);
  };

  // Slide to next month (Swipe Left)
  const handleNext = () => {
    setDirection(1);
    onViewDateChange(new Date(year, month + 1, 1));
    onSelectDate(null);
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

  // Animation variants for smooth sliding
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: 'easeOut' },
    },
    exit: (dir) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' },
    }),
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl overflow-hidden select-none">
      {/* Header (Arrow marks removed completely) */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-wide">{monthName} {year}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">👈 Swipe left or right to switch months 👉</p>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-gray-400">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Interactive Swipe / Slide Container */}
      <div className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = offset.x;
              // Swipe Left -> Next Month
              if (swipe < -45 || velocity.x < -350) {
                handleNext();
              }
              // Swipe Right -> Previous Month
              else if (swipe > 45 || velocity.x > 350) {
                handlePrev();
              }
            }}
            className="grid grid-cols-7 gap-2"
          >
            {/* Empty slots for start padding */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 rounded-2xl bg-white/[0.01] border border-transparent" />
            ))}

            {/* Days Grid */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const { count, total, dateStr } = getDaySpending(dayNum);
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={dayNum}
                  onClick={() => onSelectDate(selectedDate === dateStr ? null : dateStr)}
                  className={`h-20 p-2 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all duration-150 relative overflow-hidden active:scale-95 ${
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
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}