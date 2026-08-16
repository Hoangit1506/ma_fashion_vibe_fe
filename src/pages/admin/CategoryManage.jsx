import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, TextField, Pagination, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
    TableSortLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';

export default function CategoryManage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const page = parseInt(searchParams.get('page') || '1', 10);
    const keyword = searchParams.get('keyword') || '';
    const filterParentId = searchParams.get('filterParentId') || '';
    const sortBy = searchParams.get('sortBy') || 'sortOrder';
    const direction = searchParams.get('direction') || 'asc';

    const [categories, setCategories] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState(keyword);

    const [openModal, setOpenModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [allCategoriesForDropdown, setAllCategoriesForDropdown] = useState([]);
    const [formError, setFormError] = useState('');

    // ĐÃ XÓA SLUG KHỎI FORM DATA
    const [formData, setFormData] = useState({
        name: '', parentId: '', sortOrder: 1, active: true
    });

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/categories', {
                params: { page, size: 5, keyword, filterParentId: filterParentId === '' ? null : filterParentId, sortBy, direction }
            });
            setCategories(response.data.result.data);
            setTotalPages(response.data.result.totalPages);
        } catch (error) {
            console.error("Lỗi khi tải danh mục", error);
        } finally {
            setLoading(false);
        }
    }, [page, keyword, filterParentId, sortBy, direction]);

    const fetchAllCategoriesForDropdown = async () => {
        try {
            const response = await api.get('/categories', { params: { page: 1, size: 1000 } });
            setAllCategoriesForDropdown(response.data.result.data);
        } catch (error) {
            console.error("Lỗi tải danh sách Dropdown", error);
        }
    };

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchAllCategoriesForDropdown(); }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inputValue !== keyword) {
                setSearchParams(prev => { prev.set('keyword', inputValue); prev.set('page', '1'); return prev; });
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue, keyword, setSearchParams]);

    const handleFilterParent = (e) => {
        setSearchParams(prev => { prev.set('filterParentId', e.target.value); prev.set('page', '1'); return prev; });
    };

    const handleSort = (column) => {
        const isAsc = sortBy === column && direction === 'asc';
        setSearchParams(prev => { prev.set('sortBy', column); prev.set('direction', isAsc ? 'desc' : 'asc'); prev.set('page', '1'); return prev; });
    };

    const handlePageChange = (event, value) => {
        setSearchParams(prev => { prev.set('page', value); return prev; });
    };

    const handleOpenModal = (category = null) => {
        setFormError('');
        fetchAllCategoriesForDropdown();

        if (category) {
            setIsEditMode(true);
            setCurrentId(category.id);
            setFormData({
                name: category.name,
                parentId: category.parentId || '',
                sortOrder: category.sortOrder,
                active: category.active
            });
        } else {
            setIsEditMode(false);
            setCurrentId(null);
            setFormData({ name: '', parentId: '', sortOrder: 1, active: true });
        }
        setOpenModal(true);
    };

    const handleCloseModal = () => setOpenModal(false);

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setFormError('Tên danh mục không được để trống!');
            return;
        }
        if (formData.sortOrder < 1) {
            setFormError('Thứ tự sắp xếp phải từ 1 trở lên!');
            return;
        }

        try {
            const payload = { ...formData, parentId: formData.parentId === '' ? null : formData.parentId };
            if (isEditMode) {
                await api.put(`/categories/${currentId}`, payload);
            } else {
                await api.post('/categories', payload);
            }

            handleCloseModal();
            fetchCategories();
            fetchAllCategoriesForDropdown();
        } catch (error) {
            // HIỂN THỊ LỖI BACKEND RÕ RÀNG BẰNG ALERT
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
            setFormError(errorMsg);
            alert("LỖI: " + errorMsg);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            try {
                await api.delete(`/categories/${id}`); // Cú pháp Backtick gọi chính xác ID
                alert("Đã xóa thành công!");
                fetchCategories();
                fetchAllCategoriesForDropdown(); // Update lại list để thả vào Dropdown
            } catch (error) {
                alert("LỖI XÓA: " + (error.response?.data?.message || 'Danh mục này có thể đang chứa danh mục con!'));
            }
        }
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                Quản Lý Danh Mục
            </Typography>

            <Paper sx={{ p: 2, mb: 3, mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                    label="Tìm kiếm theo tên..." variant="outlined" size="small"
                    value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    sx={{ flexGrow: 1, maxWidth: '300px' }}
                />
                <FormControl size="small" sx={{ minWidth: '200px' }}>
                    <InputLabel>Lọc theo Danh mục cha</InputLabel>
                    <Select value={filterParentId} label="Lọc theo Danh mục cha" onChange={handleFilterParent}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        <MenuItem value="0" sx={{ fontWeight: 'bold', color: 'primary.main' }}>Danh mục gốc (Root)</MenuItem>
                        {allCategoriesForDropdown.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>
                                {cat.name} {cat.parentName ? `(Thuộc: ${cat.parentName})` : ''}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                    Thêm danh mục
                </Button>
            </Paper>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: 'primary.light' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel active={sortBy === 'id'} direction={direction} onClick={() => handleSort('id')}>ID</TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel active={sortBy === 'name'} direction={direction} onClick={() => handleSort('name')}>Tên danh mục</TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Danh mục cha</TableCell>
                            <TableCell sx={{ color: 'white' }}>Đường dẫn (Tự động)</TableCell>
                            <TableCell sx={{ color: 'white' }}>
                                <TableSortLabel active={sortBy === 'sortOrder'} direction={direction} onClick={() => handleSort('sortOrder')}>Thứ tự</TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: 'white' }}>Trạng thái</TableCell>
                            <TableCell sx={{ color: 'white', textAlign: 'center' }}>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} align="center">Đang tải...</TableCell></TableRow>
                        ) : categories.map((row) => (
                            <TableRow key={row.id} hover>
                                <TableCell>{row.id}</TableCell>
                                <TableCell fontWeight="bold">{row.name}</TableCell>
                                <TableCell>
                                    {row.parentName ? (
                                        <Chip label={row.parentName} size="small" color="primary" variant="outlined" />
                                    ) : (
                                        <Chip label="Gốc (Root)" size="small" />
                                    )}
                                </TableCell>
                                <TableCell>{row.slug}</TableCell>
                                <TableCell>{row.sortOrder}</TableCell>
                                <TableCell>
                                    <Chip label={row.active ? "Hiển thị" : "Đã ẩn"} color={row.active ? "success" : "default"} size="small" />
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton color="primary" onClick={() => handleOpenModal(row)}><EditIcon /></IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
                </Box>
            )}

            {/* MODAL THÊM/SỬA - Rộng rãi và rõ ràng */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight="bold">{isEditMode ? 'Cập nhật Danh mục' : 'Thêm Danh mục mới'}</DialogTitle>
                <DialogContent dividers>

                    {formError && (
                        <Box sx={{ bgcolor: '#ffebee', color: '#c62828', p: 1.5, mb: 2, borderRadius: 1 }}>{formError}</Box>
                    )}

                    <TextField fullWidth label="Tên danh mục (*)" margin="normal" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={formData.name.trim() === ''} />

                    {/* HIỂN THỊ RÕ RÀNG TÊN CHA VÀ CON TRONG DROPDOWN */}
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Thuộc Danh mục cha</InputLabel>
                        <Select value={formData.parentId} label="Thuộc Danh mục cha" onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}>
                            <MenuItem value=""><em>-- Không có (Làm danh mục gốc) --</em></MenuItem>
                            {allCategoriesForDropdown.map(cat => (
                                <MenuItem key={cat.id} value={cat.id} disabled={cat.id === currentId}>
                                    {cat.name} {cat.parentName ? `(Thuộc: ${cat.parentName})` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField fullWidth type="number" label="Thứ tự hiển thị (*)" margin="normal" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })} inputProps={{ min: 1 }} />

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Trạng thái</InputLabel>
                        <Select value={formData.active} label="Trạng thái" onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' || e.target.value === true })}>
                            <MenuItem value={true}>Hiển thị</MenuItem>
                            <MenuItem value={false}>Ẩn</MenuItem>
                        </Select>
                    </FormControl>

                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseModal} color="inherit">Hủy bỏ</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">{isEditMode ? 'Cập nhật' : 'Lưu lại'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
