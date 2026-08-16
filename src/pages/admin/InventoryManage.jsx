import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, TextField, Pagination, Chip, IconButton,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Dialog,
    DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SearchIcon from '@mui/icons-material/Search';
import api from '../../services/api';

export default function InventoryManage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // 1. STATE LỌC & TÌM KIẾM
    const page = parseInt(searchParams.get('page') || '1', 10);
    const keyword = searchParams.get('keyword') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const direction = searchParams.get('direction') || 'desc';

    const [inventoryList, setInventoryList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState(keyword);

    // 2. STATE MODAL ĐIỀU CHỈNH KHO
    const [openModal, setOpenModal] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [adjustForm, setAdjustForm] = useState({
        changeQuantity: '',
        changeType: 'IMPORT',
        note: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // --- FETCH DANH MỤC ---
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories', { params: { page: 1, size: 1000 } });
                setCategories(res.data.result.data);
            } catch (error) { console.error(error); }
        };
        fetchCategories();
    }, []);

    // --- FETCH DATA KHO HÀNG ---
    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/inventory', {
                params: { page, size: 10, keyword, sortBy, direction, categoryId: categoryId === '' ? null : categoryId }
            });
            setInventoryList(response.data.result.data);
            setTotalPages(response.data.result.totalPages);
        } catch (error) {
            console.error("Lỗi tải danh sách kho:", error);
        } finally {
            setLoading(false);
        }
    }, [page, keyword, categoryId, sortBy, direction]);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    // --- DEBOUNCE TÌM KIẾM ---
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

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN LỌC ---
    const handleFilterCategory = (e) => {
        setSearchParams(prev => {
            if (e.target.value) prev.set('categoryId', e.target.value);
            else prev.delete('categoryId');
            prev.set('page', '1');
            return prev;
        });
    };

    const handleSortDropdown = (e) => {
        const [newSortBy, newDirection] = e.target.value.split('-');
        setSearchParams(prev => {
            prev.set('sortBy', newSortBy);
            prev.set('direction', newDirection);
            prev.set('page', '1');
            return prev;
        });
    };

    // --- XỬ LÝ MỞ / ĐÓNG MODAL NHẬP KHO ---
    const handleOpenModal = (variant) => {
        setSelectedVariant(variant);
        setAdjustForm({ changeQuantity: '', changeType: 'IMPORT', note: '' });
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedVariant(null);
    };

    const handleAdjustSubmit = async () => {
        const qty = parseInt(adjustForm.changeQuantity, 10);

        if (isNaN(qty) || qty === 0) {
            return alert("Vui lòng nhập số lượng hợp lệ (Khác 0)!");
        }

        // ĐÃ THÊM: Chặn số âm từ Frontend cho 2 loại nghiệp vụ cộng kho
        const isAutoNote = adjustForm.changeType === 'IMPORT' || adjustForm.changeType === 'RETURN';
        if (isAutoNote && qty < 0) {
            return alert("Lỗi: Số lượng Nhập thêm hoặc Khách trả hàng bắt buộc phải lớn hơn 0 (số dương)!");
        }

        if (selectedVariant.quantity + qty < 0) {
            return alert("Lỗi: Không được phép xuất/điều chỉnh âm kho!");
        }

        setSubmitting(true);
        try {
            await api.post('/admin/inventory/adjust', {
                variantId: selectedVariant.variantId,
                changeQuantity: qty,
                changeType: adjustForm.changeType,
                note: adjustForm.note
            });
            alert("Cập nhật kho thành công!");
            handleCloseModal();
            fetchInventory();
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi cập nhật kho!");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                    Quản Lý Kho Hàng
                </Typography>

            </Box>

            {/* THANH CÔNG CỤ: TÌM KIẾM & LỌC */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: '250px', border: '1px solid #ccc', borderRadius: 1, px: 1 }}>
                    <SearchIcon color="action" />
                    <TextField
                        placeholder="Tìm theo Tên Sản phẩm hoặc Mã SKU..." variant="standard"
                        value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                        sx={{ ml: 1, flex: 1, py: 1 }} InputProps={{ disableUnderline: true }}
                    />
                </Box>

                <FormControl size="small" sx={{ minWidth: '200px' }}>
                    <InputLabel>Danh mục</InputLabel>
                    <Select value={categoryId} label="Danh mục" onChange={handleFilterCategory}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        {categories.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>
                                {cat.name} {cat.parentName ? `(Thuộc: ${cat.parentName})` : ''}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: '200px' }}>
                    <InputLabel>Sắp xếp theo</InputLabel>
                    <Select value={`${sortBy}-${direction}`} label="Sắp xếp theo" onChange={handleSortDropdown}>
                        <MenuItem value="updatedAt-desc">Cập nhật gần đây</MenuItem>
                        <MenuItem value="updatedAt-asc">Cập nhật cũ nhất</MenuItem>
                        <MenuItem value="quantity-asc">Tồn kho: Thấp đến cao</MenuItem>
                        <MenuItem value="quantity-desc">Tồn kho: Cao đến thấp</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {/* BẢNG THEO DÕI KHO */}
            <TableContainer component={Paper} elevation={2}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ minWidth: 60, py: 1.5 }}>Ảnh</TableCell>
                            <TableCell sx={{ minWidth: 200, py: 1.5 }}>Sản phẩm / SKU</TableCell>
                            <TableCell sx={{ minWidth: 100, py: 1.5 }}>Phân loại</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>TỔNG KHO</TableCell>
                            <TableCell align="center" sx={{ color: '#e65100' }}>Giữ chỗ</TableCell>
                            <TableCell align="center" sx={{ color: 'primary.main', fontWeight: 'bold' }}>CÒN BÁN ĐƯỢC</TableCell>
                            <TableCell align="center" sx={{ minWidth: 100 }}>Trạng thái</TableCell>
                            <TableCell align="center">Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell></TableRow>
                        ) : inventoryList.length === 0 ? (
                            <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>Không tìm thấy dữ liệu kho phù hợp.</TableCell></TableRow>
                        ) : (
                            inventoryList.map((row) => {
                                const isLowStock = row.available > 0 && row.available <= row.safetyStock + 5;
                                const isOutOfStock = row.available <= 0;

                                return (
                                    <TableRow key={row.variantId} hover sx={{ opacity: row.active ? 1 : 0.5 }}>
                                        <TableCell>
                                            {row.imageUrl ? (
                                                <img src={row.imageUrl} alt={row.sku} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
                                            ) : (
                                                <Box sx={{ width: 40, height: 40, bgcolor: '#eee', borderRadius: 1 }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {row.productName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">SKU: <b>{row.sku}</b> | Danh mục: {row.categoryName}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{row.color}</Typography>
                                            <Typography variant="body2">{row.size}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body1" fontWeight="bold">{row.quantity}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" color="warning.dark">{row.reserved}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="h6" fontWeight="bold" color={isOutOfStock ? "error.main" : isLowStock ? "warning.main" : "success.main"}>
                                                {row.available}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            {!row.active ? (
                                                <Chip label="Ngừng bán" size="small" variant="outlined" />
                                            ) : isOutOfStock ? (
                                                <Chip label="Hết hàng" size="small" color="error" />
                                            ) : isLowStock ? (
                                                <Chip label="Sắp hết" size="small" color="warning" />
                                            ) : (
                                                <Chip label="Còn hàng" size="small" color="success" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', border: 'none' }} />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="outlined" size="small" startIcon={<EditNoteIcon />}
                                                onClick={() => handleOpenModal(row)}
                                                color="info"
                                                sx={{ fontWeight: 'bold', textTransform: 'none', borderRadius: 2, borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}
                                            >
                                                Cập nhật
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* PHÂN TRANG */}
            {totalPages > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                    <Pagination count={totalPages} page={page} onChange={(e, val) => setSearchParams(prev => { prev.set('page', val); return prev; })} color="primary" />
                </Box>
            )}

            {/* DIALOG: MODAL ĐIỀU CHỈNH KHO */}
            <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Điều chỉnh tồn kho</DialogTitle>
                <DialogContent dividers>
                    {selectedVariant && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">Sản phẩm: <b>{selectedVariant.productName}</b></Typography>
                            <Typography variant="body2" color="text.secondary">SKU: <b>{selectedVariant.sku}</b> | Phân loại: <b>{selectedVariant.color} - {selectedVariant.size}</b></Typography>
                            <Typography variant="body1" mt={1}>Tồn kho hiện tại: <b style={{ fontSize: '1.1rem' }}>{selectedVariant.quantity}</b></Typography>
                        </Box>
                    )}

                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Loại nghiệp vụ</InputLabel>
                        <Select
                            value={adjustForm.changeType} label="Loại nghiệp vụ"
                            onChange={(e) => setAdjustForm({ ...adjustForm, changeType: e.target.value })}
                        >
                            <MenuItem value="IMPORT">Nhập thêm hàng (+)</MenuItem>
                            <MenuItem value="ADJUSTMENT">Kiểm kho / Điều chỉnh lệch (+/-)</MenuItem>
                            <MenuItem value="RETURN">Khách trả hàng (+)</MenuItem>
                        </Select>
                    </FormControl>

                    {/* KHỐI INPUT SỐ LƯỢNG VÀ GHI CHÚ */}
                    {(() => {
                        const isAutoNote = adjustForm.changeType === 'IMPORT' || adjustForm.changeType === 'RETURN';
                        return (
                            <>
                                <TextField
                                    fullWidth label="Số lượng thay đổi" type="number" sx={{ mb: 3 }}
                                    placeholder={isAutoNote ? "Nhập số dương (Ví dụ: 50)" : "Nhập số dương (+) hoặc âm (-)"}
                                    value={adjustForm.changeQuantity}
                                    onChange={(e) => setAdjustForm({ ...adjustForm, changeQuantity: e.target.value })}
                                    helperText={isAutoNote ? "Bắt buộc phải là số dương lớn hơn 0" : "Ví dụ: Nhập 50 để cộng thêm, nhập -5 để trừ đi."}
                                />

                                {!isAutoNote ? (
                                    <TextField
                                        fullWidth label="Ghi chú / Lý do điều chỉnh" multiline rows={2}
                                        placeholder="Ví dụ: Kiểm kho định kỳ phát hiện lệch..."
                                        value={adjustForm.note}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                                        helperText="Hệ thống sẽ tự động nối thêm thời gian và người thực hiện vào cuối ghi chú này."
                                    />
                                ) : (
                                    <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px dashed #90caf9' }}>
                                        <Typography variant="body2" color="info.main" sx={{ fontStyle: 'italic' }}>
                                            * Hệ thống sẽ tự động tạo ghi chú chi tiết bao gồm: Tên sản phẩm, mã SKU, danh mục, thời gian và người thực hiện.
                                        </Typography>
                                    </Box>
                                )}
                            </>
                        );
                    })()}

                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseModal} color="inherit">Hủy bỏ</Button>
                    <Button onClick={handleAdjustSubmit} variant="contained" color="primary" disabled={submitting}>
                        {submitting ? 'Đang lưu...' : 'Xác nhận lưu'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}