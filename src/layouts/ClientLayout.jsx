import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Navbar from '../components/client/Navbar';
import Footer from '../components/client/Footer';
import ScrollToTopButton from '../components/common/ScrollToTopButton';

export default function ClientLayout() {
    return (
        // Box này đảm bảo Footer luôn bị đẩy xuống đáy màn hình dù nội dung ở giữa ngắn hay dài
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <CssBaseline /> {/* Giúp xóa viền trắng mặc định của trình duyệt */}

            <Navbar />

            {/* Nội dung các trang (Home, Login, Detail...) sẽ hiển thị ở đây */}
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Outlet />
            </Box>

            <Footer />
            <ScrollToTopButton />
        </Box>
    );
}