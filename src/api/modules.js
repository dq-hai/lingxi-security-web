import request from './index';

export const login = (data) => request.post('/api/v1/auth/login', data);
export const register = (data) => request.post('/api/v1/auth/register', data);

export const getUserProfile = () => request.get('/api/v1/user/profile');
export const getGuardianList = () => request.get('/api/v1/guardians/list');
export const bindGuardian = (data) => request.post('/api/v1/guardians/bind', data);
export const syncProfile = (data) => request.post('/api/v1/user/profile/update', data);

export const submitRagAnalyze = (data) => request.post('/api/v1/fraud-detect/rag-analyze', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 20000
});

export const submitAnalyze = (data) => request.post('/api/v1/analyze', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getTaskStatus = (taskId, config = {}) => request.get(`/api/v1/fraud-detect/task/${taskId}`, config);

export const analyzeUrl = (data) => request.post('/api/v1/fraud-detect/analyzeUrl', data, {
  timeout: 20000
});
export const analyzeUrlV2 = (data) => request.post('/api/v1/fraud-detect/url-analyze', data);

export const addKnowledgeData = (data) => request.post('/api/v1/new_data', data);
export const generateReport = (data) => request.post('/api/v1/report', data, {
  timeout: 20000
});
