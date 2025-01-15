import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL, // API base URL
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_API_KEY, // Her isteğe x-api-key ekleniyor
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Token ekle
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // MAC adresi ekle (login isteği değilse)
        if (!config.url.includes('/login')) {
            const deviceMac = localStorage.getItem('device_mac');
            if (deviceMac) {
                config.headers['x-device-mac'] = deviceMac;
            }
        }

        // Debug için
        console.log('Request URL:', config.url);
        console.log('Request Headers:', JSON.stringify(config.headers, null, 2));
        if (config.data) {
            console.log('Request Body:', JSON.stringify(config.data, null, 2));
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor (isteğe bağlı)
apiClient.interceptors.response.use(
    (response) => {
        // Yanıt başarılıysa direkt döndür
        return response;
    },
    (error) => {
        // Hata durumlarını merkezi olarak ele alabilirsiniz
        console.error('API Hatası:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default apiClient;
