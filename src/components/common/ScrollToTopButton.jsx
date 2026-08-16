import { useState, useEffect } from 'react';
import { Fab, Box, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    // Lắng nghe sự kiện cuộn chuột
    useEffect(() => {
        const toggleVisibility = () => {
            // Nếu cuộn xuống quá 300px thì hiện nút
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    // Hàm cuộn mượt mà lên đầu trang
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        // Zoom tạo hiệu ứng phóng to ra khi xuất hiện
        <Zoom in={isVisible}>
            <Box
                onClick={scrollToTop}
                role="presentation"
                sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999 }}
            >
                <Fab color="primary" size="medium" aria-label="scroll back to top" sx={{ color: '#fff' }}>
                    <KeyboardArrowUpIcon />
                </Fab>
            </Box>
        </Zoom>
    );
}