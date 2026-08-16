import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Biến này để khóa lại, ngăn việc gọi API refresh nhiều lần cùng lúc
let refreshTokenRequest = null;

// 1. REQUEST INTERCEPTOR (Người gác cổng ĐẦU RA)
api.interceptors.request.use(
    async (config) => {
        let accessToken = localStorage.getItem('accessToken');

        if (accessToken) {
            try {
                const decodedToken = jwtDecode(accessToken);
                // Date.now() tính bằng mili-giây, chia 1000 để ra giây (giống format exp của JWT)
                const currentTime = Date.now() / 1000;

                // KIỂM TRA: Nếu thời gian sống còn lại DƯỚI 2 PHÚT (120 giây) -> Phải làm mới ngay
                if (decodedToken.exp - currentTime < 120) {

                    // Nếu chưa có ai đi lấy token mới, thì mình đi lấy
                    if (!refreshTokenRequest) {
                        const refreshToken = localStorage.getItem('refreshToken');

                        if (!refreshToken) {
                            throw new Error("Không có refresh token");
                        }

                        // Gọi thẳng bằng axios thường (không dùng instance 'api' để tránh vòng lặp vô hạn)
                        refreshTokenRequest = axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
                            refreshToken: refreshToken
                        }).then(response => {
                            const newAccessToken = response.data.result.accessToken;
                            const newRefreshToken = response.data.result.refreshToken;

                            localStorage.setItem('accessToken', newAccessToken);
                            localStorage.setItem('refreshToken', newRefreshToken);

                            return newAccessToken;
                        }).catch(error => {
                            // Nếu refresh token cũng hết hạn/bị xóa -> Đăng xuất cái rụp
                            localStorage.clear();
                            window.location.href = '/login';
                            throw error;
                        }).finally(() => {
                            // Xong việc thì mở khóa cho các request sau
                            refreshTokenRequest = null;
                        });
                    }

                    // Dừng lại và ĐỢI tiến trình lấy token phía trên hoàn tất
                    accessToken = await refreshTokenRequest;
                }

                // Gắn token (cũ hoặc mới) vào Header và cho đi tiếp
                config.headers.Authorization = `Bearer ${accessToken}`;

            } catch (error) {
                // Nếu token bị lỗi định dạng (không decode được), xóa đi và bắt đăng nhập lại
                localStorage.clear();
                window.location.href = '/login';
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// 2. RESPONSE INTERCEPTOR (Người gác cổng ĐẦU VÀO - Fallback dự phòng)
// Phần này giữ lại như một lớp bảo vệ cuối cùng phòng trường hợp Backend chủ động hủy token
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Nếu Backend vẫn trả về 401 (Dù đã cố gắng bắt ở request rồi)
        if (error.response && error.response.status === 401) {
            console.error("Token bị Backend từ chối, buộc đăng xuất.");
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
