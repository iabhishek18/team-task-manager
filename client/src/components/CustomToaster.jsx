import { useEffect } from 'react';
import { Toaster, ToastBar, toast, useToasterStore } from 'react-hot-toast';
import { X } from 'lucide-react';

const TOAST_LIMIT = 1;

export default function CustomToaster() {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return (
    <Toaster
      position="bottom-left"
      toastOptions={{
        duration: 2500,
        style: {
          background: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          fontSize: '13px',
          padding: '10px 14px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '360px',
        },
      }}
      containerStyle={{ bottom: 24, left: 24 }}
    >
      {(t) => (
        <ToastBar toast={t} style={{ ...t.style, animation: t.visible ? 'toast-slide-in 0.3s ease forwards' : 'toast-slide-out 0.2s ease forwards' }}>
          {({ icon, message }) => (
            <div className="flex items-center gap-2 w-full">
              {icon}
              <span className="flex-1">{message}</span>
              {t.type !== 'loading' && (
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-shrink-0 p-1 rounded-md transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
