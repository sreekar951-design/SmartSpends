import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Sparkles, KeyRound, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AuthModal({ onLoginSuccess }) {
  // mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState(localStorage.getItem('saved_username') || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const res = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reset password');

        setSuccessMsg(data.message);
        setTimeout(() => {
          setMode('login');
          setPassword('');
          setNewPassword('');
          setSuccessMsg('');
        }, 1500);
        return;
      }

      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      // Save credentials based on "Remember Me"
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('saved_username', username);
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl px-4">
      {/* Background Glows */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-80 h-80 bg-cyan-600/30 rounded-full blur-[100px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
        className="relative w-full max-w-md p-8 glass-panel rounded-3xl shadow-2xl border border-white/10"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3.5 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-2xl shadow-lg shadow-purple-500/30 mb-3">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            SmartSpends
          </h1>

          <h2 className="text-lg font-bold tracking-widest text-gray-200 mt-2 uppercase">
            {mode === 'register' ? 'CREATE ACCOUNT' : mode === 'forgot' ? 'RESET PASSWORD' : 'WELCOME'}
          </h2>
          
          <p className="text-xs text-gray-400 mt-0.5">
            {mode === 'register'
              ? 'Start tracking spendings seamlessly'
              : mode === 'forgot'
              ? 'Enter your username & new password'
              : 'Log in to inspect your financials'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl text-center"
          >
            {error}
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl text-center"
          >
            {successMsg}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Username</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="username"
                id="username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-all duration-300"
              />
            </div>
          </div>

          {mode === 'forgot' ? (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">New Password</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="new-password"
                  id="new-password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-all duration-300"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                    }}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Remember Me Checkbox */}
          {mode !== 'forgot' && (
            <div className="flex items-center gap-2 pt-1 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  rememberMe ? 'bg-cyan-500 border-cyan-400' : 'bg-white/5 border-white/20'
                }`}
              >
                {rememberMe && <Check className="w-3 h-3 text-black stroke-[3]" />}
              </div>
              <span className="text-xs text-gray-400 select-none">Remember my credentials on this device</span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition duration-200"
          >
            {loading
              ? 'Processing...'
              : mode === 'register'
              ? 'Register Account'
              : mode === 'forgot'
              ? 'Reset Password'
              : 'Login / Sign In'}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className="text-cyan-400 hover:underline font-medium"
            >
              ← Back to Login
            </button>
          ) : mode === 'register' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="text-cyan-400 hover:underline font-medium"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="text-cyan-400 hover:underline font-medium"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}