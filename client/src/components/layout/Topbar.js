import React, { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function Topbar({ title }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setUnread(data.notifications.filter(n => !n.isRead).length);
    }).catch(() => {});
  }, []);

  return (
    <header style={{
      height: 60, background: 'white', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 24px',
      justifyContent: 'space-between', flexShrink: 0,
    }}>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-icon" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
          <Bell size={18} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, background: 'var(--danger)',
              borderRadius: '50%', border: '2px solid white',
            }} />
          )}
        </button>
        <div className="avatar avatar-sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
