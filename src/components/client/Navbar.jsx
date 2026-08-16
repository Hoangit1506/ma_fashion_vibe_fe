import { useState, useEffect, useContext, useRef } from 'react';
import {
    AppBar, Toolbar, Button, Box, IconButton, Menu, MenuItem,
    Typography, Badge, InputBase, Divider, Grid,
    Drawer, List, ListItem, ListItemButton, ListItemText, Collapse, Paper, CircularProgress
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import logoImg from '../../assets/logo.png';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Dùng chung 1 state cho Menu Tài khoản (Cả Mobile và Desktop)
    const [accountAnchorEl, setAccountAnchorEl] = useState(null);
    const [categoryTree, setCategoryTree] = useState([]);
    const [activeMegaMenu, setActiveMegaMenu] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openCollapse, setOpenCollapse] = useState({});
    const [cartCount, setCartCount] = useState(0);

    // --- THÊM STATE CHO TÌM KIẾM ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null); // Dùng để bắt sự kiện click ra ngoài

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await api.get('/categories/tree');
                setCategoryTree(res.data.result);
            } catch (error) { console.error(error); }
        };
        fetchCats();
    }, []);

    // const fetchCartCount = async () => {
    //     if (user) {
    //         try {
    //             const res = await api.get('/cart');
    //             setCartCount(res.data.result.items ? res.data.result.items.length : 0);
    //         } catch (error) { console.error(error); }
    //     } else {
    //         setCartCount(0);
    //     }
    // };

    const fetchCartCount = async () => {
        if (user) {
            try {
                const res = await api.get('/cart');
                setCartCount(res.data.result.items ? res.data.result.items.length : 0);
            } catch (error) { console.error(error); }
        } else {
            // ĐẾM CHO KHÁCH VÃNG LAI TỪ LOCAL STORAGE
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            setCartCount(guestCart.length);
        }
    };

    useEffect(() => {
        fetchCartCount();
        window.addEventListener('cartUpdated', fetchCartCount);
        return () => window.removeEventListener('cartUpdated', fetchCartCount);
    }, [user]);


    // --- LOGIC TÌM KIẾM (DEBOUNCE + GỌI API) ---
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timeoutId = setTimeout(async () => {
            try {
                // Chỉ lấy 5 sản phẩm để nhẹ web
                const res = await api.get('/public/products', {
                    params: { keyword: searchTerm, page: 1, size: 5 }
                });
                setSearchResults(res.data.result.data || []);
            } catch (error) {
                console.error("Lỗi tìm kiếm nhanh:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // --- LOGIC CLICK OUTSIDE ĐỂ ĐÓNG BẢNG ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN GÕ PHÍM ---
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            setShowDropdown(false);
            navigate(`/products?keyword=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    const handleViewAllResults = () => {
        setShowDropdown(false);
        navigate(`/products?keyword=${encodeURIComponent(searchTerm.trim())}`);
    };


    // Xử lý mở/đóng Menu Tài khoản
    const handleAccountMenuOpen = (event) => setAccountAnchorEl(event.currentTarget);
    const handleAccountMenuClose = () => setAccountAnchorEl(null);

    const handleLogout = async () => {
        handleAccountMenuClose();
        await logout();
        navigate('/');
    };

    const handleMegaMenuOpen = (event, rootId) => setActiveMegaMenu({ el: event.currentTarget, id: rootId });
    const handleMegaMenuClose = () => setActiveMegaMenu(null);
    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleToggleCollapse = (id) => setOpenCollapse((prev) => ({ ...prev, [id]: !prev[id] }));

    // Menu trượt trên Mobile
    const drawerContent = (
        <Box sx={{ bgcolor: '#fff', height: '100%', overflowY: 'auto' }}>

            {/* ĐÃ SỬA: Biến Logo thành Link bấm được để về Trang chủ */}
            <Box component={Link} to="/" onClick={handleDrawerToggle} sx={{ my: 2, display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
                <img src={logoImg} alt="M.A Fashion Logo" style={{ height: '50px', objectFit: 'contain' }} />
            </Box>

            <Divider />
            <List component="nav" sx={{ p: 0 }}>
                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/" onClick={handleDrawerToggle}>
                        <ListItemText primary="TRANG CHỦ" primaryTypographyProps={{ fontWeight: 'bold', color: 'text.primary' }} />
                    </ListItemButton>
                </ListItem>

                {/* ĐÃ SỬA: Thêm thanh phân cách */}
                <Divider />

                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/products" onClick={handleDrawerToggle}>
                        <ListItemText primary="TẤT CẢ SẢN PHẨM" primaryTypographyProps={{ fontWeight: 'bold', color: 'text.primary' }} />
                    </ListItemButton>
                </ListItem>

                {/* ĐÃ SỬA: Thêm thanh phân cách trước khi vào list danh mục */}
                <Divider />

                {categoryTree.map((rootCat) => (
                    <Box key={rootCat.id}>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => handleToggleCollapse(rootCat.id)}>
                                <ListItemText primary={rootCat.name.toUpperCase()} primaryTypographyProps={{ fontWeight: 'bold', color: 'text.primary' }} />
                                {rootCat.children?.length > 0 ? (openCollapse[rootCat.id] ? <ExpandLess /> : <ExpandMore />) : null}
                            </ListItemButton>
                        </ListItem>
                        {rootCat.children?.length > 0 && (
                            <Collapse in={openCollapse[rootCat.id]} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    <ListItemButton component={Link} to={`/products?categoryId=${rootCat.id}`} onClick={handleDrawerToggle} sx={{ pl: 4 }}>
                                        <ListItemText primary={`Xem tất cả ${rootCat.name}`} primaryTypographyProps={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'text.secondary' }} />
                                    </ListItemButton>
                                    {rootCat.children.map(level1 => (
                                        <Box key={level1.id}>
                                            <ListItemButton onClick={() => handleToggleCollapse(level1.id)} sx={{ pl: 4 }}>
                                                <ListItemText primary={level1.name.toUpperCase()} primaryTypographyProps={{ fontWeight: 'medium', fontSize: '0.95rem' }} />
                                                {level1.children?.length > 0 ? (openCollapse[level1.id] ? <ExpandLess /> : <ExpandMore />) : null}
                                            </ListItemButton>
                                            {level1.children?.length > 0 && (
                                                <Collapse in={openCollapse[level1.id]} timeout="auto" unmountOnExit>
                                                    <List component="div" disablePadding>
                                                        {level1.children.map(level2 => (
                                                            <ListItemButton key={level2.id} component={Link} to={`/products?categoryId=${level2.id}`} onClick={handleDrawerToggle} sx={{ pl: 6 }}>
                                                                <ListItemText primary={level2.name} primaryTypographyProps={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                                                            </ListItemButton>
                                                        ))}
                                                    </List>
                                                </Collapse>
                                            )}
                                        </Box>
                                    ))}
                                </List>
                            </Collapse>
                        )}
                        {/* ĐÃ SỬA: Gạch dưới mỗi danh mục gốc cho dễ nhìn */}
                        <Divider />
                    </Box>
                ))}

                <ListItem disablePadding>
                    <ListItemButton component={Link} to="/contact" onClick={handleDrawerToggle}>
                        <ListItemText primary="LIÊN HỆ" primaryTypographyProps={{ fontWeight: 'bold', color: 'text.primary' }} />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <AppBar position="sticky" elevation={1} sx={{ backgroundColor: '#ffffff', zIndex: 1000, borderBottom: '3px solid', borderBottomColor: 'primary.main' }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '85px', px: { xs: 2, md: 4 } }}>

                {/* KHU VỰC BÊN TRÁI: Dấu 3 gạch (Mobile) + Logo */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: { xs: 1, sm: 2 }, display: { md: 'none' }, color: 'text.primary' }}>
                        <MenuIcon sx={{ fontSize: 28 }} />
                    </IconButton>
                    <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', mr: { xs: 1, lg: 4 } }}>
                        <img src={logoImg} alt="M.A Fashion Logo" style={{ height: '60px', objectFit: 'contain' }} />
                    </Box>
                </Box>

                {/* KHU VỰC GIỮA: Menu Desktop */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center', flexGrow: 1, ml: 2 }}>
                    <Button component={Link} to="/" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: '1rem', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>TRANG CHỦ</Button>

                    {categoryTree.map(rootCat => (
                        <Box key={rootCat.id} onMouseLeave={handleMegaMenuClose} sx={{ display: 'inline-block', height: '100%', py: 3 }}>
                            <Button
                                component={Link} to={`/products?categoryId=${rootCat.id}`}
                                onMouseEnter={(e) => handleMegaMenuOpen(e, rootCat.id)}
                                endIcon={rootCat.children && rootCat.children.length > 0 ? <KeyboardArrowDownIcon /> : null}
                                sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: '1rem', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                            >
                                {rootCat.name.toUpperCase()}
                            </Button>

                            {/* Menu con có đường kẻ Vàng Kim (secondary.main) */}
                            {rootCat.children && rootCat.children.length > 0 && (
                                <Menu
                                    anchorEl={activeMegaMenu?.id === rootCat.id ? activeMegaMenu.el : null}
                                    open={activeMegaMenu?.id === rootCat.id}
                                    onClose={handleMegaMenuClose}
                                    MenuListProps={{ onMouseLeave: handleMegaMenuClose }}
                                    sx={{ mt: 1, pointerEvents: 'none' }}
                                    PaperProps={{ sx: { pointerEvents: 'auto', width: '70vw', maxWidth: '900px', p: 2, borderRadius: 2, boxShadow: 4, borderTop: '3px solid', borderTopColor: 'secondary.main' } }}
                                >
                                    <Grid container spacing={4} sx={{ px: 2 }}>
                                        {rootCat.children.map(level1 => (
                                            <Grid item xs={12} sm={4} key={level1.id}>
                                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, borderBottom: '2px solid', borderBottomColor: 'primary.main', display: 'inline-block' }}>
                                                    <Link to={`/products?categoryId=${level1.id}`} onClick={handleMegaMenuClose} style={{ textDecoration: 'none', color: '#3E2723' }}>
                                                        {level1.name.toUpperCase()}
                                                    </Link>
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {level1.children && level1.children.map(level2 => (
                                                        <Link
                                                            key={level2.id} to={`/products?categoryId=${level2.id}`} onClick={handleMegaMenuClose}
                                                            style={{ textDecoration: 'none', color: '#795548', fontSize: '0.95rem', transition: '0.2s' }}
                                                            onMouseOver={(e) => e.target.style.color = '#66BB6A'}
                                                            onMouseOut={(e) => e.target.style.color = '#795548'}
                                                        >
                                                            {level2.name}
                                                        </Link>
                                                    ))}
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Menu>
                            )}
                        </Box>
                    ))}
                    <Button component={Link} to="/contact" sx={{ color: 'text.primary', fontWeight: 'bold', fontSize: '1rem', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}>LIÊN HỆ</Button>
                </Box>

                {/* KHU VỰC BÊN PHẢI: Search, Cart, Account Icon */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>

                    {/* Thanh tìm kiếm - Luôn hiển thị, thu nhỏ lại trên điện thoại */}
                    <Box ref={searchRef} sx={{ position: 'relative', width: { xs: '130px', sm: '200px', md: '230px' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f3f4', borderRadius: '20px', px: { xs: 1.5, sm: 2 }, py: 0.7, width: '100%' }}>
                            <SearchIcon sx={{ color: 'primary.main', mr: 1, fontSize: 20 }} />
                            <InputBase
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => searchTerm.trim() && setShowDropdown(true)}
                                onKeyDown={handleSearchKeyDown}
                                sx={{ width: '100%', fontSize: { xs: '0.85rem', sm: '0.95rem' } }}
                            />
                        </Box>

                        {/* BẢNG KẾT QUẢ DROPDOWN LƠ LỬNG */}
                        {showDropdown && searchTerm.trim() && (
                            <Paper elevation={4} sx={{ position: 'absolute', top: '120%', right: { xs: -50, sm: 0 }, width: { xs: '260px', sm: '320px' }, bgcolor: '#fff', borderRadius: 2, overflow: 'hidden', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
                                {isSearching ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} color="primary" /></Box>
                                ) : searchResults.length === 0 ? (
                                    <Box sx={{ p: 2, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">Không tìm thấy "{searchTerm}"</Typography></Box>
                                ) : (
                                    <List sx={{ p: 0 }}>
                                        {searchResults.map(item => (
                                            <ListItemButton key={item.id} component={Link} to={`/product/${item.slug}`} onClick={() => setShowDropdown(false)} sx={{ borderBottom: '1px solid #f0f0f0', gap: 1.5, p: 1.5, '&:hover': { bgcolor: '#f9f9f9' } }}>
                                                <img src={item.thumbnail || 'https://via.placeholder.com/40'} alt={item.name} style={{ width: 45, height: 45, objectFit: 'cover', borderRadius: '4px' }} />
                                                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                                    <Typography variant="body2" fontWeight="bold" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {item.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="error.main" fontWeight="bold">
                                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.minPrice)}
                                                    </Typography>
                                                </Box>
                                            </ListItemButton>
                                        ))}
                                        <ListItemButton onClick={handleViewAllResults} sx={{ justifyContent: 'center', bgcolor: '#f5f5f5', py: 1.5, '&:hover': { bgcolor: '#eaeaea' } }}>
                                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                                                Xem tất cả kết quả
                                            </Typography>
                                        </ListItemButton>
                                    </List>
                                )}
                            </Paper>
                        )}
                    </Box>

                    {/* Icon Giỏ hàng điểm xuyết chấm Vàng Kim */}
                    <IconButton component={Link} to="/cart" sx={{ color: 'text.primary', p: 0.5 }}>
                        <Badge badgeContent={cartCount} sx={{ '& .MuiBadge-badge': { backgroundColor: 'secondary.main', color: 'white' } }}>
                            <ShoppingCartIcon sx={{ fontSize: 26 }} />
                        </Badge>
                    </IconButton>

                    {/* CHỈ DÙNG 1 ICON TÀI KHOẢN CHO CẢ CHƯA LOGIN VÀ ĐÃ LOGIN */}
                    <IconButton onClick={handleAccountMenuOpen} sx={{ p: 0.5, color: 'text.primary', '&:hover': { color: 'primary.main' } }}>
                        {user ? (
                            <AccountCircleIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                        ) : (
                            <AccountCircleOutlinedIcon sx={{ fontSize: 28 }} />
                        )}
                    </IconButton>

                    {/* Menu Tài Khoản Hợp Nhất */}
                    <Menu
                        anchorEl={accountAnchorEl}
                        open={Boolean(accountAnchorEl)}
                        onClose={handleAccountMenuClose}
                        sx={{ mt: 1 }}
                        PaperProps={{ sx: { minWidth: 160, borderRadius: 2, mt: 1, boxShadow: 3 } }}
                    >
                        {user ? [
                            // Render list này nếu ĐÃ đăng nhập
                            <MenuItem key="profile" onClick={handleAccountMenuClose} component={Link} to="/profile" sx={{ fontWeight: 'bold', color: 'text.primary', '&:hover': { color: 'primary.main' } }}>Quản lý thông tin cá nhân</MenuItem>,

                            (user.roles && (user.roles.includes('ADMIN') || user.roles.includes('STAFF'))) && (
                                <MenuItem
                                    key="admin"
                                    onClick={handleAccountMenuClose}
                                    component={Link}
                                    to={user.roles.includes('ADMIN') ? "/admin/dashboard" : "/admin/products"}
                                    sx={{ fontWeight: 'bold', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
                                >
                                    Trang quản trị
                                </MenuItem>
                            ),

                            <MenuItem key="logout" onClick={handleLogout} sx={{ color: 'error.main', fontWeight: 'bold' }}>Đăng xuất</MenuItem>
                        ] : [
                            // Render list này nếu CHƯA đăng nhập (ĐÃ SỬA: Màu Nâu/Đen mặc định, hover Xanh lá)
                            <MenuItem key="login" onClick={handleAccountMenuClose} component={Link} to="/login" sx={{ fontWeight: 'bold', color: 'text.primary', '&:hover': { color: 'primary.main' } }}>Đăng nhập</MenuItem>,
                            <MenuItem key="register" onClick={handleAccountMenuClose} component={Link} to="/register" sx={{ fontWeight: 'bold', color: 'text.primary', '&:hover': { color: 'primary.main' } }}>Đăng ký</MenuItem>
                        ]}
                    </Menu>

                </Box>
            </Toolbar>

            <Drawer anchor="left" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 280 } }}>
                {drawerContent}
            </Drawer>
        </AppBar>
    );
}

