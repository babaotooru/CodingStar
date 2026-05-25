import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function AnimatedNumber({ value, duration = 1500, suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    if (value === 0 || value === null || value === undefined) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const startTime = performance.now();
    const step = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = start + (value - start) * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}{suffix}</span>;
}

function CircularProgress({ percentage, color, size = 120, strokeWidth = 8, delay = 0 }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercent / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = performance.now();
      const duration = 1500;
      const step = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedPercent(percentage * eased);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-100"
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
    </svg>
  );
}

function DistributionChart({ distribution, currentValue, color, label }) {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!distribution || Object.keys(distribution).length === 0) return null;

  const entries = Object.entries(distribution)
    .map(([key, count]) => ({ value: parseInt(key), count }))
    .sort((a, b) => a.value - b.value);
  
  const maxCount = Math.max(...entries.map(e => e.count), 1);

  return (
    <div className="mt-4">
      <p className="text-dark-400 text-xs mb-2">{label}</p>
      <div className="flex items-end gap-[2px] h-16">
        {entries.map((entry, i) => {
          const height = animated ? (entry.count / maxCount) * 100 : 0;
          const isCurrentBucket = currentValue >= entry.value && 
            (i === entries.length - 1 || currentValue < entries[i + 1]?.value);
          return (
            <div
              key={entry.value}
              className="flex-1 rounded-t-sm transition-all duration-700 ease-out"
              style={{
                height: `${height}%`,
                backgroundColor: isCurrentBucket ? color : `${color}40`,
                transitionDelay: `${i * 50}ms`,
                minWidth: '4px',
              }}
              title={`${entry.value}: ${entry.count} submissions`}
            />
          );
        })}
      </div>
    </div>
  );
}

