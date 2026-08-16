import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Tự động cuộn lên đầu trang mỗi khi đường dẫn thay đổi
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}