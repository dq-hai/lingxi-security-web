import axios from 'axios';
import { ElMessage } from 'element-plus';

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 3000
});

service.interceptors.request.use((config) => {
  const token = localStorage.getItem('api_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，已切换为离线容灾模式');
    } else if (error.response?.status === 401) {
      ElMessage.error('业务接口授权失效，请更新安卓端接口 Token');
      localStorage.removeItem('api_token');
    } else if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default service;
