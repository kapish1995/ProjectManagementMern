import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Bell, LogOut, Menu, X, Briefcase } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'var(--primary)', borderRadius: 8, padding: 6 }}>
            <Briefcase size={18} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>ProManage</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Project Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 8px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
              background: isActive ? 'rgba(99,102,241,0.3)' : 'transparent',
              textDecoration: 'none', fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s', fontSize: 14,
            })}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div className="avatar avatar-sm" style={{ background: 'var(--primary)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-sm"
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: 'none', justifyContent: 'center' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside style={{ width: 220, background: 'var(--sidebar-bg)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button className="btn-icon mobile-menu-btn" onClick={() => setOpen(true)}
        style={{ position: 'fixed', top: 12, left: 12, zIndex: 200, background: 'var(--sidebar-bg)', color: 'white', display: 'none' }}>
        <Menu size={20} />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 220, background: 'var(--sidebar-bg)' }}>
            <button className="btn-icon" onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: 12, right: 12, color: 'white' }}>
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
