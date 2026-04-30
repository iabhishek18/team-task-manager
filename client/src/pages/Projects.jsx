import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, X, FolderOpen, Users, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { refreshKey, triggerRefresh } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [refreshKey]);
  const load = async () => { try { setProjects((await api.get('/projects')).data.projects); } catch { toast.error('Failed to load'); } finally { setLoading(false); } };
  const create = async e => { e.preventDefault(); if (!form.name.trim()) { toast.error('Name required'); return; } setSaving(true); try { await api.post('/projects', form); toast.success('Project created'); setShowForm(false); setForm({ name: '', description: '' }); load(); triggerRefresh(); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { setSaving(false); } };
  const remove = async (e, id) => { e.preventDefault(); e.stopPropagation(); if (!confirm('Delete project and all tasks?')) return; try { await api.delete(`/projects/${id}`); toast.success('Deleted'); load(); triggerRefresh(); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };

  if (loading) return <div className="space-y-5"><div className="skel h-7 w-32" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="skel h-36" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> New Project</button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">New Project</h3>
            <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
          </div>
          <form onSubmit={create} className="space-y-4">
            <div><label className="block text-sm font-medium mb-2">Project name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Redesign" autoFocus /></div>
            <div><label className="block text-sm font-medium mb-2">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description (optional)" rows={3} /></div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Project'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      {projects.length === 0 ? (
        <div className="card py-16 text-center">
          <FolderOpen size={36} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="text-base font-medium">No projects yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Create your first project to start organizing work</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/projects/${p.id}`} className="card block p-5 transition-shadow hover:shadow-md group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-subtle)' }}>
                    <FolderOpen size={18} className="text-brand" />
                  </div>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: p.myRole === 'admin' ? 'rgba(37,99,235,0.08)' : 'var(--bg-muted)', color: p.myRole === 'admin' ? '#2563eb' : 'var(--text-muted)', border: '1px solid ' + (p.myRole === 'admin' ? 'rgba(37,99,235,0.15)' : 'var(--border)') }}>{p.myRole}</span>
                </div>
                <h3 className="text-sm font-semibold truncate">{p.name}</h3>
                <p className="text-xs mt-1 line-clamp-2 min-h-[32px]" style={{ color: 'var(--text-muted)' }}>{p.description || 'No description'}</p>
                <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ color: 'var(--text-secondary)', background: 'var(--bg-muted)', border: '1px solid var(--border)' }}><Users size={12} /> {p.members?.length || 0} members</span>
                  {p.myRole === 'admin' && <button onClick={e => remove(e, p.id)} className="p-1.5 rounded-md text-danger transition-colors" style={{ background: 'transparent' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(220,38,38,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'} title="Delete project"><Trash2 size={14} /></button>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
