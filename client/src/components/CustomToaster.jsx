import { useEffect, useState } from 'react';
import { useToaster } from 'react-hot-toast/headless';
import toast from 'react-hot-toast';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function CustomToaster() {
  const { toasts, handlers } = useToaster();
  const { startPause, endPause } = handlers;

  const latestToast = toasts.filter(t => t.visible).slice(-1)[0];

  return (
    <div
      className="fixed bottom-6 left-6 z-[9999]"
      onMouseEnter={startPause}
      onMouseLeave={endPause}
    >
      {latestToast && <ToastItem key={latestToast.id} t={latestToast} />}
    </div>
  );
}

function ToastItem({ t }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setTimeout(() => toast.dismiss(t.id), 200);
  };

  useEffect(() => {
    if (!t.visible) {
      setShow(false);
    }
  }, [t.visible]);

  const icon = t.type === 'success' ? (
    <CheckCircle size={16} className="flex-shrink-0" style={{ color: '#16a34a' }} />
  ) : t.type === 'error' ? (
    <AlertCircle size={16} className="flex-shrink-0" style={{ color: '#dc2626' }} />
  ) : null;

  const message = typeof t.message === 'function' ? t.message(t) : t.message;

  return (
    <div
      className="toast-item flex items-center gap-3 pr-2 pl-4 py-3 rounded-lg shadow-md"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        maxWidth: '360px',
        minWidth: '240px',
        fontSize: '13px',
        transform: show ? 'translateX(0)' : 'translateX(calc(-100% - 24px))',
        opacity: show ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
      }}
    >
      {icon}
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-md transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <X size={14} />
      </button>
    </div>
  );
}
