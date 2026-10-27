import axios from 'axios';
export const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});
// Interceptor to add Authorization header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('shelfwise_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
// Interceptor for 401 unauthorized
api.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        // Clear token if expired or invalid
        localStorage.removeItem('shelfwise_token');
        localStorage.removeItem('shelfwise_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});
