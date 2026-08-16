import { useContext } from 'react';
import { Box, Container, Paper, List, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider } from '@mui/material';
import { Outlet, Link, useLocation } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import { AuthContext } from '../../../context/AuthContext';

export default function ProfileLayout() {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    // Kiểm tra tab đang active
    const isActive = (path) => {
        if (path === '/profile' && location.pathname === '/profile') return true;
        if (path !== '/profile' && location.pathname.includes(path)) return true;
        return false;
    };

    // Hàm lấy chữ cái đầu của Tên
    const getFirstNameInitial = (fullName) => {
        if (!fullName) return 'U';
        const words = fullName.trim().split(/\s+/);
        return words[words.length - 1].charAt(0).toUpperCase();
    };

    if (!user) return null;

    return (
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '80vh' }}>

            {/* ĐÃ SỬA: Dùng cấu trúc Flexbox y hệt trang ProductList */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>

                {/* 1. CỘT TRÁI: SIDEBAR DÍNH (Khóa cứng 280px) */}
                <Box sx={{ width: { xs: '100%', md: '280px' }, flexShrink: 0, position: { md: 'sticky' }, top: { md: '110px' } }}>
                    <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>

                        {/* Khu vực Avatar và Tên */}
                        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fafafa' }}>
                            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', color: '#fff', fontSize: '1.6rem', fontWeight: 'bold', flexShrink: 0 }}>
                                {getFirstNameInitial(user.fullName)}
                            </Avatar>

                            {/* KHÓA CỨNG TRÀN CHỮ: overflow hidden kết hợp textOverflow ellipsis */}
                            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                <Typography variant="body2" color="text.secondary">Xin chào,</Typography>
                                <Typography
                                    variant="subtitle1" fontWeight="bold"
                                    sx={{
                                        color: '#111', lineHeight: 1.2,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}
                                >
                                    {user.fullName || 'Khách hàng'}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Danh sách Menu */}
                        <List sx={{ p: 1 }}>
                            <ListItemButton component={Link} to="/profile" selected={isActive('/profile')} sx={{ borderRadius: 1, mb: 0.5, '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.dark', '&:hover': { bgcolor: 'primary.light' } } }}>
                                <ListItemIcon sx={{ minWidth: 40, color: isActive('/profile') ? 'primary.dark' : 'inherit' }}><PersonOutlineIcon /></ListItemIcon>
                                <ListItemText primary="Thông tin tài khoản" primaryTypographyProps={{ fontWeight: isActive('/profile') ? 'bold' : 'medium' }} />
                            </ListItemButton>

                            {user.provider === 'LOCAL' && (
                                <ListItemButton component={Link} to="/profile/password" selected={isActive('/profile/password')} sx={{ borderRadius: 1, mb: 0.5, '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.dark' } }}>
                                    <ListItemIcon sx={{ minWidth: 40, color: isActive('/profile/password') ? 'primary.dark' : 'inherit' }}><LockOutlinedIcon /></ListItemIcon>
                                    <ListItemText primary="Đổi mật khẩu" primaryTypographyProps={{ fontWeight: isActive('/profile/password') ? 'bold' : 'medium' }} />
                                </ListItemButton>
                            )}

                            <ListItemButton component={Link} to="/profile/addresses" selected={isActive('/profile/addresses')} sx={{ borderRadius: 1, mb: 0.5, '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.dark' } }}>
                                <ListItemIcon sx={{ minWidth: 40, color: isActive('/profile/addresses') ? 'primary.dark' : 'inherit' }}><LocationOnOutlinedIcon /></ListItemIcon>
                                <ListItemText primary="Sổ địa chỉ" primaryTypographyProps={{ fontWeight: isActive('/profile/addresses') ? 'bold' : 'medium' }} />
                            </ListItemButton>

                            <ListItemButton component={Link} to="/profile/orders" selected={isActive('/profile/orders')} sx={{ borderRadius: 1, '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.dark' } }}>
                                <ListItemIcon sx={{ minWidth: 40, color: isActive('/profile/orders') ? 'primary.dark' : 'inherit' }}><ReceiptLongOutlinedIcon /></ListItemIcon>
                                <ListItemText primary="Lịch sử đơn hàng" primaryTypographyProps={{ fontWeight: isActive('/profile/orders') ? 'bold' : 'medium' }} />
                            </ListItemButton>

                            <ListItemButton
                                component={Link}
                                to="/profile/reviews"
                                selected={isActive('/profile/reviews')}
                                sx={{ borderRadius: 1, '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.dark' } }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: isActive('/profile/reviews') ? 'primary.dark' : 'inherit' }}>
                                    <StarOutlineIcon />
                                </ListItemIcon>
                                <ListItemText primary="Đánh giá của tôi" primaryTypographyProps={{ fontWeight: isActive('/profile/reviews') ? 'bold' : 'medium' }} />
                            </ListItemButton>

                        </List>
                    </Paper>
                </Box>

                {/* 2. CỘT PHẢI: NỘI DUNG (Chiếm toàn bộ phần không gian còn lại) */}
                <Box sx={{ flexGrow: 1, width: '100%' }}>
                    <Paper elevation={1} sx={{ borderRadius: 2, p: { xs: 3, md: 4 } }}>
                        {/* Nơi chứa Form ProfileInfo sẽ tự động dàn đều bên trong này */}
                        <Outlet />
                    </Paper>
                </Box>

            </Box>
        </Container>
    );
}
