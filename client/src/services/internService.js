import api from './api';
import { cleanParams } from './params';

export const listInterns = async (params = {}) => {
  const response = await api.get('/interns', { params: cleanParams(params) });
  return response.data.data;
};

export const getIntern = async (id) => {
  const response = await api.get(`/interns/${id}`);
  return response.data.data;
};

export const createIntern = async (payload) => {
  const response = await api.post('/interns', payload);
  return response.data.data.intern;
};

export const updateIntern = async (id, payload) => {
  const response = await api.put(`/interns/${id}`, payload);
  return response.data.data.intern;
};

export const deleteIntern = async (id) => {
  const response = await api.delete(`/interns/${id}`);
  return response.data.data;
};
