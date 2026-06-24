import React, { useEffect, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import useTaskStore from '../store/taskStore';
import useAuthStore from '../store/authStore';
// import api from '../api/axios';
import toast from 'react-hot-toast';
import { Paperclip, Upload } from 'lucide-react';

// const statusColor = { todo: '#f59e0b', 'in-progress': '#3b82f6', review: '#8b5cf6', done: '#10b981' };
 const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

export default function TasksPage() {
  const { tasks, fetchTasks, updateTaskStatus, addComment, uploadFile, setCurrentTask, currentTask } = useTaskStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const myTasks = tasks.filter(t => t.assignedTo?._id === user?._id || t.createdBy?._id === user?._id);
  const filtered = filter === 'all' ? myTasks : myTasks.filter(t => t.status === filter);

  const handleStatusChange = async (taskId, status) => {
    await updateTaskStatus(taskId, status);
    toast.success('Status updated!');
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment(currentTask._id, comment);
    setComment('');
    toast.success('Comment added!');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const ok = await uploadFile(currentTask._id, file);
    setUploading(false);
    if (ok) toast.success('File uploaded!');
    else toast.error('Upload failed');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="My Tasks" />
        <div className="page-content fade-in">
          <div className="page-header">
            <div>
              <h2 className="page-title">My Tasks</h2>
              <p className="page-subtitle">{myTasks.length} tasks assigned to you</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['all', 'todo', 'in-progress', 'review', 'done'].map(s => (
              <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(s)}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="card empty-state"><h3>No tasks found</h3><p>Tasks assigned to you will appear here</p></div>
          ) : (
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Project</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Deadline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(task => (
                      <tr key={task._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{task.title}</div>
                          {task.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.description.substring(0, 50)}...</div>}
                        </td>
                        <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.project?.name || '—'}</span></td>
                        <td><span style={{ color: priorityColor[task.priority], fontWeight: 600, fontSize: 12 }}>● {task.priority}</span></td>
                        <td>
                          <select className="form-input form-select" value={task.status}
                            style={{ padding: '4px 28px 4px 8px', fontSize: 12, width: 'auto' }}
                            onChange={e => handleStatusChange(task._id, e.target.value)}>
                            <option value="todo">Todo</option>
                            <option value="in-progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        </td>
                        <td><span style={{ fontSize: 12 }}>{task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}</span></td>
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => setCurrentTask(task)}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Drawer */}
      {currentTask && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500 }} onClick={() => setCurrentTask(null)}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 420, background: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', overflowY: 'auto', padding: 24 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18 }}>Task Details</h2>
              <button className="btn-icon" onClick={() => setCurrentTask(null)}>✕</button>
            </div>

            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{currentTask.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{currentTask.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[['Status', currentTask.status], ['Priority', currentTask.priority], ['Deadline', currentTask.deadline ? new Date(currentTask.deadline).toLocaleDateString() : 'None'],
                ['Assigned', currentTask.assignedTo?.name || 'Unassigned']].map(([k, v]) => (
                <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* File Upload */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Paperclip size={14} /> Attachments ({currentTask.attachments?.length || 0})
              </div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload File'}
                <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
              </label>
              {currentTask.attachments?.map(f => (
  <div
    key={f._id}
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginTop: 6,
      fontSize: 12
    }}
  >
    <span>📎 {f.originalname}</span>

    <div style={{ display: "flex", gap: 8 }}>
      <a
        href={f.url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sm btn-secondary"
      >
        View
      </a>

      <a
        href={f.url}
        download
        className="btn btn-sm btn-primary"
      >
        Download
      </a>
    </div>
  </div>
))}
            </div>

            {/* Comments */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Comments ({currentTask.comments?.length || 0})</div>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                {currentTask.comments?.map(c => (
                  <div key={c._id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div className="avatar avatar-sm">{c.user?.name?.[0]}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{c.user?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" type="submit">Post</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
