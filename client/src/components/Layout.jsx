import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, FolderOpen, LogOut, Menu, X, Bell, Search, Moon, Sun, Settings } from 'lucide-react';
import Avatar from './Avatar';
import Logo from './Logo';
import BackgroundAnimation from './BackgroundAnimation';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
];

export default function Layout() {
  const { user, logout, refreshKey } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const loc = useLocation();
  const [mob, setMob] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [showN, setShowN] = useState(false);
  const searchRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => { api.get('/notifications?limit=10').then(r => { setNotifs(r.data.notifications||[]); setUnread(r.data.unreadCount||0); }).catch(()=>{}); }, [loc.pathname, refreshKey]);

  const onKey = useCallback(e => {
    if ((e.metaKey||e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchFocused(true); setTimeout(() => searchRef.current?.focus(), 50); }
    if (e.key === 'Escape') { setSearchFocused(false); setQ(''); setResults([]); setShowN(false); searchRef.current?.blur(); }
  }, []);
  useEffect(() => { document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [onKey]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(() => { api.get(`/search/tasks?q=${encodeURIComponent(q)}`).then(r => setResults(r.data.tasks||[])).catch(()=>{}); }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
        setQ('');
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-screen flex" style={{ background: 'var(--bg-page)' }}>
      <BackgroundAnimation />
      {mob && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMob(false)} />}

      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-[220px] flex flex-col border-r transition-transform lg:translate-x-0 ${mob?'translate-x-0':'-translate-x-full'}`} style={{ background:'var(--bg-sidebar)', borderColor:'var(--border)' }}>
        <div className="h-[52px] flex items-center gap-2.5 px-4 border-b" style={{ borderColor:'var(--border)' }}>
          <Logo size={28} />
          <span className="text-[15px] font-semibold" style={{ color:'var(--text)' }}>TeamSync</span>
          <button className="ml-auto lg:hidden" style={{color:'var(--text-muted)'}} onClick={() => setMob(false)}><X size={16}/></button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-auto">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} onClick={() => setMob(false)} className={({isActive}) => `flex items-center gap-2.5 px-2.5 py-[7px] rounded-[5px] text-[13px] font-medium transition-colors ${isActive ? '' : ''}`} style={({isActive}) => ({ background: isActive ? 'var(--hover)' : 'transparent', color: isActive ? 'var(--text)' : 'var(--text-secondary)' })}>
              <n.icon size={16} strokeWidth={1.7} />{n.label}
            </NavLink>
          ))}
          <NavLink to="/profile" onClick={() => setMob(false)} className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-[5px] text-[13px] font-medium" style={({isActive}) => ({ background: isActive?'var(--hover)':'transparent', color: isActive?'var(--text)':'var(--text-secondary)' })}>
            <Settings size={16} strokeWidth={1.7} />Settings
          </NavLink>
        </nav>

        <div className="px-3 py-3 border-t" style={{ borderColor:'var(--border)' }}>
          <div className="flex items-center gap-2 px-2">
            <Avatar name={user?.name} size={24} />
            <span className="text-[12px] font-medium truncate flex-1" style={{ color:'var(--text)' }}>{user?.name}</span>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 rounded-[5px] text-[12px] transition-colors" style={{ color:'var(--text-muted)' }} onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
            <LogOut size={14} />Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[52px] flex items-center justify-between px-4 lg:px-5 border-b flex-shrink-0" style={{ background:'var(--bg)', borderColor:'var(--border)' }}>
          <div className="flex items-center gap-2 flex-1">
            <button className="lg:hidden p-1" style={{color:'var(--text-secondary)'}} onClick={() => setMob(true)}><Menu size={18}/></button>

            <div ref={searchContainerRef} className="relative flex-1 max-w-[400px]">
              <div className="relative flex items-center">
                <Search size={14} className="absolute pointer-events-none" style={{ color: 'var(--text-muted)', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  ref={searchRef}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search tasks..."
                  style={{ height: 36, width: '100%', paddingLeft: 34, paddingRight: 40, borderRadius: 8, fontSize: 13, background: searchFocused ? 'var(--bg)' : 'var(--bg-subtle)', border: searchFocused ? '1.5px solid #2563eb' : '1px solid var(--border)', color: 'var(--text)', boxShadow: searchFocused ? '0 0 0 3px var(--ring)' : 'none', transition: 'all 0.2s ease', outline: 'none' }}
                />
                {!searchFocused && !q && <kbd className="absolute text-[10px] px-1.5 py-0.5 rounded" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', background:'var(--bg-muted)', color:'var(--text-muted)', border:'1px solid var(--border)' }}>⌘K</kbd>}
                {(searchFocused || q) && q && <button onClick={() => { setQ(''); setResults([]); searchRef.current?.focus(); }} className="absolute" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', color:'var(--text-muted)' }}><X size={14}/></button>}
              </div>

              <AnimatePresence>
                {searchFocused && q && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }} className="absolute top-[42px] left-0 right-0 rounded-lg overflow-hidden z-50" style={{ background:'var(--bg)', border:'1px solid var(--border)', boxShadow:'var(--shadow-md)' }}>
                    <div className="max-h-[280px] overflow-auto">
                      {results.length === 0 && <p className="py-6 text-center text-[12px]" style={{color:'var(--text-muted)'}}>No results for "{q}"</p>}
                      {results.map(t => (
                        <button key={t.id} onClick={() => { setSearchFocused(false); setQ(''); setResults([]); navigate(`/projects/${t.project?.id||t.projectId}`); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b last:border-0" style={{borderColor:'var(--border)'}} onMouseEnter={e=>e.currentTarget.style.background='var(--hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status==='done'?'bg-success':t.status==='in_progress'?'bg-brand':'bg-gray-400'}`}/>
                          <div className="min-w-0 flex-1"><p className="text-[13px] truncate" style={{color:'var(--text)'}}>{t.title}</p><p className="text-[10px]" style={{color:'var(--text-muted)'}}>{t.project?.name}</p></div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-0.5 ml-2">
            <button onClick={toggle} className="p-2 rounded-[5px] transition-colors" style={{color:'var(--text-muted)'}} title={isDark?'Switch to light':'Switch to dark'}>{isDark?<Sun size={16}/>:<Moon size={16}/>}</button>
            <div className="relative">
              <button onClick={() => setShowN(!showN)} className="p-2 rounded-[5px] relative" style={{color:'var(--text-muted)'}}>
                <Bell size={16}/>{unread>0 && <span className="absolute top-1.5 right-1.5 w-[6px] h-[6px] bg-brand rounded-full"/>}
              </button>
              <AnimatePresence>{showN && (
                <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:4}} transition={{duration:0.1}} className="absolute right-0 top-11 w-[320px] rounded-lg overflow-hidden z-50" style={{ background:'var(--bg)', border:'1px solid var(--border)', boxShadow:'var(--shadow-md)' }}>
                  <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{borderColor:'var(--border)'}}>
                    <span className="text-[13px] font-semibold" style={{color:'var(--text)'}}>Notifications</span>
                    {unread>0 && <button onClick={()=>{api.patch('/notifications/all/read');setUnread(0);setNotifs(p=>p.map(n=>({...n,read:true})));}} className="text-[11px] text-brand font-medium">Mark all read</button>}
                  </div>
                  <div className="max-h-[300px] overflow-auto">{notifs.length===0 ? <p className="py-8 text-center text-[12px]" style={{color:'var(--text-muted)'}}>No notifications</p> : notifs.map(n => (
                    <div key={n.id} className="px-3 py-2.5 border-b last:border-0" style={{borderColor:'var(--border)', background: !n.read ? 'var(--bg-subtle)' : 'transparent'}}>
                      <p className="text-[12px]" style={{color:'var(--text-secondary)'}}>{n.message}</p>
                      <p className="text-[10px] mt-0.5" style={{color:'var(--text-muted)'}}>{new Date(n.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</p>
                    </div>
                  ))}</div>
                </motion.div>
              )}</AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-[960px] mx-auto px-4 lg:px-6 py-6"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
