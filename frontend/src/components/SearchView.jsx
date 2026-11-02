import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Tag, Trash2, X, Utensils, Car, ShoppingBag, Film, Receipt, HelpCircle } from 'lucide-react';

const categoryIcons = {
  'Food & Dining': <Utensils className="w-4 h-4 text-orange-400" />,
  'Transportation': <Car className="w-4 h-4 text-blue-400" />,
  'Shopping': <ShoppingBag className="w-4 h-4 text-pink-400" />,
  'Entertainment': <Film className="w-4 h-4 text-purple-400" />,
  'Bills & Utilities': <Receipt className="w-4 h-4 text-yellow-400" />,
  'Other': <HelpCircle className="w-4 h-4 text-gray-400" />,
};

const categories = ['All', 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Other'];
const paymentFilters = ['All', 'UPI', 'Cash', 'Card', 'Net Banking'];

export default function SearchView({ expenses = [], onDelete }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState('All');

  // Filter expenses based on Search Text, Category, and Payment Mode
  const filteredList = (Array.isArray(expenses) ? expenses : []).filter((item) => {
    if (!item) return false;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesPay = selectedPayment === 'All' || item.paymentMethod === selectedPayment;
    return matchesSearch && matchesCat && matchesPay;
  });

  const totalFilteredAmount = filteredList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-cyan-400" /> Search & Filter Transactions
        </h2>
        <p className="text-xs text-gray-400">Search by item name or filter by category and payment mode</p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title (e.g. Swiggy, Petrol, Groceries, Rent...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-10 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-sm shadow-xl"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-1.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Category Filter</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-white font-bold shadow-md shadow-cyan-500/25'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Mode Pills */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Payment Mode</label>
        <div className="flex flex-wrap gap-2">
          {paymentFilters.map((pm) => (
            <button
              key={pm}
              onClick={() => setSelectedPayment(pm)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedPayment === pm
                  ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/25'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {pm}
            </button>
          ))}
        </div>
      </div>

      {/* Results Summary Tag */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
        <span className="text-gray-300">
          Showing <b>{filteredList.length}</b> {filteredList.length === 1 ? 'transaction' : 'transactions'}
        </span>
        <span className="text-pink-400 font-extrabold text-sm">
          Total: -₹{Math.round(totalFilteredAmount).toLocaleString('en-IN')}
        </span>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center text-gray-500 text-sm"
            >
              No matching transactions found. Try searching for something else!
            </motion.div>
          ) : (
            filteredList.map((exp) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-2xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    {categoryIcons[exp.category] || <HelpCircle className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{exp.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" /> {exp.date}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px]">
                        {exp.paymentMethod || 'UPI'}
                      </span>
                    </div>
                  </div>
                </div>

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