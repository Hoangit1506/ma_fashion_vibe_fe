import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, loading } = useContext(AuthContext);

    // 1. Nếu đang gọi API kiểm tra token, hiện vòng xoay chờ
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    // 2. Nếu chưa đăng nhập, tự động chuyển hướng về trang Login
    if (!user) {
        return <Navigate to="/login" replace state={{ errorMsg: "Vui lòng đăng nhập để truy cập trang này!" }} />;
    }

    // 3. Nếu route này yêu cầu quyền cụ thể (VD: chỉ ADMIN mới được vào)
    // user.roles của bạn từ Backend trả về sẽ là mảng: ["ADMIN", "USER", "STAFF"]
    if (allowedRoles) {
        const hasPermission = user.roles.some((role) => allowedRoles.includes(role));

        if (!hasPermission) {
            // Nếu không có quyền, đá về trang chủ (hoặc trang báo lỗi 403)
            return <Navigate to="/" replace state={{ errorMsg: "Bạn không có quyền truy cập vào khu vực này!" }} />;
        }
    }

    // Nếu qua hết các bài kiểm tra, cho phép hiển thị nội dung trang (Outlet)
    return <Outlet />;
}