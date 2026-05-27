import { create } from 'zustand';
import api from '../api/axios';

const useTaskStore = create((set) => ({
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,

  fetchTasks: async (projectId) => {
    set({ loading: true });
    try {
      const { data } = await api.get('/tasks', { params: { project: projectId } });
      set({ tasks: data.tasks, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  createTask: async (taskData) => {
    try {
      const { data } = await api.post('/tasks', taskData);
      set((state) => ({ tasks: [data.task, ...state.tasks] }));
      return data.task;
    } catch (err) {
      set({ error: err.response?.data?.message });
    }
  },

  updateTask: async (id, taskData) => {
    try {
      const { data } = await api.put('/tasks/' + id, taskData);
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? data.task : t)),
        currentTask: data.task,
      }));
      return data.task;
    } catch (err) {
      set({ error: err.response?.data?.message });
    }
  },

  updateTaskStatus: async (id, status) => {
    try {
      const { data } = await api.patch('/tasks/' + id + '/status', { status });
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? data.task : t)),
      }));
      return data.task;
    } catch (err) {
      set({ error: err.response?.data?.message });
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete('/tasks/' + id);
      set((state) => ({ tasks: state.tasks.filter((t) => t._id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.message });
    }
  },

  addComment: async (taskId, text) => {
    try {
      const { data } = await api.post('/tasks/' + taskId + '/comments', { text });
      set((state) => ({
        currentTask: state.currentTask ? { ...state.currentTask, comments: data.comments } : null,
      }));
    } catch (err) {
      set({ error: err.response?.data?.message });
    }
  },

  uploadFile: async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/tasks/' + taskId + '/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((state) => ({
        currentTask: state.currentTask ? { ...state.currentTask, attachments: data.attachments } : null,
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message });
      return false;
    }
  },

  setCurrentTask: (task) => set({ currentTask: task }),
}));

export default useTaskStore;
