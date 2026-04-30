import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, List, LayoutGrid, Users, Activity, Send, Trash2, MessageCircle, Download } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user, triggerRefresh } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [tf, setTf] = useState({ title: '', status: 'todo', priority: 'medium', dueDate: '', assigneeId: '' });
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('member');
  const [acts, setActs] = useState([]);
  const [modal, setModal] = useState(null);
  const [comments, setComments] = useState([]);
  const [cmt, setCmt] = useState('');

  useEffect(() => { load(); }, [projectId]);
  const load = async () => { try { setProject((await api.get(`/projects/${projectId}`)).data.project); } catch { toast.error('Failed to load'); } finally { setLoading(false); } };
  const loadActs = async () => { try { setActs((await api.get(`/tasks/${projectId}/activities`)).data.activities || []); } catch {} };
  const loadCmts = async id => { try { setComments((await api.get(`/tasks/${projectId}/tasks/${id}/comments`)).data.comments || []); } catch {} };
  useEffect(() => { if (tab === 'activity') loadActs(); }, [tab]);
  useEffect(() => { if (modal) loadCmts(modal.id); }, [modal]);

  const myRole = project?.members?.find(m => m.user?.id === user?.id)?.role;
  const tasks = project?.tasks || [];
  const grouped = { todo: tasks.filter(t => t.status === 'todo'), in_progress: tasks.filter(t => t.status === 'in_progress'), done: tasks.filter(t => t.status === 'done') };
  const pct = tasks.length > 0 ? Math.round((grouped.done.length / tasks.length) * 100) : 0;

  const addTask = async e => { e.preventDefault(); if (!tf.title.trim()) { toast.error('Title required'); return; } const p = { ...tf }; if (!p.assigneeId) delete p.assigneeId; if (!p.dueDate) delete p.dueDate; try { await api.post(`/tasks/${projectId}/tasks`, p); toast.success('Task created'); setShowForm(false); setTf({ title: '', status: 'todo', priority: 'medium', dueDate: '', assigneeId: '' }); load(); triggerRefresh(); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };
  const setStatus = async (id, s) => { try { await api.put(`/tasks/${projectId}/tasks/${id}`, { status: s }); toast.success('Updated'); load(); triggerRefresh(); } catch { toast.error('Failed'); } };
  const delTask = async id => { if (!confirm('Delete task?')) return; try { await api.delete(`/tasks/${projectId}/tasks/${id}`); toast.success('Deleted'); load(); triggerRefresh(); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };
  const invite = async e => { e.preventDefault(); if (!invEmail.trim()) { toast.error('Email required'); return; } try { await api.post(`/projects/${projectId}/members`, { email: invEmail, role: invRole }); toast.success('Member added'); setShowInvite(false); setInvEmail(''); load(); triggerRefresh(); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };
  const kick = async uid => { if (!confirm('Remove?')) return; try { await api.delete(`/projects/${projectId}/members/${uid}`); toast.success('Removed'); load(); triggerRefresh(); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };
  const chRole = async (uid, r) => { try { await api.patch(`/projects/${projectId}/members/${uid}/role`, { role: r }); toast.success('Role updated'); load(); triggerRefresh(); } catch { toast.error('Failed'); } };
  const postCmt = async e => { e.preventDefault(); if (!cmt.trim()) return; try { await api.post(`/tasks/${projectId}/tasks/${modal.id}/comments`, { content: cmt }); toast.success('Comment added'); setCmt(''); loadCmts(modal.id); } catch { toast.error('Failed'); } };

  if (loading) return <div className="space-y-5"><div className="skel h-7 w-48" /><div className="skel h-10 w-64" /><div className="skel h-80" /></div>;
  if (!project) return <p className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Project not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">{project.name}</h1>
          {project.description && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{project.description}</p>}
          <div className="flex items-center gap-3 mt-3">
            <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
              <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{pct}% complete · {grouped.done.length}/{tasks.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: myRole === 'admin' ? 'rgba(37,99,235,0.08)' : 'var(--bg-muted)', color: myRole === 'admin' ? '#2563eb' : 'var(--text-muted)' }}>{myRole}</span>
          <button onClick={() => window.open(`/api/projects/${projectId}/export`)} className="btn-secondary h-9 px-3 text-xs"><Download size={14} /> Export</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-muted)' }}>
        {[{ id: 'tasks', icon: List, l: 'Tasks' }, { id: 'board', icon: LayoutGrid, l: 'Board' }, { id: 'members', icon: Users, l: 'Team' }, { id: 'activity', icon: Activity, l: 'Activity' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all" style={{ background: tab === t.id ? 'var(--bg)' : 'transparent', color: tab === t.id ? 'var(--text)' : 'var(--text-muted)', boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none' }}>
            <t.icon size={15} />{t.l}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={() => setShowForm(!showForm)} className="btn-primary h-9 text-sm"><Plus size={15} /> Add Task</button></div>

          <AnimatePresence>{showForm && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={addTask} className="card p-5 space-y-4 overflow-hidden">
              <input type="text" value={tf.title} onChange={e => setTf({ ...tf, title: e.target.value })} placeholder="What needs to be done?" autoFocus />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <select value={tf.priority} onChange={e => setTf({ ...tf, priority: e.target.value })} className="h-9 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
                <select value={tf.status} onChange={e => setTf({ ...tf, status: e.target.value })} className="h-9 text-sm"><option value="todo">Todo</option><option value="in_progress">In Progress</option><option value="done">Done</option></select>
                <input type="date" value={tf.dueDate} onChange={e => setTf({ ...tf, dueDate: e.target.value })} className="h-9 text-sm" />
                <select value={tf.assigneeId} onChange={e => setTf({ ...tf, assigneeId: e.target.value })} className="h-9 text-sm"><option value="">Unassigned</option>{project.members?.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}</select>
              </div>
              <div className="flex gap-3"><button type="submit" className="btn-primary h-9 text-sm">Create</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary h-9 text-sm">Cancel</button></div>
            </motion.form>
          )}</AnimatePresence>

          <div className="card overflow-hidden">
            {tasks.length === 0 ? <div className="py-14 text-center"><List size={28} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tasks yet</p></div> : tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3 transition-colors group" style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-danger' : t.priority === 'medium' ? 'bg-warning' : 'bg-gray-400'}`} />
                <p className={`flex-1 text-sm font-medium truncate ${t.status === 'done' ? 'line-through' : ''}`} style={{ color: t.status === 'done' ? 'var(--text-muted)' : 'var(--text)' }}>{t.title}</p>
                <select value={t.status} onChange={e => setStatus(t.id, e.target.value)} className="h-7 w-auto px-2 text-xs rounded-md" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                  <option value="todo">Todo</option><option value="in_progress">In Progress</option><option value="done">Done</option>
                </select>
                {t.assignee && <Avatar name={t.assignee.name} size={24} />}
                {t.dueDate && <span className={`text-xs hide-mobile ${new Date(t.dueDate) < new Date() && t.status !== 'done' ? 'text-danger font-medium' : ''}`} style={{ color: !(new Date(t.dueDate) < new Date() && t.status !== 'done') ? 'var(--text-muted)' : undefined }}>{new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                <button onClick={() => setModal(t)} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-muted)', background: 'transparent' }} onMouseEnter={e=>e.currentTarget.style.background='var(--hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'} title="Comments"><MessageCircle size={14} /></button>
                {myRole === 'admin' && <button onClick={() => delTask(t.id)} className="p-1.5 rounded-md text-danger transition-colors" style={{ background: 'transparent' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(220,38,38,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'} title="Delete task"><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{ k: 'todo', l: 'Todo', c: 'bg-gray-400' }, { k: 'in_progress', l: 'In Progress', c: 'bg-brand' }, { k: 'done', l: 'Done', c: 'bg-success' }].map(col => (
            <div key={col.k} className="rounded-xl p-3 min-h-[200px]" style={{ background: 'var(--bg-muted)' }}>
              <div className="flex items-center gap-2 mb-3 px-1"><span className={`w-2.5 h-2.5 rounded-full ${col.c}`} /><span className="text-sm font-semibold">{col.l}</span><span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{grouped[col.k].length}</span></div>
              <div className="space-y-2">
                {grouped[col.k].map(t => (
                  <div key={t.id} onClick={() => setModal(t)} className="card p-3.5 cursor-pointer transition-shadow hover:shadow-md">
                    <p className="text-sm font-medium mb-2">{t.title}</p>
                    <div className="flex items-center justify-between">
                      <span className={`w-2 h-2 rounded-full ${t.priority === 'high' ? 'bg-danger' : t.priority === 'medium' ? 'bg-warning' : 'bg-gray-400'}`} />
                      <div className="flex items-center gap-1.5">
                        {t.dueDate && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        {t.assignee && <Avatar name={t.assignee.name} size={20} />}
                      </div>
                    </div>
                  </div>
                ))}
                {grouped[col.k].length === 0 && <div className="h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>No tasks</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-4">
          {myRole === 'admin' && <div className="flex justify-end"><button onClick={() => setShowInvite(!showInvite)} className="btn-primary h-9 text-sm"><Plus size={15} /> Invite</button></div>}
          <AnimatePresence>{showInvite && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={invite} className="card p-4 flex flex-col sm:flex-row gap-3">
              <input type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)} placeholder="Email address" className="flex-1" />
              <select value={invRole} onChange={e => setInvRole(e.target.value)} className="h-10 w-full sm:w-28"><option value="member">Member</option><option value="admin">Admin</option></select>
              <button type="submit" className="btn-primary h-10 w-full sm:w-auto">Add</button>
            </motion.form>
          )}</AnimatePresence>
          <div className="card overflow-hidden">
            {project.members?.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-4 gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={m.user.name} size={32} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.user.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.user.id === project.ownerId && <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'rgba(202,138,4,0.1)', color: '#ca8a04' }}>Owner</span>}
                  {myRole === 'admin' && m.user.id !== project.ownerId ? (
                    <>
                      <select value={m.role} onChange={e => chRole(m.user.id, e.target.value)} className="h-8 w-24 text-xs"><option value="member">Member</option><option value="admin">Admin</option></select>
                      <button onClick={() => kick(m.user.id)} className="p-1 text-danger"><X size={15} /></button>
                    </>
                  ) : m.user.id !== project.ownerId && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.role}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="card overflow-hidden">
          {acts.length === 0 ? <div className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No activity yet</div> : acts.map(a => (
            <div key={a.id} className="flex items-start gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <Avatar name={a.user?.name} size={24} className="mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm"><span className="font-semibold">{a.user?.name}</span>{' '}<span style={{ color: 'var(--text-secondary)' }}>{a.action}</span>{a.entityName && <span className="text-brand font-medium"> {a.entityName}</span>}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>{modal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={() => setModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} onClick={e => e.stopPropagation()} className="card w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
            <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold">{modal.title}</h3>
                <button onClick={() => setModal(null)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              {modal.description && <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{modal.description}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>{modal.status.replace('_', ' ')}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${modal.priority === 'high' ? 'text-danger' : modal.priority === 'medium' ? 'text-warning' : ''}`} style={{ background: 'var(--bg-muted)', color: modal.priority === 'low' ? 'var(--text-muted)' : undefined }}>{modal.priority}</span>
                {modal.assignee && <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}><Avatar name={modal.assignee.name} size={18} />{modal.assignee.name}</span>}
              </div>
            </div>
            <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Comments</h4>
              {comments.length === 0 ? <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No comments yet — start the conversation</p> : comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.user?.name} size={28} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 rounded-lg p-3" style={{ background: 'var(--bg-subtle)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{c.user?.name}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={postCmt} className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <input type="text" value={cmt} onChange={e => setCmt(e.target.value)} placeholder="Write a comment..." className="flex-1 h-10" />
              <button type="submit" className="btn-primary h-10 w-10 p-0 flex items-center justify-center"><Send size={16} /></button>
            </form>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
