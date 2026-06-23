import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, Calendar, Users } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import useProjectStore from '../store/projectStore';
import toast from 'react-hot-toast';

const statusBadge = { active: 'success', completed: 'info', 'on-hold': 'warning', cancelled: 'danger' };
const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

function ProjectModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '', priority: 'medium', status: 'active', deadline: '' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. E-Commerce App" required />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Project description..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-input form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.name ? onSave(form) : toast.error('Name required')}>Create Project</button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { projects, fetchProjects, createProject, deleteProject, loading } = useProjectStore();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async (form) => {
    const p = await createProject(form);
    if (p) { toast.success('Project created!'); setShowModal(false); }
    else toast.error('Failed to create');
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this project and all its tasks?')) {
      await deleteProject(id);
      toast.success('Project deleted');
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Projects" />
        <div className="page-content fade-in">
          <div className="page-header">
            <div>
              <h2 className="page-title">All Projects</h2>
              <p className="page-subtitle">{projects.length} projects total</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> New Project
            </button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <input className="form-input" placeholder="Search projects..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="card empty-state">
              <FolderIcon />
              <h3>No projects found</h3>
              <p>Create your first project to get started</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                <Plus size={16} /> Create Project
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {filtered.map(p => (
                <div key={p._id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                  onClick={() => navigate('/projects/' + p._id)}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</h3>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span className={`badge badge-${statusBadge[p.status] || 'gray'}`}>{p.status}</span>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
                    {p.description || 'No description'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ color: priorityColor[p.priority], fontWeight: 600 }}>● {p.priority}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} /> {p.members?.length || 0}
                    </span>
                    {p.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {new Date(p.deadline).toLocaleDateString()}
                    </span>}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button className="btn btn-sm btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={e => { e.stopPropagation(); navigate('/projects/' + p._id); }}>
                      <Eye size={13} /> View
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={e => handleDelete(p._id, e)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
    </div>
  );
}

function FolderIcon() {
  return <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>;
}
