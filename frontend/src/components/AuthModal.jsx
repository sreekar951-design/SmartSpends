import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Grid3X3, KeyRound, User, PlusCircle, ArrowLeft, Delete, CheckCircle2, UserCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AuthModal({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'create'
  const [createStep, setCreateStep] = useState(1); // 1 = username, 2 = enter new, 3 = confirm
  const [authType, setAuthType] = useState('pin'); // 'pin' | 'pattern'

  const [username, setUsername] = useState(localStorage.getItem('saved_username') || 'sreekar');
  const [isChangingUser, setIsChangingUser] = useState(false);

  const [pin, setPin] = useState('');
  const [firstEnteredPin, setFirstEnteredPin] = useState('');
  const [currentPattern, setCurrentPattern] = useState([]);
  const [firstEnteredPattern, setFirstEnteredPattern] = useState([]);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 9-Dot Canvas References
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineEnd, setLineEnd] = useState(null);

  const dots = [
    { id: 0, x: 20, y: 20 }, { id: 1, x: 50, y: 20 }, { id: 2, x: 80, y: 20 },
    { id: 3, x: 20, y: 50 }, { id: 4, x: 50, y: 50 }, { id: 5, x: 80, y: 50 },
    { id: 6, x: 20, y: 80 }, { id: 7, x: 50, y: 80 }, { id: 8, x: 80, y: 80 },
  ];

  // ------------------ PIN LOGIC ------------------
  const handlePinDigit = (digit) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');

      if (nextPin.length === 6) {
        processPin(nextPin);
      }
    }
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const processPin = (enteredPin) => {
    if (mode === 'create') {
      if (createStep === 2) {
        setFirstEnteredPin(enteredPin);
        setPin('');
        setCreateStep(3);
      } else if (createStep === 3) {
        if (enteredPin === firstEnteredPin) {
          executeRegister(enteredPin);
        } else {
          setError('Passcodes do not match. Try again.');
          setPin('');
          setFirstEnteredPin('');
          setCreateStep(2);
        }
      }
    } else {
      executeLogin(enteredPin);
    }
  };

  // Keyboard support for 6-digit PIN
  useEffect(() => {
    if (authType !== 'pin') return;
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) handlePinDigit(e.key);
      if (e.key === 'Backspace') handlePinBackspace();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, authType, mode, createStep, firstEnteredPin]);

  // ------------------ 9-DOT PATTERN LOGIC ------------------
  const getDotIndexFromPoint = (clientX, clientY) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (let dot of dots) {
      const dotPixelX = (dot.x / 100) * rect.width;
      const dotPixelY = (dot.y / 100) * rect.height;
      if (Math.hypot(x - dotPixelX, y - dotPixelY) < 28) return dot.id;
    }
    return null;
  };

  const handleTouchStart = (e) => {
    const point = e.touches ? e.touches[0] : e;
    setIsDrawing(true);
    setError('');
    const dot = getDotIndexFromPoint(point.clientX, point.clientY);
    if (dot !== null) setCurrentPattern([dot]);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing) return;
    const point = e.touches ? e.touches[0] : e;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLineEnd({ x: point.clientX - rect.left, y: point.clientY - rect.top });
    }
    const dot = getDotIndexFromPoint(point.clientX, point.clientY);
    if (dot !== null && !currentPattern.includes(dot)) {
      setCurrentPattern(prev => [...prev, dot]);
    }
  };

  const handleTouchEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLineEnd(null);

    if (currentPattern.length < 4) {
      setError('Connect at least 4 dots');
      setCurrentPattern([]);
      return;
    }

    const patternStr = currentPattern.join('-');

    if (mode === 'create') {
      if (createStep === 2) {
        setFirstEnteredPattern(currentPattern);
        setCurrentPattern([]);
        setCreateStep(3);
      } else if (createStep === 3) {
        if (patternStr === firstEnteredPattern.join('-')) {
          executeRegister(patternStr);
        } else {
          setError('Patterns do not match. Try again.');
          setCurrentPattern([]);
          setFirstEnteredPattern([]);
          setCreateStep(2);
        }
      }
    } else {
      executeLogin(patternStr);
    }
  };

  // ------------------ API AUTH CALLS ------------------
  const executeRegister = async (secret) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, authType, secret })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('saved_username', data.user.username);
      setSuccessMsg('Account Created Successfully!');
      setTimeout(() => onLoginSuccess(data.user, data.token), 600);
    } catch (err) {
      setError(err.message);
      resetPins();
    } finally {
      setLoading(false);
    }
  };

  const executeLogin = async (secret) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, secret })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('saved_username', data.user.username);
      setSuccessMsg('Unlocked!');
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
      setPin('');
      setCurrentPattern([]);
    } finally {
      setLoading(false);
    }
  };

  const resetPins = () => {
    setPin('');
    setFirstEnteredPin('');
    setCurrentPattern([]);
    setFirstEnteredPattern([]);
    setError('');
    setSuccessMsg('');
    setCreateStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl px-4 select-none overflow-y-auto py-6">
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm p-6 glass-panel rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center my-auto"
      >
        <div className="p-3 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-2xl shadow-lg shadow-purple-500/30 mb-2">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
          SmartSpends
        </h1>

        <h2 className="text-sm font-bold tracking-widest text-gray-200 mt-1 mb-1 uppercase text-center">
          {mode === 'create'
            ? createStep === 1
              ? 'CREATE ACCOUNT'
              : createStep === 2
              ? authType === 'pin' ? 'SET 6-DIGIT PASSCODE' : 'DRAW NEW PATTERN'
              : authType === 'pin' ? 'CONFIRM PASSCODE' : 'CONFIRM PATTERN'
            : authType === 'pin' ? 'ENTER 6-DIGIT PASSCODE' : 'DRAW PATTERN'}
        </h2>

        {/* Current User Badge in Login Mode */}
        {mode === 'login' && (
          <div className="flex items-center gap-2 mb-2 bg-white/[0.05] px-3 py-1 rounded-full border border-white/10 text-xs">
            {isChangingUser ? (
              <input
                type="text"
                autoFocus
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setIsChangingUser(false)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none w-28 text-center"
              />
            ) : (
              <>
                <span className="text-gray-400 flex items-center gap-1"><UserCheck className="w-3 h-3 text-cyan-400" /> User:</span>
                <span className="text-cyan-300 font-bold uppercase">{username}</span>
                <button
                  type="button"
                  onClick={() => setIsChangingUser(true)}
                  className="text-[10px] text-gray-400 hover:text-white underline ml-1"
                >
                  (switch)
                </button>
              </>
            )}
          </div>
        )}

        {/* Error / Success Feedback */}
        <div className="h-5 mb-1 text-center">
          {error && <span className="text-xs text-red-400 font-semibold animate-pulse">{error}</span>}
          {successMsg && <span className="text-xs text-cyan-400 font-semibold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> {successMsg}</span>}
          {loading && <span className="text-xs text-purple-400 font-semibold animate-pulse">Connecting...</span>}
        </div>

        {/* ================= STEP 1: CREATE ACCOUNT FORM ================= */}
        {mode === 'create' && createStep === 1 && (
          <div className="w-full space-y-4 my-2">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Account Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sreekar, Rahul, Priya"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">Choose how you want to lock your account:</p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!username.trim()) return setError('Please enter a username');
                  setAuthType('pin');
                  setCreateStep(2);
                }}
                className="flex-1 py-3 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <KeyRound className="w-4 h-4" /> 6-Digit PIN
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!username.trim()) return setError('Please enter a username');
                  setAuthType('pattern');
                  setCreateStep(2);
                }}
                className="flex-1 py-3 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Grid3X3 className="w-4 h-4" /> 9-Dot Pattern
              </button>
            </div>
          </div>
        )}

        {/* ================= 6-DIGIT PASSCODE PAD ================= */}
        {authType === 'pin' && (mode === 'login' || (mode === 'create' && createStep > 1)) && (
          <div className="w-full flex flex-col items-center">
            <div className="flex gap-3 mb-4">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                    pin.length > idx
                      ? 'bg-gradient-to-tr from-cyan-400 to-purple-400 border-cyan-300 scale-125 shadow-lg shadow-cyan-400/50'
                      : 'border-white/30 bg-white/5'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5 w-60">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinDigit(num.toString())}
                  className="w-16 h-13 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/10 active:scale-95 border border-white/5 text-xl font-bold text-white transition flex items-center justify-center shadow"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinDigit('0')}
                className="w-16 h-13 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/10 active:scale-95 border border-white/5 text-xl font-bold text-white transition flex items-center justify-center shadow"
              >
                0
              </button>
              <button
                onClick={handlePinBackspace}
                className="w-16 h-13 py-3 rounded-2xl bg-white/[0.04] hover:bg-red-500/20 active:scale-95 border border-white/5 text-gray-300 hover:text-red-400 transition flex items-center justify-center shadow"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= 9-DOT PATTERN CANVAS ================= */}
        {authType === 'pattern' && (mode === 'login' || (mode === 'create' && createStep > 1)) && (
          <div
            ref={containerRef}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-60 h-60 relative touch-none cursor-pointer rounded-2xl bg-white/[0.02] border border-white/5 p-4 my-1"
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {currentPattern.map((dotIdx, i) => {
                if (i === 0) return null;
                const prev = dots[currentPattern[i - 1]];
                const curr = dots[dotIdx];
                return (
                  <line
                    key={i}
                    x1={`${prev.x}%`}
                    y1={`${prev.y}%`}
                    x2={`${curr.x}%`}
                    y2={`${curr.y}%`}
                    stroke="#06b6d4"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                );
              })}
              {isDrawing && currentPattern.length > 0 && lineEnd && (
                <line
                  x1={`${dots[currentPattern[currentPattern.length - 1]].x}%`}
                  y1={`${dots[currentPattern[currentPattern.length - 1]].y}%`}
                  x2={lineEnd.x}
                  y2={lineEnd.y}
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {dots.map((dot) => {
              const isSelected = currentPattern.includes(dot.id);
              return (
                <div
                  key={dot.id}
                  style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-2 border-cyan-400 scale-125'
                        : 'bg-transparent'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full transition-all ${
                        isSelected
                          ? 'bg-cyan-400 shadow-lg shadow-cyan-400/80 scale-110'
                          : 'bg-white/40'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= BOTTOM ACTION BUTTONS ================= */}
        <div className="flex flex-col items-center gap-2.5 w-full mt-4 pt-3 border-t border-white/10 text-xs">
          {mode === 'login' ? (
            <>
              {/* PRIMARY PROMINENT CREATE ACCOUNT BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  resetPins();
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/30 rounded-xl text-white font-bold flex items-center justify-center gap-1.5 shadow transition"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400" /> Create New Account
              </button>

              {/* TOGGLE PIN / PATTERN */}
              <button
                type="button"
                onClick={() => {
                  setAuthType(authType === 'pin' ? 'pattern' : 'pin');
                  resetPins();
                }}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium transition"
              >
                {authType === 'pin' ? (
                  <>
                    <Grid3X3 className="w-3.5 h-3.5" /> Switch to 9-Dot Pattern Lock
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" /> Switch to 6-Digit Passcode
                  </>
                )}
              </button>
            </>
          ) : (
            /* BACK TO LOGIN BUTTON */
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetPins();
              }}
              className="text-gray-400 hover:text-white flex items-center gap-1.5 font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Unlock
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}