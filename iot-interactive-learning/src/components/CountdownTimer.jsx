import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Circular countdown timer component (Kahoot-style).
 * Uses questionStartTime from roomState to calculate remaining time.
 * This is a soft timer — it does NOT block answers after expiry.
 *
 * @param {number} startTime - timestamp when the question started (Date.now())
 * @param {number} duration  - total seconds for the countdown (default 30)
 * @param {number} size      - diameter in pixels (default 80)
 * @param {boolean} stopped  - freeze the timer when everyone has answered
 */
export default function CountdownTimer({ startTime, duration = 30, size = 80, stopped = false }) {
  const getRemaining = () => Math.max(0, duration - (Date.now() - startTime) / 1000);
  const [remaining, setRemaining] = useState(getRemaining);
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const left = getRemaining();
      setRemaining(left);
      if (left > 0 && !stopped) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    tick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startTime, duration, stopped]);

  const seconds = Math.ceil(remaining);
  const progress = remaining / duration; // 1 → 0

  // Color transitions: green → orange → red
  let color = '#50fa7b'; // green
  if (progress < 0.33) color = '#ff4d4d'; // red
  else if (progress < 0.6) color = '#ffb86c'; // orange

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const isExpired = remaining <= 0;

  return (
    <div data-timer-status={stopped ? 'stopped' : isExpired ? 'expired' : 'running'} aria-label={stopped ? `หยุดเวลา เหลือ ${seconds} วินาที` : undefined} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.span
          key={seconds}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            fontSize: size * 0.32,
            fontWeight: 800,
            color: isExpired ? '#ff4d4d' : color,
            lineHeight: 1,
          }}
        >
          {isExpired ? '⏰' : seconds}
        </motion.span>
        {!isExpired && (
          <span style={{
            fontSize: size * 0.13,
            color: stopped ? '#50fa7b' : 'var(--text-secondary)',
            marginTop: 2,
          }}>
            {stopped ? 'หยุดแล้ว' : 'วินาที'}
          </span>
        )}
      </div>
    </div>
  );
}
