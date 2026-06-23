import { create } from 'zustand';
import api from '../api/axios';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/projects');
      set({ projects: data.projects, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  fetchProjectById: async (id) => {
    set({ loading: true });
    try {
      const { data } = await api.get('/projects/' + id);
      set({ currentProject: data.project, loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  createProject: async (projectData) => {
    try {
      const { data } = await api.post('/projects', projectData);
      set((state) => ({ projects: [data.project, ...state.projects] }));
      return data.project;
    } catch (err) {
      set({ error: err.response?.data?.message });
      return null;
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const { data } = await api.put('/projects/' + id, projectData);
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? data.project : p)),
        currentProject: data.project,
      }));
      return data.project;
    } catch (err) {
      set({ error: err.response?.data?.message });
    }
  },

  deleteProject: async (id) => {
    try {
      await api.delete('/projects/' + id);
      set((state) => ({ projects: state.projects.filter((p) => p._id !== id) }));
    } catch (err) {
      set({ error: err.response?.data?.message });
    }
  },

  addMember: async (projectId, email, role) => {
    try {
      const { data } = await api.post('/projects/' + projectId + '/members', { email, role });
      set({ currentProject: data.project });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add member' };
    }
  },
}));

export default useProjectStore;
