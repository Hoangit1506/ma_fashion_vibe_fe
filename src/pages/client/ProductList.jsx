import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Box, Typography, Container, Paper, TextField, Pagination,
    CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem,
    List, ListItem, ListItemText, ListItemButton, Divider, Card, CardContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../services/api';

export default function ProductList() {
    const [searchParams, setSearchParams] = useSearchParams();

    const page = parseInt(searchParams.get('page') || '1', 10);
    const keyword = searchParams.get('keyword') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const direction = searchParams.get('direction') || 'desc';

    const [products, setProducts] = useState([]);
    const [categoryTree, setCategoryTree] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState(keyword);

    // --- FIX LỖI ĐỒNG BỘ TỪ NAVBAR ---
    // Khi URL thay đổi do Navbar search, phải cập nhật lại Textfield của trang này
    useEffect(() => {
        setInputValue(keyword);
    }, [keyword]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories/tree');
                setCategoryTree(res.data.result);
            } catch (error) { console.error("Lỗi tải danh mục:", error); }
        };
        fetchCategories();
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/public/products', {
                params: { page, size: 12, keyword, sortBy, direction, categoryId: categoryId === '' ? null : categoryId }
            });
            setProducts(response.data.result.data);
            setTotalPages(response.data.result.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, keyword, categoryId, sortBy, direction]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // --- LOGIC SEARCH TẠI TRANG PRODUCT LIST ---
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Chỉ cập nhật URL nếu inputValue khác với keyword hiện tại trên URL
            if (inputValue !== (searchParams.get('keyword') || '')) {
                setSearchParams(prev => {
                    if (inputValue) {
                        prev.set('keyword', inputValue);
                    } else {
                        prev.delete('keyword');
                    }
                    prev.set('page', '1');
                    return prev;
                });
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue, setSearchParams, searchParams]); // ĐÃ BỎ keyword ra, thay bằng searchParams

    const handleCategoryClick = (id) => {
        setSearchParams(prev => {
            if (id) prev.set('categoryId', id);
            else prev.delete('categoryId');
            prev.set('page', '1');
            return prev;
        });
    };

    const handleSortDropdown = (e) => {
        const [newSortBy, newDirection] = e.target.value.split('-');
        setSearchParams(prev => { prev.set('sortBy', newSortBy); prev.set('direction', newDirection); prev.set('page', '1'); return prev; });
    };

    const handlePageChange = (e, value) => {
        setSearchParams(prev => { prev.set('page', value); window.scrollTo(0, 0); return prev; });
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const renderPrice = (min, max) => min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;

    return (
        <Container maxWidth="xl" sx={{ py: 4, minHeight: '80vh' }}>

            {/* THANH TÌM KIẾM VÀ SẮP XẾP */}
            <Paper sx={{ p: 2, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: '220px' }}>
                    <InputLabel>Sắp xếp</InputLabel>
                    <Select value={`${sortBy}-${direction}`} label="Sắp xếp" onChange={handleSortDropdown}>
                        <MenuItem value="createdAt-desc">Hàng mới về</MenuItem>
                        <MenuItem value="soldCount-desc">Bán chạy nhất</MenuItem>
                        <MenuItem value="ratingAvg-desc">Đánh giá tốt nhất</MenuItem>
                        <MenuItem value="minPrice-asc">Giá: Thấp đến Cao</MenuItem>
                        <MenuItem value="minPrice-desc">Giá: Cao đến Thấp</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: '400px', bgcolor: '#f5f5f5', borderRadius: 1, px: 2, py: 0.5 }}>
                    <SearchIcon color="action" sx={{ mr: 1 }} />
                    <TextField
                        variant="standard" placeholder="Tìm tên sản phẩm..." fullWidth InputProps={{ disableUnderline: true }}
                        value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    />
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>

                {/* SIDEBAR - DANH MỤC */}
                <Box sx={{ width: { xs: '100%', md: '260px' }, flexShrink: 0, position: { md: 'sticky' }, top: { md: '110px' } }}>
                    <Paper sx={{ p: 0, overflow: 'hidden' }}>
                        <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
                            DANH MỤC SẢN PHẨM
                        </Typography>
                        <List component="nav" sx={{ p: 0, maxHeight: '70vh', overflowY: 'auto' }}>
                            <ListItem disablePadding>
                                <ListItemButton selected={categoryId === ''} onClick={() => handleCategoryClick('')}>
                                    <ListItemText primary="Tất Cả Sản Phẩm" primaryTypographyProps={{ fontWeight: categoryId === '' ? 'bold' : 'normal' }} />
                                </ListItemButton>
                            </ListItem>
                            <Divider />

                            {categoryTree.map(rootCat => (
                                <Box key={rootCat.id}>
                                    <ListItem disablePadding>
                                        <ListItemButton selected={categoryId === String(rootCat.id)} onClick={() => handleCategoryClick(rootCat.id)}>
                                            <ListItemText primary={rootCat.name.toUpperCase()} primaryTypographyProps={{ fontWeight: 'bold' }} />
                                        </ListItemButton>
                                    </ListItem>

                                    {rootCat.children && rootCat.children.map(level1 => (
                                        <Box key={level1.id}>
                                            <ListItem disablePadding>
                                                <ListItemButton sx={{ pl: 4 }} selected={categoryId === String(level1.id)} onClick={() => handleCategoryClick(level1.id)}>
                                                    <ListItemText primary={`- ${level1.name}`} primaryTypographyProps={{ fontWeight: 'medium', color: categoryId === String(level1.id) ? 'primary.main' : 'text.primary' }} />
                                                </ListItemButton>
                                            </ListItem>
                                            {level1.children && level1.children.map(level2 => (
                                                <ListItem disablePadding key={level2.id}>
                                                    <ListItemButton sx={{ pl: 6 }} selected={categoryId === String(level2.id)} onClick={() => handleCategoryClick(level2.id)}>
                                                        <ListItemText primary={level2.name} primaryTypographyProps={{ fontSize: '0.85rem', color: categoryId === String(level2.id) ? 'primary.main' : 'text.secondary' }} />
                                                    </ListItemButton>
                                                </ListItem>
                                            ))}
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </List>
                    </Paper>
                </Box>

                {/* SẢN PHẨM MẶT BÊN PHẢI */}
                <Box sx={{ flexGrow: 1, width: '100%' }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>
                    ) : products.length === 0 ? (
                        <Box sx={{ textAlign: 'center', pt: 10 }}>
                            <Typography variant="h6" color="text.secondary">Không tìm thấy sản phẩm nào phù hợp.</Typography>
                        </Box>
                    ) : (
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                            gap: 3
                        }}>
                            {products.map((product) => (
                                <Card
                                    key={product.id}
                                    elevation={0}
                                    sx={{
                                        display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid #eee', bgcolor: '#fff',
                                        transition: 'all 0.3s ease',
                                        // HIỆU ỨNG HOVER BẮT CLASS .product-title (Y hệt trang chủ)
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                                            borderColor: 'primary.main',
                                            '& .product-title': { color: 'primary.main' }
                                        }
                                    }}
                                >
                                    <Box component={Link} to={`/product/${product.slug}`} sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>

                                        <Box sx={{ position: 'relative', pt: '133%', overflow: 'hidden', bgcolor: '#f9f9f9' }}>
                                            <img
                                                src={product.thumbnail || 'https://via.placeholder.com/300x400?text=No+Image'}
                                                alt={product.name}
                                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                            />

                                            {product.comparePrice && product.comparePrice > product.minPrice && product.minPrice > 0 && (
                                                <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'error.main', color: '#fff', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold', zIndex: 1, boxShadow: 2 }}>
                                                    Giảm giá {Math.round((1 - product.minPrice / product.comparePrice) * 100)}%
                                                </Box>
                                            )}

                                            {product.ratingAvg >= 3.5 && (
                                                <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(255,255,255,0.95)', color: '#111', px: 1, py: 0.4, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold', zIndex: 1, display: 'flex', alignItems: 'center', gap: 0.5, boxShadow: 1 }}>
                                                    <span style={{ color: '#faaf00', fontSize: '0.8rem', lineHeight: 1 }}>★</span> {product.ratingAvg.toFixed(1)}
                                                </Box>
                                            )}

                                        </Box>

                                        {/* ĐÃ GỌT DŨA LẠI THẺ CONTENT CHO NGẮN GỌN (Giống trang chủ) */}
                                        <CardContent sx={{
                                            flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 1.5,
                                            '&:last-child': { pb: 1.5 } // Triệt tiêu khoảng trống thừa
                                        }}>

                                            {/* TÊN SẢN PHẨM KHÓA CỨNG 2 DÒNG */}
                                            <Typography
                                                className="product-title"
                                                variant="subtitle1" fontWeight="bold"
                                                sx={{
                                                    display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis',
                                                    mb: 0.5, lineHeight: 1.2, height: '2.4em', transition: 'color 0.3s'
                                                }}
                                            >
                                                {product.name}
                                            </Typography>

                                            {/* TÊN DANH MỤC TO HƠN (0.85rem) */}
                                            <Typography variant="body1" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: 0.5 }}>
                                                {product.categoryName}
                                            </Typography>

                                            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                {/* GIÁ GỐC GẠCH NGANG TO VÀ ĐẬM (Nếu có comparePrice) */}
                                                {product.comparePrice && product.comparePrice > product.minPrice ? (
                                                    <>
                                                        <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through', fontWeight: 500, fontSize: '0.95rem' }}>
                                                            {formatPrice(product.comparePrice)}
                                                        </Typography>
                                                        <Typography variant="h6" color="error.main" fontWeight="bold" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
                                                            {renderPrice(product.minPrice, product.maxPrice)}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Typography variant="h6" color="error.main" fontWeight="bold" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>
                                                        {renderPrice(product.minPrice, product.maxPrice)}
                                                    </Typography>
                                                )}

                                                {product.totalStock <= 0 && <Chip label="Hết hàng" size="small" sx={{ mt: 0.5, height: '20px', fontSize: '0.7rem' }} />}
                                            </Box>
                                        </CardContent>
                                    </Box>
                                </Card>
                            ))}
                        </Box>
                    )}

                    {totalPages > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                            <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" size="large" />
                        </Box>
                    )}
                </Box>

            </Box>
        </Container>
    );
}
