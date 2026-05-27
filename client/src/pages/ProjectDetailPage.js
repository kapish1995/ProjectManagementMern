import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Trash2, UserPlus, Paperclip, MessageSquare } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import useProjectStore from '../store/projectStore';
import useTaskStore from '../store/taskStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#f59e0b' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'review', label: 'Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#10b981' },
];

function TaskModal({ project, task, onClose, onSave }) {
  const [form, setForm] = useState(task || { title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', deadline: '' });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Assign To (User ID)</label>
            <select className="form-input form-select" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {project?.members?.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input className="form-input" type="date" value={form.deadline ? form.deadline.split('T')[0] : ''} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => form.title ? onSave(form) : toast.error('Title required')}>
            {task ? 'Update' : 'Create'} Task
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onDelete, onEdit, onStatusChange }) {
  const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  return (
    <div className="card" style={{ marginBottom: 10, padding: 14, cursor: 'pointer' }} onClick={() => onEdit(task)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: priorityColor[task.priority] }}>● {task.priority}</span>
        <button className="btn-icon" style={{ padding: 2 }} onClick={e => { e.stopPropagation(); onDelete(task._id); }}>
          <Trash2 size={12} color="#ef4444" />
        </button>
      </div>
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>{task.title}</p>
      {task.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}</p>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {task.assignedTo ? (
          <div className="avatar avatar-sm" title={task.assignedTo.name}>{task.assignedTo.name?.[0]}</div>
        ) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unassigned</span>}
        <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', fontSize: 11 }}>
          {task.attachments?.length > 0 && <span><Paperclip size={11} /> {task.attachments.length}</span>}
          {task.comments?.length > 0 && <span><MessageSquare size={11} /> {task.comments.length}</span>}
        </div>
      </div>
      {task.deadline && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          📅 {new Date(task.deadline).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, fetchProjectById } = useProjectStore();
  const { tasks, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();
  const { user } = useAuthStore();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const { addMember } = useProjectStore();

  useEffect(() => {
    fetchProjectById(id);
    fetchTasks(id);
  }, [id]);

  const handleCreateTask = async (form) => {
    const t = await createTask({ ...form, project: id });
    if (t) { toast.success('Task created!'); setShowTaskModal(false); }
    else toast.error('Failed');
  };

  const handleEditTask = async (form) => {
    await updateTask(editTask._id, form);
    toast.success('Task updated!');
    setEditTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      await deleteTask(taskId);
      toast.success('Task deleted');
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail) return;
    const ok = await addMember(id, memberEmail, 'member');
    if (ok) { toast.success('Member added!'); setShowMemberModal(false); setMemberEmail(''); }
    else toast.error('User not found or already a member');
  };

  if (!currentProject) return (
    <div className="app-layout"><Sidebar />
      <div className="main-content"><Topbar title="Project" />
        <div className="loading-screen"><div className="spinner" /></div>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={currentProject.name} />
        <div className="page-content fade-in">

          {/* Header */}
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn-icon" onClick={() => navigate('/projects')}><ArrowLeft size={18} /></button>
              <div>
                <h2 className="page-title">{currentProject.name}</h2>
                <p className="page-subtitle">{currentProject.description || 'No description'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
                <UserPlus size={15} /> Add Member
              </button>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
                <Plus size={15} /> Add Task
              </button>
            </div>
          </div>

          {/* Members */}
          <div className="card" style={{ marginBottom: 20, padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Team:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {currentProject.members?.map(m => (
                  <div key={m.user._id} className="avatar avatar-sm" title={m.user.name}
                    style={{ background: m.role === 'admin' ? '#6366f1' : '#10b981' }}>
                    {m.user.name?.[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, overflowX: 'auto' }}>
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <div key={col.id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{col.label}</span>
                      <span style={{ background: '#f1f5f9', color: 'var(--text-muted)', fontSize: 11, padding: '1px 7px', borderRadius: 999, fontWeight: 600 }}>{colTasks.length}</span>
                    </div>
                    <button className="btn-icon" onClick={() => { setShowTaskModal(true); }}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <div style={{ minHeight: 200 }}>
                    {colTasks.map(task => (
                      <TaskCard key={task._id} task={task}
                        onDelete={handleDeleteTask}
                        onEdit={t => setEditTask(t)}
                        onStatusChange={() => {}} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {showTaskModal && (
        <TaskModal project={currentProject} onClose={() => setShowTaskModal(false)} onSave={handleCreateTask} />
      )}
      {editTask && (
        <TaskModal project={currentProject} task={editTask} onClose={() => setEditTask(null)} onSave={handleEditTask} />
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Member</h2>
              <button className="btn-icon" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Member Email</label>
              <input className="form-input" type="email" placeholder="member@email.com"
                value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddMember}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
