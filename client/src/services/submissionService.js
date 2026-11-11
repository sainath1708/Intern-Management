import api from './api';
import { cleanParams } from './params';

export const listSubmissions = async (params = {}) => {
  const response = await api.get('/submissions', { params: cleanParams(params) });
  return response.data.data;
};

export const reviewSubmission = async (id, payload) => {
  const response = await api.patch(`/submissions/${id}/review`, payload);
  return response.data.data;
};
