import api from './api';

export const loginRequest = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data.data;
};

export const getSession = async () => {
  const response = await api.get('/auth/me');
  return response.data.data;
};
