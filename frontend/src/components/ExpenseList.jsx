import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Clock, Calendar, ShoppingBag, Utensils, Car, Film, Receipt, HelpCircle } from 'lucide-react';

const categoryIcons = {
  'Food & Dining': <Utensils className="w-4 h-4 text-orange-400" />,
  'Transportation': <Car className="w-4 h-4 text-blue-400" />,
  'Shopping': <ShoppingBag className="w-4 h-4 text-pink-400" />,
  'Entertainment': <Film className="w-4 h-4 text-purple-400" />,
  'Bills & Utilities': <Receipt className="w-4 h-4 text-yellow-400" />,
  'Other': <HelpCircle className="w-4 h-4 text-gray-400" />,
};

export default function ExpenseList({ expenses, onDelete, filterDate, onClearFilter }) {
  const displayExpenses = filterDate
    ? expenses.filter((item) => item.date === filterDate)
    : expenses;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Day-to-Day Transactions</h3>
          <p className="text-xs text-gray-400">
            {filterDate ? `Filtered by ${filterDate}` : 'All recorded activities'}
          </p>
        </div>
        {filterDate && (
          <button
            onClick={onClearFilter}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-400 transition"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
        <AnimatePresence>
          {displayExpenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center text-gray-500 text-sm"
            >
              No spending logged for this period.
            </motion.div>
          ) : (
            displayExpenses.map((exp) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
                className="p-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-2xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    {categoryIcons[exp.category] || <HelpCircle className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{exp.title}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" /> {exp.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" /> {exp.time}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount with Rupee symbol and no decimals */}
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-pink-400">
                    -₹{Math.round(exp.amount).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => onDelete(exp.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-opacity"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}