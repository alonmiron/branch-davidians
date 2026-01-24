import axios from 'axios';

// Use relative /api in production (same-origin; Nginx proxies to backend). Use localhost in dev.
const API_URL = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const login = (username, password) => api.post('/auth/login', { username, password });
export const register = (data) => api.post('/auth/register', data);
export const getCurrentUser = () => api.get('/auth/me');
export const getUsers = () => api.get('/auth/users');
export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);

// Customers
export const getCustomers = () => api.get('/customers');
export const getNonCreditCustomers = () => api.get('/customers/non-credit');
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Manual Payments
export const getManualPayments = (params) => api.get('/manual-payments', { params });
export const getManualPayment = (id) => api.get(`/manual-payments/${id}`);
export const getCustomerPayments = (customerId) => api.get(`/manual-payments/customer/${customerId}`);
export const createManualPayment = (data) => api.post('/manual-payments', data);
export const updateManualPayment = (id, data) => api.put(`/manual-payments/${id}`, data);
export const deleteManualPayment = (id) => api.delete(`/manual-payments/${id}`);

// Charges
export const getCharges = (params) => api.get('/charges', { params });
export const getFailedCharges = (year) => api.get('/charges/failed', { params: { year } });
export const generateBatch = (data) => api.post('/charges/generate-batch', data, {
  responseType: 'blob'
});
export const uploadResults = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/charges/upload-results', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateChargeNotes = (id, data) => api.put(`/charges/${id}/notes`, data);

// Error Codes
export const getErrorCodes = () => api.get('/error-codes');

// Card History
export const getCardHistory = (customerId) => api.get(`/card-history/${customerId}`);

// Data Import
export const uploadPdfForPreview = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/import/pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const uploadCsvForPreview = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/import/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const bulkImportCustomers = (data) => api.post('/import/customers', data);

export default api;