function SubmissionResultModal({ result, stats, onClose, problemTitle, problemId }) {
  const navigate = useNavigate();
  const [loadingNext, setLoadingNext] = useState(false);
  const [phase, setPhase] = useState(0); // 0=entering, 1=checkmark, 2=stats, 3=rewards
  const [particles, setParticles] = useState([]);
  const modalRef = useRef(null);

  const isAccepted = result?.status === 'ACCEPTED';

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2200),
    ];

    // Generate confetti particles for accepted
    if (isAccepted) {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: ['#4ade80', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6', '#34d399'][Math.floor(Math.random() * 6)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);
    }

    return () => timers.forEach(clearTimeout);
  }, [isAccepted]);

  if (!result) return null;

  const runtimeBeats = stats?.runtimeBeats || 0;
  const memoryBeats = stats?.memoryBeats || 0;
  const runtimeMs = result.executionTimeMs || 0;
  const memoryKb = result.memoryUsedKb || 0;
  const memoryMb = (memoryKb / 1024).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Confetti */}
      {isAccepted && phase >= 1 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute animate-confetti"
              style={{
                left: `${p.x}%`,
                top: '-10px',
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <div 
        ref={modalRef}
        className={`relative bg-dark-900 border border-dark-700 rounded-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-500 ${
          phase >= 0 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        style={{ boxShadow: isAccepted ? '0 0 60px rgba(74, 222, 128, 0.15)' : '0 0 60px rgba(239, 68, 68, 0.15)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Status Header */}
        <div className={`text-center mb-6 transition-all duration-700 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Animated Checkmark / X */}
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            isAccepted ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {isAccepted ? (
              <svg className="w-10 h-10 text-green-400 animate-drawCheck" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" className="animate-drawPath" style={{ strokeDasharray: 30, strokeDashoffset: phase >= 1 ? 0 : 30, transition: 'stroke-dashoffset 0.6s ease-out' }} />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <h2 className={`text-2xl font-bold ${isAccepted ? 'text-green-400' : 'text-red-400'}`}>
            {(result?.status || '').replace(/_/g, ' ')}
          </h2>
          <p className="text-dark-400 text-sm mt-1">
            {result.testCasesPassed}/{result.totalTestCases} test cases passed
          </p>
          {problemTitle && (
            <p className="text-dark-500 text-xs mt-1">{problemTitle}</p>
          )}
        </div>

        {/* Runtime & Memory Stats (only for ACCEPTED) */}
        {isAccepted && (
          <div className={`grid grid-cols-2 gap-4 mb-6 transition-all duration-700 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Runtime Card */}
            <div className="bg-dark-800/80 rounded-xl p-4 border border-dark-700 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-dark-300 text-xs font-medium">Runtime</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      <AnimatedNumber value={runtimeMs} delay={1200} suffix="ms" />
                    </p>
                    <p className="text-blue-400 text-sm font-medium mt-1">
                      Beats <AnimatedNumber value={runtimeBeats} delay={1500} suffix="%" decimals={1} />
                    </p>
                  </div>
                  <div className="relative">
                    <CircularProgress percentage={runtimeBeats} color="#60a5fa" size={60} strokeWidth={5} delay={1200} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-400">
                        <AnimatedNumber value={runtimeBeats} delay={1500} decimals={0} />%
                      </span>
                    </div>
                  </div>
                </div>
                <DistributionChart 
                  distribution={stats?.runtimeDistribution} 
                  currentValue={runtimeMs} 
                  color="#60a5fa" 
                  label="Runtime Distribution"
                />
              </div>
            </div>

            {/* Memory Card */}
            <div className="bg-dark-800/80 rounded-xl p-4 border border-dark-700 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-dark-300 text-xs font-medium">Memory</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      <AnimatedNumber value={parseFloat(memoryMb)} delay={1400} suffix=" MB" decimals={2} />
                    </p>
                    <p className="text-purple-400 text-sm font-medium mt-1">
                      Beats <AnimatedNumber value={memoryBeats} delay={1700} suffix="%" decimals={1} />
                    </p>
                  </div>
                  <div className="relative">
                    <CircularProgress percentage={memoryBeats} color="#a78bfa" size={60} strokeWidth={5} delay={1400} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-400">
                        <AnimatedNumber value={memoryBeats} delay={1700} decimals={0} />%
                      </span>
                    </div>
                  </div>
                </div>
                <DistributionChart 
                  distribution={stats?.memoryDistribution} 
                  currentValue={memoryKb} 
                  color="#a78bfa" 
                  label="Memory Distribution"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rewards (stars/score) */}
        {isAccepted && (result.starsEarned > 0 || result.scoreEarned > 0) && (
          <div className={`transition-all duration-700 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-gradient-to-r from-yellow-900/20 via-amber-900/20 to-orange-900/20 border border-yellow-700/30 rounded-xl p-4">
              <div className="flex items-center justify-center gap-6">
                {result.starsEarned > 0 && (
                  <div className="text-center animate-bounceIn" style={{ animationDelay: '2.4s' }}>
                    <div className="text-3xl mb-1 animate-pulse">{'⭐'.repeat(result.starsEarned)}</div>
                    <p className="text-yellow-400 text-sm font-medium">+{result.starsEarned} Stars</p>
                  </div>
                )}
                {result.scoreEarned > 0 && (
                  <div className="text-center animate-bounceIn" style={{ animationDelay: '2.6s' }}>
                    <div className="text-3xl font-bold text-primary-400 mb-1">
                      +<AnimatedNumber value={result.scoreEarned} delay={2400} />
                    </div>
                    <p className="text-primary-400 text-sm font-medium">Score Earned</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {result.errorMessage && (
          <div className={`mt-4 transition-all duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
              <h4 className="text-red-400 text-sm font-medium mb-1">Error</h4>
              <pre className="text-red-300 font-mono text-xs overflow-x-auto max-h-32 overflow-y-auto">{result.errorMessage}</pre>
            </div>
          </div>
        )}

        {/* Motivational message */}
        {isAccepted && phase >= 3 && (
          <div className="text-center mt-4 animate-fadeIn">
            <p className="text-dark-400 text-sm italic">
              {getMotivationalMessage(runtimeBeats, memoryBeats)}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className={`flex gap-3 mt-6 transition-all duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-dark-700 text-white rounded-lg font-medium hover:bg-dark-600 transition-colors text-sm"
          >
            Continue Coding
          </button>
          {isAccepted && problemId && (
            <button
              onClick={async () => {
                setLoadingNext(true);
                try {
                  // Get the next problem ID (current + 1)
                  const nextId = problemId + 1;
                  // Navigate to the next problem
                  navigate(`/problems/${nextId}`);
                  onClose();
                } catch (error) {
                  console.error('Error navigating to next problem:', error);
                  setLoadingNext(false);
                }
              }}
              disabled={loadingNext}
              className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-medium hover:from-green-500 hover:to-green-400 transition-all text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              {loadingNext ? 'Loading...' : (
                <>
                  Next Problem
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getMotivationalMessage(runtimeBeats, memoryBeats) {
  const avg = (runtimeBeats + memoryBeats) / 2;
  if (avg >= 90) return "Outstanding! You're in the top tier! 🏆";
  if (avg >= 70) return "Great solution! Keep optimizing! 💪";
  if (avg >= 50) return "Good job! Can you make it faster? 🚀";
  if (avg >= 30) return "Nice work! Try to optimize your approach 🔧";
  return "Accepted! Consider a different algorithm for better performance 💡";
}

export default SubmissionResultModal;
