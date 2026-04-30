import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, FolderOpen, TrendingUp } from 'lucide-react';
import api from '../services/api';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, refreshKey } = useAuth();
  const [d, setD] = useState(null);
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/tasks/dashboard'), api.get('/tasks/activities/recent').catch(() => ({ data: { activities: [] } }))])
      .then(([r, a]) => { setD(r.data.dashboard); setActs(a.data.activities || []); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <div className="space-y-6"><div className="skel h-7 w-48" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skel h-24" />)}</div><div className="skel h-72" /></div>;
  if (!d) return null;

  const { totalTasks, tasksByStatus, overdueCount, overdueTasks, myTasks, projectCount, projectProgress, weeklyVelocity } = d;
  const done = tasksByStatus.done || 0, ip = tasksByStatus.in_progress || 0, todo = tasksByStatus.todo || 0;
  const pct = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0;

  const stats = [
    { l: 'Projects', v: projectCount, icon: FolderOpen, color: 'text-brand' },
    { l: 'Total Tasks', v: totalTasks, icon: TrendingUp, color: 'text-blue-500' },
    { l: 'Completed', v: done, icon: CheckCircle, color: 'text-success' },
    { l: 'Overdue', v: overdueCount, icon: AlertTriangle, color: 'text-danger' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Here's your workspace overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
            <s.icon size={20} className={`${s.color} mb-3`} />
            <p className="text-2xl font-bold">{s.v}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold">My Tasks</h2>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{myTasks.length} active</span>
          </div>
          {myTasks.length === 0 ? (
            <div className="py-14 text-center">
              <CheckCircle size={28} className="text-success mx-auto mb-2 opacity-40" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All caught up! No tasks assigned.</p>
            </div>
          ) : myTasks.slice(0, 6).map(t => (
            <Link key={t.id} to={`/projects/${t.projectId || t.project?.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors" style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-danger' : t.priority === 'medium' ? 'bg-warning' : 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.project?.name}</p>
              </div>
              <span className="text-xs font-medium hide-mobile" style={{ color: t.status === 'in_progress' ? '#2563eb' : 'var(--text-muted)' }}>
                {t.status === 'in_progress' ? 'In Progress' : 'Todo'}
              </span>
              {t.dueDate && <span className={`text-xs hide-mobile ${new Date(t.dueDate) < new Date() ? 'text-danger font-medium' : ''}`} style={{ color: new Date(t.dueDate) >= new Date() ? 'var(--text-muted)' : undefined }}>{new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
            </Link>
          ))}
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Completion</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 relative flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90"><circle cx="18" cy="18" r="14" fill="none" stroke="var(--bg-muted)" strokeWidth="3" /><circle cx="18" cy="18" r="14" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${pct * 0.88} 88`} /></svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{pct}%</span>
              </div>
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-gray-300" /><span className="flex-1" style={{ color: 'var(--text-secondary)' }}>Todo</span><span className="font-semibold">{todo}</span></div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-brand" /><span className="flex-1" style={{ color: 'var(--text-secondary)' }}>Active</span><span className="font-semibold">{ip}</span></div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-success" /><span className="flex-1" style={{ color: 'var(--text-secondary)' }}>Done</span><span className="font-semibold">{done}</span></div>
              </div>
            </div>
            <div className="h-2 rounded-full mt-4 overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
              <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>

          {weeklyVelocity && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">This Week</h3>
                <div className="flex gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-sm" style={{ background: 'rgba(37,99,235,0.25)' }} />Created</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-sm" style={{ background: 'rgba(22,163,74,0.5)' }} />Done</span>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {weeklyVelocity.map((v, i) => { const max = Math.max(...weeklyVelocity.map(x => Math.max(x.created, x.completed)), 1); return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex gap-px items-end h-10">
                      <div className="flex-1 rounded-t min-h-[2px]" style={{ height: `${(v.created / max) * 100}%`, background: 'rgba(37,99,235,0.25)' }} />
                      <div className="flex-1 rounded-t min-h-[2px]" style={{ height: `${(v.completed / max) * 100}%`, background: 'rgba(22,163,74,0.5)' }} />
                    </div>
                    <span className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>{v.day?.slice(0, 2)}</span>
                  </div>
                ); })}
              </div>
            </div>
          )}
        </div>
      </div>

      {projectProgress?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold">Project Progress</h2>
          </div>
          {projectProgress.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors" style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.done}/{p.total} done · {p.inProgress} active</p>
              </div>
              <div className="w-28 sm:w-36 flex items-center gap-2 flex-shrink-0">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                  <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${p.percent}%` }} transition={{ duration: 0.7 }} />
                </div>
                <span className="text-xs font-bold w-8 text-right">{p.percent}%</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {overdueTasks.length > 0 && (
        <div className="card overflow-hidden" style={{ borderColor: 'rgba(220,38,38,0.3)' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(220,38,38,0.15)', background: 'rgba(220,38,38,0.03)' }}>
            <Clock size={14} className="text-danger" />
            <h3 className="text-sm font-semibold">Overdue ({overdueTasks.length})</h3>
          </div>
          {overdueTasks.slice(0, 4).map(t => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.project?.name}</p>
              </div>
              <span className="text-xs font-semibold text-danger flex-shrink-0">{Math.ceil((Date.now() - new Date(t.dueDate)) / 86400000)}d late</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
