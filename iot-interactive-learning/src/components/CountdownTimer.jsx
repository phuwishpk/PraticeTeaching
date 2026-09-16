import { useEffect, useState } from 'react';
import './CountdownTimer.css';

const remainingAt = (startTime, duration) => Math.max(0, duration - (Date.now() - startTime) / 1000);

/**
 * Circular countdown timer (Kahoot-style).
 * Uses questionStartTime from roomState to calculate remaining time.
 * This is a soft timer — the server is what actually refuses a late answer.
 *
 * @param {number} startTime - timestamp when the question started (Date.now())
 * @param {number} duration  - total seconds for the countdown (default 30)
 * @param {number} size      - diameter in pixels (default 80)
 * @param {boolean} stopped  - freeze the timer when everyone has answered
 */
export default function CountdownTimer({ startTime, duration = 30, size = 80, stopped = false }) {
  const [, setTick] = useState(0);
  const remaining = remainingAt(startTime, duration);

  useEffect(() => {
    if (stopped) return undefined;
    // Four ticks a second is enough to land the digit on time, and it costs 15x fewer
    // renders than the animation frame loop this replaces — the phones running this are
    // cheap ones, and the countdown is on screen exactly while learners are tapping.
    const id = setInterval(() => {
      setTick(tick => tick + 1);
      if (remainingAt(startTime, duration) <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
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
  const isExpired = remaining <= 0;

  return (
    <div
      className="countdown"
      data-timer-status={stopped ? 'stopped' : isExpired ? 'expired' : 'running'}
      aria-label={stopped ? `หยุดเวลา เหลือ ${seconds} วินาที` : undefined}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className="countdown-progress"
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      {/* Center text */}
      <div className="countdown-face">
        <span
          key={seconds}
          className="countdown-value"
          style={{ fontSize: size * 0.32, color: isExpired ? '#ff4d4d' : color }}
        >
          {isExpired ? '⏰' : seconds}
        </span>
        {!isExpired && (
          <span
            className="countdown-unit"
            style={{ fontSize: size * 0.13, color: stopped ? '#50fa7b' : 'var(--text-secondary)' }}
          >
            {stopped ? 'หยุดแล้ว' : 'วินาที'}
          </span>
        )}
      </div>
    </div>
  );
}
