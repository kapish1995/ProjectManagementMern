import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import api from '../api/axios';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setNotifications(data.notifications);
      setLoading(false);
    });
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All marked as read');
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Notifications" />
        <div className="page-content fade-in">
          <div className="page-header">
            <div>
              <h2 className="page-title">Notifications</h2>
              <p className="page-subtitle">{unread} unread</p>
            </div>
            {unread > 0 && (
              <button className="btn btn-secondary" onClick={markAllRead}>
                <CheckCheck size={15} /> Mark all read
              </button>
            )}
          </div>

          <div className="card">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={36} color="var(--text-muted)" />
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0',
                  borderBottom: '1px solid var(--border)',
                  background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.03)',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.isRead ? '#f1f5f9' : 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={16} color={n.isRead ? 'var(--text-muted)' : 'var(--primary)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: n.isRead ? 400 : 600, fontSize: 14 }}>{n.message}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
