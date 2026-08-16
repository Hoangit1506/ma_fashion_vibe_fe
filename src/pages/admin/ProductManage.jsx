import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, TextField, Pagination, Chip, IconButton,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Switch, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../services/api';

export default function ProductManage() {
    const navigate = useNavigate();

    const location = useLocation();
    const [openError, setOpenError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [searchParams, setSearchParams] = useSearchParams();

    const page = parseInt(searchParams.get('page') || '1', 10);
    const keyword = searchParams.get('keyword') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const direction = searchParams.get('direction') || 'desc';

    // ĐÃ THÊM: Lấy trạng thái lọc active từ URL
    const activeFilter = searchParams.get('active') || '';

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const [inputValue, setInputValue] = useState(keyword);

    useEffect(() => {
        if (location.state?.errorMsg) {
            setErrorMsg(location.state.errorMsg);
            setOpenError(true);
            // Xóa state để không bị hiện lại khi F5
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories', { params: { page: 1, size: 1000 } });
                setCategories(res.data.result.data);
            } catch (error) { console.error("Lỗi tải danh mục:", error); }
        };
        fetchCategories();
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/products', {
                params: {
                    page, size: 10, keyword, sortBy, direction,
                    categoryId: categoryId === '' ? null : categoryId,
                    // ĐÃ THÊM: Truyền tham số active lên Backend (chuyển string thành boolean)
                    active: activeFilter === '' ? null : activeFilter === 'true'
                }
            });
            setProducts(response.data.result.data);
            setTotalPages(response.data.result.totalPages);
        } catch (error) {
            console.error("Lỗi tải sản phẩm:", error);
        } finally {
            setLoading(false);
        }
        // ĐÃ SỬA: Cập nhật dependency array để gọi lại API khi đổi filter active
    }, [page, keyword, categoryId, sortBy, direction, activeFilter]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inputValue !== keyword) {
                setSearchParams(prev => {
                    prev.set('keyword', inputValue);
                    prev.set('page', '1');
                    return prev;
                });
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue, keyword, setSearchParams]);

    const handleFilterCategory = (e) => {
        setSearchParams(prev => {
            if (e.target.value) { prev.set('categoryId', e.target.value); }
            else { prev.delete('categoryId'); }
            prev.set('page', '1');
            return prev;
        });
    };

    // ĐÃ THÊM: Hàm xử lý thay đổi Dropdown Lọc Trạng thái
    const handleFilterActive = (e) => {
        setSearchParams(prev => {
            if (e.target.value !== '') { prev.set('active', e.target.value); }
            else { prev.delete('active'); }
            prev.set('page', '1');
            return prev;
        });
    };

    const handleSortDropdown = (e) => {
        const value = e.target.value;
        if (!value) return;
        const [newSortBy, newDirection] = value.split('-');
        setSearchParams(prev => {
            prev.set('sortBy', newSortBy);
            prev.set('direction', newDirection);
            prev.set('page', '1');
            return prev;
        });
    };

    const handlePageChange = (event, value) => {
        setSearchParams(prev => { prev.set('page', value); return prev; });
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const renderPriceRange = (min, max) => min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
    const currentSortValue = `${sortBy}-${direction}`;

    const handleToggleActive = async (id) => {
        try {
            await api.patch(`/products/${id}/active`);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra khi cập nhật trạng thái!");
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" không? Thao tác này không thể hoàn tác!`)) return;

        try {
            await api.delete(`/products/${id}`);
            alert("Xóa sản phẩm thành công!");
            fetchProducts();
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi hệ thống khi xóa sản phẩm!");
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                    Quản Lý Sản Phẩm
                </Typography>
                <Button component={Link} to="/admin/products/create" variant="contained" startIcon={<AddIcon />}>
                    Thêm Mới Sản Phẩm
                </Button>
            </Box>

            {/* THANH CÔNG CỤ: TÌM KIẾM, LỌC & SẮP XẾP */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    label="Tìm kiếm tên sản phẩm..." variant="outlined" size="small"
                    value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: '200px' }}
                />

                <FormControl size="small" sx={{ minWidth: '180px' }}>
                    <InputLabel id="filter-cat-label">Lọc Danh mục</InputLabel>
                    <Select labelId="filter-cat-label" value={categoryId} label="Lọc Danh mục" onChange={handleFilterCategory}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        {categories.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>
                                {cat.name} {cat.parentName ? `(Thuộc: ${cat.parentName})` : ''}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* ĐÃ THÊM: Dropdown Lọc Trạng thái (Mở bán / Ngừng bán) */}
                <FormControl size="small" sx={{ minWidth: '160px' }}>
                    <InputLabel id="filter-active-label">Trạng thái</InputLabel>
                    <Select labelId="filter-active-label" value={activeFilter} label="Trạng thái" onChange={handleFilterActive}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        <MenuItem value="true">Đang hiển thị</MenuItem>
                        <MenuItem value="false">Đã ẩn</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: '180px' }}>
                    <InputLabel id="sort-label">Sắp xếp theo</InputLabel>
                    <Select labelId="sort-label" value={currentSortValue} label="Sắp xếp theo" onChange={handleSortDropdown}>
                        <MenuItem value="createdAt-desc">Mới nhất</MenuItem>
                        <MenuItem value="createdAt-asc">Cũ nhất</MenuItem>
                        <MenuItem value="soldCount-desc">Bán chạy nhất</MenuItem>
                        <MenuItem value="soldCount-asc">Bán ít nhất</MenuItem>
                        <MenuItem value="ratingAvg-desc">Đánh giá cao nhất</MenuItem>
                        <MenuItem value="ratingAvg-asc">Đánh giá thấp nhất</MenuItem>
                        <MenuItem value="minPrice-asc">Giá: Thấp đến Cao</MenuItem>
                        <MenuItem value="minPrice-desc">Giá: Cao đến Thấp</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {/* BẢNG DỮ LIỆU SẢN PHẨM */}
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Ảnh Bìa</TableCell>
                            <TableCell>Tên sản phẩm</TableCell>
                            <TableCell>Danh mục</TableCell>
                            <TableCell>Khoảng Giá</TableCell>
                            <TableCell align="center">Đã Bán</TableCell>
                            <TableCell align="center">Đánh Giá</TableCell>
                            <TableCell align="center">Tổng Kho</TableCell>
                            <TableCell align="center">Hiển thị (Bán)</TableCell>
                            <TableCell align="center">Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell></TableRow>
                        ) : products.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>Không tìm thấy sản phẩm nào.</TableCell></TableRow>
                        ) : (
                            products.map((row) => (
                                <TableRow key={row.id} hover sx={{ opacity: row.active ? 1 : 0.6, transition: '0.3s' }}>
                                    <TableCell>
                                        {row.thumbnail ? (
                                            <img src={row.thumbnail} alt={row.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }} />
                                        ) : (
                                            <Box sx={{ width: 50, height: 50, bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1, fontSize: 10, color: '#666' }}>No Image</Box>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{row.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">Thương hiệu: {row.brand || 'N/A'}</Typography>
                                    </TableCell>
                                    <TableCell>{row.categoryName}</TableCell>
                                    <TableCell fontWeight="bold" color="error.main">
                                        {renderPriceRange(row.minPrice, row.maxPrice)}
                                    </TableCell>

                                    <TableCell align="center">
                                        <Typography variant="body2" fontWeight="bold">{row.soldCount || 0}</Typography>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                            <Typography variant="body2" fontWeight="bold">{row.ratingAvg ? row.ratingAvg.toFixed(1) : '0.0'}</Typography>
                                            {/* Number(row.ratingAvg || 0).toFixed(1) */}
                                            <span style={{ color: '#faaf00', fontSize: '0.9rem', lineHeight: 1 }}>★</span>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Chip label={row.totalStock} color={row.totalStock > 0 ? "default" : "error"} size="small" />
                                        {row.totalReserved > 0 && (
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#e65100', fontWeight: 'medium' }}>
                                                (Đang giữ: {row.totalReserved})
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Switch
                                            checked={row.active}
                                            onChange={() => handleToggleActive(row.id)}
                                            color="success"
                                        />
                                    </TableCell>
                                    <TableCell align="center" sx={{ minWidth: '150px' }}>
                                        <IconButton color="info" component="a" href={`/product/${row.slug}`} target="_blank" title="Xem trước trên Web">
                                            <VisibilityIcon />
                                        </IconButton>

                                        <IconButton color="primary" onClick={() => navigate(`/admin/products/edit/${row.id}`)} title="Chỉnh sửa">
                                            <EditIcon />
                                        </IconButton>

                                        <IconButton color="error" onClick={() => handleDelete(row.id, row.name)} title="Xóa">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* PHÂN TRANG */}
            {totalPages > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                    <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" size="large" />
                </Box>
            )}

            <Snackbar
                open={openError}
                autoHideDuration={3000}
                onClose={() => setOpenError(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setOpenError(false)} severity="error" variant="filled" sx={{ width: '100%', fontWeight: 'bold' }}>
                    {errorMsg}
                </Alert>
            </Snackbar>

        </Box>
    );
}
