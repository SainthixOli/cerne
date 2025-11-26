import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Adjust if port is different
});

export default api;
