import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Grid3X3, KeyRound, PlusCircle, ArrowLeft, Delete, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ onLoginSuccess }) {
  // Saved credentials or default fallback (100168)
  const savedPin = localStorage.getItem('smartspends_pin') || '100168';
  const savedPattern = localStorage.getItem('smartspends_pattern');

  const [authType, setAuthType] = useState('pin'); // 'pin' | 'pattern'
  const [mode, setMode] = useState('unlock'); // 'unlock' | 'create'
  const [createStep, setCreateStep] = useState(1); // 1 = enter new, 2 = confirm

  // PIN states
  const [pin, setPin] = useState('');
  const [firstEnteredPin, setFirstEnteredPin] = useState('');

  // Pattern states
  const [currentPattern, setCurrentPattern] = useState([]);
  const [firstEnteredPattern, setFirstEnteredPattern] = useState([]);

  // Feedback states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      if (createStep === 1) {
        // Step 1: Save first entry and ask for confirmation
        setFirstEnteredPin(enteredPin);
        setPin('');
        setCreateStep(2);
      } else {
        // Step 2: Confirm new passcode
        if (enteredPin === firstEnteredPin) {
          localStorage.setItem('smartspends_pin', enteredPin);
          setSuccessMsg('New Passcode Created Successfully!');
          setTimeout(() => onLoginSuccess(), 600);
        } else {
          setError('Passcodes do not match. Try again.');
          setPin('');
          setFirstEnteredPin('');
          setCreateStep(1);
        }
      }
    } else {
      // Unlock mode
      const targetPin = localStorage.getItem('smartspends_pin') || '100168';
      if (enteredPin === targetPin) {
        setSuccessMsg('Unlocked!');
        onLoginSuccess();
      } else {
        setError('Incorrect Passcode');
        setPin('');
      }
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
      if (Math.hypot(x - dotPixelX, y - dotPixelY) < 28) {
        return dot.id;
      }
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
      setError('Pattern must connect at least 4 dots');
      setCurrentPattern([]);
      return;
    }

    const patternStr = currentPattern.join('-');

    if (mode === 'create') {
      if (createStep === 1) {
        // Step 1: Save first pattern entry and ask for confirmation
        setFirstEnteredPattern(currentPattern);
        setCurrentPattern([]);
        setCreateStep(2);
      } else {
        // Step 2: Confirm new pattern
        if (patternStr === firstEnteredPattern.join('-')) {
          localStorage.setItem('smartspends_pattern', patternStr);
          setSuccessMsg('New Pattern Created Successfully!');
          setTimeout(() => onLoginSuccess(), 600);
        } else {
          setError('Patterns do not match. Try again.');
          setCurrentPattern([]);
          setFirstEnteredPattern([]);
          setCreateStep(1);
        }
      }
    } else {
      // Unlock mode
      const targetPattern = localStorage.getItem('smartspends_pattern');
      if (!targetPattern) {
        setError('No pattern saved. Click "Create Pattern" below.');
        setCurrentPattern([]);
      } else if (patternStr === targetPattern) {
        setSuccessMsg('Unlocked!');
        onLoginSuccess();
      } else {
        setError('Incorrect Pattern');
        setCurrentPattern([]);
      }
    }
  };

  const resetAllStates = () => {
    setPin('');
    setFirstEnteredPin('');
    setCurrentPattern([]);
    setFirstEnteredPattern([]);
    setError('');
    setSuccessMsg('');
    setCreateStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl px-4 select-none">
      {/* Background Orbs */}
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
        className="relative w-full max-w-sm p-6 glass-panel rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center"
      >
        <div className="p-3.5 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-2xl shadow-lg shadow-purple-500/30 mb-2">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
          SmartSpends
        </h1>

        {/* Dynamic Title based on Mode and Step */}
        <h2 className="text-sm font-bold tracking-widest text-gray-200 mt-2 uppercase text-center">
          {mode === 'create'
            ? createStep === 1
              ? authType === 'pin' ? 'ENTER NEW PASSCODE' : 'DRAW NEW PATTERN'
              : authType === 'pin' ? 'CONFIRM PASSCODE' : 'CONFIRM PATTERN'
            : authType === 'pin' ? 'ENTER 6-DIGIT PASSCODE' : 'DRAW PATTERN'}
        </h2>

        {/* Dynamic Subtitle */}
        <p className="text-xs text-gray-400 mt-0.5 mb-2 text-center">
          {mode === 'create'
            ? createStep === 1
              ? authType === 'pin' ? 'Choose any 6 numbers' : 'Connect at least 4 dots'
              : 'Re-enter to confirm'
            : ''}
        </p>

        {/* Error / Success Feedback */}
        <div className="h-5 mb-1 text-center">
          {error && <span className="text-xs text-red-400 font-semibold animate-pulse">{error}</span>}
          {successMsg && <span className="text-xs text-cyan-400 font-semibold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> {successMsg}</span>}
        </div>

        {/* ================= 6-DIGIT PASSCODE ================= */}
        {authType === 'pin' && (
          <div className="w-full flex flex-col items-center">
            {/* 6 Digit Indicators */}
            <div className="flex gap-3 mb-6">
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

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 w-64">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinDigit(num.toString())}
                  className="w-16 h-16 rounded-2xl bg-white/[0.04] hover:bg-white/10 active:scale-95 border border-white/5 text-xl font-bold text-white transition flex items-center justify-center shadow"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinDigit('0')}
                className="w-16 h-16 rounded-2xl bg-white/[0.04] hover:bg-white/10 active:scale-95 border border-white/5 text-xl font-bold text-white transition flex items-center justify-center shadow"
              >
                0
              </button>
              <button
                onClick={handlePinBackspace}
                className="w-16 h-16 rounded-2xl bg-white/[0.04] hover:bg-red-500/20 active:scale-95 border border-white/5 text-gray-300 hover:text-red-400 transition flex items-center justify-center shadow"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= 9-DOT PATTERN ================= */}
        {authType === 'pattern' && (
          <div
            ref={containerRef}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-64 h-64 relative touch-none cursor-pointer rounded-2xl bg-white/[0.02] border border-white/5 p-4 my-2"
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

        {/* Action Controls & Navigation */}
        <div className="flex flex-col items-center gap-2.5 w-full mt-4 pt-3 border-t border-white/10 text-xs">
          {mode === 'unlock' ? (
            <>
              {/* Create Passcode/Pattern button */}
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  resetAllStates();
                }}
                className="text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1.5 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {authType === 'pin' ? 'Create New Passcode' : 'Create New Pattern'}
              </button>

              {/* Switch between PIN and Pattern */}
              <button
                type="button"
                onClick={() => {
                  setAuthType(authType === 'pin' ? 'pattern' : 'pin');
                  resetAllStates();
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
            /* Cancel Creation mode */
            <button
              type="button"
              onClick={() => {
                setMode('unlock');
                resetAllStates();
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