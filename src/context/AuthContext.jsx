import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hàm chuyên dụng để gọi API lấy thông tin Profile
    const fetchMyInfo = async () => {
        try {
            const response = await api.get('/users/me');
            const userInfo = response.data.result;
            setUser(userInfo);
            localStorage.setItem('user', JSON.stringify(userInfo));
        } catch (error) {
            console.error("Không thể lấy thông tin user", error);
            logout(); // Nếu lỗi (ví dụ token bị khóa), cho đăng xuất luôn
        }
    };

    // HÀM MỚI: Đồng bộ giỏ hàng vãng lai sau khi có Token
    const syncGuestCart = async () => {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        if (guestCart.length > 0) {
            try {
                await api.post('/cart/sync', guestCart);
                localStorage.removeItem('guestCart'); // Đồng bộ xong thì dọn rác
                window.dispatchEvent(new Event('cartUpdated')); // Báo Navbar cập nhật số
            } catch (error) {
                console.error("Lỗi đồng bộ giỏ hàng vãng lai:", error);
            }
        }
    };

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            // Thay vì lấy data cũ từ LocalStorage, ta gọi API để lấy data mới nhất từ DB
            fetchMyInfo().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, refreshToken } = response.data.result;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // SAU KHI CÓ TOKEN, GỌI API LẤY INFO NGAY LẬP TỨC
            await fetchMyInfo();

            // ĐỒNG BỘ GIỎ HÀNG VÃNG LAI NẾU CÓ
            await syncGuestCart();

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng nhập thất bại'
            };
        }
    };

    const loginWithGoogle = async (idToken) => {
        try {
            const response = await api.post('/auth/google', { idToken });
            const { accessToken, refreshToken } = response.data.result;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Lấy thông tin user
            await fetchMyInfo();

            // ĐỒNG BỘ GIỎ HÀNG VÃNG LAI NẾU CÓ
            await syncGuestCart();

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng nhập Google thất bại'
            };
        }
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error("Lỗi khi logout", error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
