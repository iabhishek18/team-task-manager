import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import Avatar from '../components/Avatar';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { isDark, toggle, theme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const updateName = async e => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try { await api.put('/profile', { name: name.trim() }); updateUser({ name: name.trim() }); toast.success('Profile updated'); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const changePwd = async e => {
    e.preventDefault();
    if (!curPwd) { toast.error('Enter current password'); return; }
    if (newPwd.length < 6) { toast.error('New password must be 6+ characters'); return; }
    setChangingPwd(true);
    try { await api.put('/profile/password', { currentPassword: curPwd, newPassword: newPwd }); toast.success('Password changed'); setCurPwd(''); setNewPwd(''); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setChangingPwd(false); }
  };

  return (
    <div className="max-w-[560px] mx-auto space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      <div className="card p-6">
        <div className="flex items-center gap-4 pb-5 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Avatar name={user?.name} size={52} />
          <div className="min-w-0">
            <p className="text-base font-semibold truncate">{user?.name}</p>
            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>
        <form onSubmit={updateName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Display name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email address</label>
            <input type="email" value={user?.email || ''} disabled className="opacity-50 cursor-not-allowed" />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Email cannot be changed</p>
          </div>
          <button disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold mb-4">Change password</h3>
        <form onSubmit={changePwd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current password</label>
            <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} placeholder="Enter current password" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">New password</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimum 6 characters" />
          </div>
          <button disabled={changingPwd} className="btn-primary">{changingPwd ? 'Changing...' : 'Update password'}</button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold mb-4">Appearance</h3>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Currently using {theme} mode</p>
          </div>
          <button onClick={toggle} className="btn-secondary text-sm">
            {isDark ? <><Sun size={15} /> Light mode</> : <><Moon size={15} /> Dark mode</>}
          </button>
        </div>
      </div>
    </div>
  );
}
