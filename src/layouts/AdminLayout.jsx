import { Outlet, useLocation, Link, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Import các Icon
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import RateReviewIcon from '@mui/icons-material/RateReview';

import ScrollToTopButton from '../components/common/ScrollToTopButton';
import logoMA from '../assets/logo.png';

const drawerWidth = 260;

export default function AdminLayout() {
    const location = useLocation();
    const { user, loading } = useContext(AuthContext);

    // 1. Chờ load thông tin user xong
    if (loading) return null;

    // 2. CHẶN VÒNG NGOÀI (Chặn User thường)
    const hasAdminAccess = user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('STAFF') || user?.roles?.includes('ROLE_STAFF');

    if (!user || !hasAdminAccess) {
        // Đá User thường về trang chủ và báo lỗi
        return <Navigate to="/" replace state={{ errorMsg: "Bạn không có quyền truy cập vào khu vực quản trị!" }} />;
    }

    // 3. Phân biệt Admin và Staff
    const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN');

    // 4. Vẽ Menu tương ứng
    let menuItems = [
        { text: 'Quản lý Sản phẩm', icon: <CheckroomIcon />, path: '/admin/products' },
        { text: 'Quản lý Tồn kho', icon: <InventoryIcon />, path: '/admin/inventory' },
        { text: 'Quản lý Đơn hàng', icon: <ShoppingCartIcon />, path: '/admin/orders' },
        { text: 'Quản lý Đánh giá', icon: <RateReviewIcon />, path: '/admin/reviews' },
    ];

    if (isAdmin) {
        menuItems = [
            { text: 'Tổng quan', icon: <DashboardIcon />, path: '/admin/dashboard' },
            { text: 'Quản lý Tài khoản', icon: <ManageAccountsIcon />, path: '/admin/users' },
            { text: 'Quản lý Danh mục', icon: <CategoryIcon />, path: '/admin/categories' },
            ...menuItems,
        ];
    }

    // 5. CHẶN VÒNG TRONG (Chặn Staff vào trang Admin)
    const isRestrictedRoute =
        location.pathname === '/admin/dashboard' ||
        location.pathname.startsWith('/admin/categories') ||
        location.pathname.startsWith('/admin/users');

    if (!isAdmin && isRestrictedRoute) {
        // Đá Staff về trang Quản lý sản phẩm và báo lỗi
        return <Navigate to="/admin/products" replace state={{ errorMsg: "Bạn không có quyền xem hoặc thao tác trang này!" }} />;
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', backgroundColor: '#3E2723', color: '#FFFFFF' } }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <img src={logoMA} alt="M.A Fashion Vibe" style={{ height: '65px', width: '65px', objectFit: 'cover', borderRadius: '50%', backgroundColor: '#fff', padding: '2px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }} />
                    </Link>
                </Box>
                <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <List sx={{ pt: 2 }}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path + '/'));
                        return (
                            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                                <ListItemButton component={Link} to={item.path} sx={{ mx: 2, borderRadius: 2, backgroundColor: isActive ? 'primary.main' : 'transparent', '&:hover': { backgroundColor: isActive ? 'primary.dark' : 'rgba(255,255,255,0.08)' } }}>
                                    <ListItemIcon sx={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', minWidth: 40 }}>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 'bold' : 'medium', color: isActive ? '#fff' : 'rgba(255,255,255,0.8)' }} />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 4, backgroundColor: '#FDFDFD', minHeight: '100vh' }}>
                <Outlet />
            </Box>
            <ScrollToTopButton />
        </Box>
    );
}


