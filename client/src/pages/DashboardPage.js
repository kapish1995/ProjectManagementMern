import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckSquare, Clock, TrendingUp } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const statusColor = { todo: '#f59e0b', 'in-progress': '#3b82f6', review: '#8b5cf6', done: '#10b981' };
const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Dashboard" />
        <div className="loading-screen"><div className="spinner" /><p>Loading...</p></div>
      </div>
    </div>
  );

  const statCards = [
    { label: 'Total Projects', value: stats?.stats?.totalProjects || 0, icon: FolderKanban, color: '#6366f1', bg: '#ede9fe' },
    { label: 'Total Tasks', value: stats?.stats?.totalTasks || 0, icon: CheckSquare, color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Completed', value: stats?.stats?.completedTasks || 0, icon: TrendingUp, color: '#10b981', bg: '#d1fae5' },
    { label: 'In Progress', value: stats?.stats?.inProgressTasks || 0, icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Dashboard" />
        <div className="page-content fade-in">

          {/* Welcome */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Here's what's happening with your projects today.</p>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div className="stat-card" key={label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="stat-icon" style={{ background: bg }}>
                    <Icon size={20} color={color} />
                  </div>
                </div>
                <div className="stat-value" style={{ color }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Recent Projects */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700 }}>Recent Projects</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/projects')}>View All</button>
              </div>
              {stats?.recentProjects?.length === 0 ? (
                <div className="empty-state"><p>No projects yet</p></div>
              ) : (
                stats?.recentProjects?.map(p => (
                  <div key={p._id} onClick={() => navigate('/projects/' + p._id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`badge badge-${p.status === 'active' ? 'success' : p.status === 'completed' ? 'info' : 'warning'}`}>
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Recent Tasks */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700 }}>Recent Tasks</h3>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/tasks')}>View All</button>
              </div>
              {stats?.recentTasks?.length === 0 ? (
                <div className="empty-state"><p>No tasks assigned</p></div>
              ) : (
                stats?.recentTasks?.map(t => (
                  <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[t.status], background: statusColor[t.status] + '20', padding: '2px 8px', borderRadius: 999 }}>
                        {t.status}
                      </span>
                    </div>
                    {t.project && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>📁 {t.project.name}</div>}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
