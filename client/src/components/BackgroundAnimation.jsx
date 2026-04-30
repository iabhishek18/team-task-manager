import { motion } from 'framer-motion';

const particles = [
  { type: 'check', x: 60, y: 120, size: 22 },
  { type: 'circle', x: 820, y: 80, size: 18 },
  { type: 'square', x: 250, y: 500, size: 16 },
  { type: 'check', x: 600, y: 600, size: 14 },
  { type: 'circle', x: 400, y: 200, size: 20 },
  { type: 'square', x: 740, y: 380, size: 14 },
  { type: 'check', x: 150, y: 350, size: 12 },
  { type: 'circle', x: 880, y: 300, size: 16 },
  { type: 'square', x: 500, y: 50, size: 18 },
  { type: 'check', x: 300, y: 650, size: 16 },
  { type: 'circle', x: 680, y: 220, size: 12 },
  { type: 'square', x: 100, y: 450, size: 14 },
  { type: 'dot', x: 200, y: 100, size: 6 },
  { type: 'dot', x: 550, y: 300, size: 4 },
  { type: 'dot', x: 750, y: 500, size: 5 },
  { type: 'dot', x: 350, y: 400, size: 4 },
  { type: 'dot', x: 900, y: 150, size: 6 },
  { type: 'dot', x: 120, y: 580, size: 5 },
];

function Shape({ type, size }) {
  if (type === 'dot') {
    return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--border-strong)' }} />;
  }
  if (type === 'check') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-muted)' }}>
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    );
  }
  if (type === 'circle') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-muted)' }}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export default function BackgroundAnimation() {
  return (
    <div className="bg-anim">
      <div className="dot-grid" />
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="shape"
          style={{ left: p.x, top: p.y, position: 'absolute', opacity: 'var(--anim-opacity)' }}
          animate={{
            x: [0, (i % 2 === 0 ? 25 : -20), (i % 3 === 0 ? -15 : 30), 0],
            y: [0, (i % 2 === 0 ? -30 : 20), (i % 3 === 0 ? 25 : -20), 0],
            rotate: [0, (i % 2 === 0 ? 8 : -6), (i % 3 === 0 ? -10 : 12), 0],
            scale: p.type === 'dot' ? [1, 1.4, 0.8, 1] : [1, 1.05, 0.97, 1],
          }}
          transition={{
            duration: 15 + (i * 2.5),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        >
          <Shape type={p.type} size={p.size} />
        </motion.div>
      ))}

      <motion.div
        className="shape"
        style={{ left: '20%', top: '30%', position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '1px solid var(--border)', opacity: 'var(--anim-opacity)' }}
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="shape"
        style={{ right: '15%', bottom: '20%', position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '1px solid var(--border)', opacity: 'var(--anim-opacity)' }}
        animate={{ scale: [1, 0.8, 1.2, 1], rotate: [0, -180, -360] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="shape"
        style={{ left: '55%', top: '60%', position: 'absolute', width: 160, height: 160, borderRadius: '50%', border: '1px dashed var(--border)', opacity: 'var(--anim-opacity)' }}
        animate={{ scale: [1, 1.1, 0.9, 1], rotate: [0, 90, 180, 270, 360] }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
