import axios from 'axios';

// Use relative /api in production (same-origin; Nginx proxies to backend). Use localhost in dev.
const API_URL = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token and active community context
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Inject community context for super admin impersonation
    try {
      const raw = localStorage.getItem('activeCommunity');
      if (raw) {
        const community = JSON.parse(raw);
        if (community?.id) {
          config.headers['X-Community-Id'] = String(community.id);
        }
      }
    } catch { /* ignore */ }
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
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const verifyResetCode = (email, code, purpose = 'password_reset') =>
  api.post('/auth/verify-reset-code', { email, code, purpose });
export const resetPassword = (email, code, new_password) =>
  api.post('/auth/reset-password', { email, code, new_password });
export const changePassword = (current_password, new_password) =>
  api.post('/auth/change-password', { current_password, new_password });
export const updateEmail = (email) => api.post('/auth/update-email', { email });

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

// ── Credit Card Payments module ──────────────────────────────────────────────

// Residents
export const getCcResidents = () => api.get('/cc/residents');
export const getCcResident = (id) => api.get(`/cc/residents/${id}`);
export const createCcResident = (data) => api.post('/cc/residents', data);
export const updateCcResident = (id, data) => api.put(`/cc/residents/${id}`, data);
export const deleteCcResident = (id) => api.delete(`/cc/residents/${id}`);

// Custom fields
export const getCcCustomFields = (residentId) => api.get(`/cc/residents/${residentId}/custom-fields`);
export const createCcCustomField = (residentId, data) => api.post(`/cc/residents/${residentId}/custom-fields`, data);
export const updateCcCustomField = (fieldId, data) => api.put(`/cc/residents/custom-fields/${fieldId}`, data);
export const deleteCcCustomField = (fieldId) => api.delete(`/cc/residents/custom-fields/${fieldId}`);

// Overview
export const getCcOverview = (year) => api.get('/cc/payments/overview', { params: { year } });

// Monthly entries
export const updateCcEntry = (entryId, data) => api.put(`/cc/payments/entries/${entryId}`, data);
export const deleteCcEntry = (entryId) => api.delete(`/cc/payments/entries/${entryId}`);
export const createCcManualEntry = (data) => api.post('/cc/payments/entries/manual', data);

// Batch generation
export const generateCcBatch = (data) => api.post('/cc/payments/generate-batch', data, { responseType: 'blob' });
export const generateCcBatchAndEmail = (data) => api.post('/cc/payments/generate-batch-and-email', data);

// Result upload
export const uploadCcResults = (file, year, month) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/cc/payments/upload-results', formData, {
    params: { year, month },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Communities module (super admin) ─────────────────────────────────────────

export const getCommunities = () => api.get('/communities');
export const getCommunity = (id) => api.get(`/communities/${id}`);
export const getCurrentCommunity = () => api.get('/communities/current');
export const createCommunity = (data) => api.post('/communities', data);
export const updateCommunity = (id, data) => api.put(`/communities/${id}`, data);
export const deleteCommunity = (id) => api.delete(`/communities/${id}`);

// ── Residents module ─────────────────────────────────────────────────────────

export const getResidents = (params) => api.get('/residents', { params });
export const getResident = (id) => api.get(`/residents/${id}`);
export const createResident = (data) => api.post('/residents', data);
export const updateResident = (id, data) => api.put(`/residents/${id}`, data);
export const deleteResident = (id) => api.delete(`/residents/${id}`);
export const createUserForResident = (id, data) => api.post(`/residents/${id}/create-user`, data);

// Archives
export const getCcArchives = (params) => api.get('/cc/archives', { params });
export const getCcArchive = (id) => api.get(`/cc/archives/${id}`);
export const downloadCcArchive = (id) => api.get(`/cc/archives/${id}/download`, { responseType: 'blob' });
export const viewCcArchive = (id) => api.get(`/cc/archives/${id}/view`);
export const deleteCcArchive = (id) => api.delete(`/cc/archives/${id}`);

export default api;



