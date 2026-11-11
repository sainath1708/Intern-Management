import api from './api';
import { cleanParams } from './params';

export const listTasks = async (params = {}) => {
  const response = await api.get('/tasks', { params: cleanParams(params) });
  return response.data.data;
};

export const getTask = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data.data;
};

export const createTask = async (payload) => {
  const response = await api.post('/tasks', payload);
  return response.data.data.task;
};

export const updateTask = async (id, payload) => {
  const response = await api.put(`/tasks/${id}`, payload);
  return response.data.data.task;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data.data;
};

export const updateTaskStatus = async (id, status) => {
  const response = await api.patch(`/tasks/${id}/status`, { status });
  return response.data.data.task;
};

export const submitWork = async (taskId, payload) => {
  const response = await api.post(`/tasks/${taskId}/submissions`, payload);
  return response.data.data.submission;
};
