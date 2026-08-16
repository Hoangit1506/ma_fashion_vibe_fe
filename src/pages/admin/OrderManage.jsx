import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Pagination, Chip, IconButton,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Dialog,
    DialogTitle, DialogContent, DialogActions, Button, Grid, Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import api from '../../services/api';

// --- CẤU HÌNH MÀU SẮC TRẠNG THÁI ---
const ORDER_STATUS = {
    PENDING: { label: 'Chờ xác nhận', color: 'warning' },
    CONFIRMED: { label: 'Đã xác nhận', color: 'info' },
    PROCESSING: { label: 'Đang chuẩn bị', color: 'secondary' },
    SHIPPING: { label: 'Đang giao hàng', color: 'primary' },
    DELIVERED: { label: 'Hoàn thành', color: 'success' },
    CANCELED: { label: 'Đã hủy', color: 'error' },
    REFUNDED: { label: 'Đã hoàn trả', color: 'default' }
};

const PAYMENT_STATUS = {
    UNPAID: { label: 'Chưa thanh toán', color: 'error' },
    PENDING: { label: 'Chờ xử lý', color: 'warning' },
    PAID: { label: 'Đã thanh toán', color: 'success' },
    FAILED: { label: 'Thất bại', color: 'error' },
    REFUNDED: { label: 'Đã hoàn tiền', color: 'default' }
};

export default function OrderManage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // 1. STATE LỌC & TÌM KIẾM (Đồng bộ với URL)
    const page = parseInt(searchParams.get('page') || '1', 10);
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const direction = searchParams.get('direction') || 'desc';

    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const [orders, setOrders] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState(keyword);

    // 2. STATE MODAL CHI TIẾT
    const [openModal, setOpenModal] = useState(false);
    const [orderDetail, setOrderDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- LẤY DANH SÁCH ĐƠN HÀNG ---
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders/admin', {
                params: {
                    page, size: 10, keyword, sortBy, direction,
                    status: status || null,
                    paymentStatus: paymentStatus || null,
                    startDate: startDate || null,
                    endDate: endDate || null
                }
            });
            setOrders(response.data.result.data);
            setTotalPages(response.data.result.totalPages);
        } catch (error) {
            console.error("Lỗi tải danh sách đơn hàng:", error);
        } finally {
            setLoading(false);
        }
    }, [page, keyword, status, paymentStatus, startDate, endDate, sortBy, direction]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

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

    // --- XỬ LÝ LỌC ---
    const handleFilterChange = (field, value) => {
        setSearchParams(prev => {
            if (value) prev.set(field, value);
            else prev.delete(field);

            // ĐÃ SỬA: Chỉ reset về trang 1 nếu field đang thay đổi KHÔNG PHẢI là 'page'
            if (field !== 'page') {
                prev.set('page', '1');
            }

            return prev;
        });
    };

    // --- XỬ LÝ MODAL CHI TIẾT ĐƠN HÀNG ---
    const handleOpenDetail = async (orderId) => {
        setOpenModal(true);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/orders/admin/${orderId}`);
            setOrderDetail(res.data.result);
            setNewStatus(res.data.result.status); // Gán trạng thái hiện tại vào form
        } catch (error) {
            alert("Lỗi khi lấy chi tiết đơn hàng");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setOrderDetail(null);
    };

    // --- XỬ LÝ CẬP NHẬT TRẠNG THÁI ---
    const handleUpdateStatus = async () => {
        if (newStatus === orderDetail.status) {
            return handleCloseModal(); // Không đổi thì thôi đóng lại
        }

        if (!window.confirm(`Xác nhận chuyển trạng thái thành: ${ORDER_STATUS[newStatus]?.label}?`)) return;

        setIsSubmitting(true);
        try {
            await api.patch(`/orders/admin/${orderDetail.id}/status`, { newStatus });
            alert("Cập nhật trạng thái thành công!");
            handleCloseModal();
            fetchOrders(); // Load lại danh sách (Giữ nguyên page, filter vì URL không đổi)
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi cập nhật trạng thái!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.main" mb={3}>
                Quản Lý Đơn Hàng
            </Typography>

            {/* THANH CÔNG CỤ */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: '250px', border: '1px solid #ccc', borderRadius: 1, px: 1 }}>
                    <SearchIcon color="action" />
                    <TextField
                        placeholder="Tìm mã đơn, tên hoặc SĐT khách..." variant="standard"
                        value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                        sx={{ ml: 1, flex: 1, py: 1 }} InputProps={{ disableUnderline: true }}
                    />
                </Box>

                <TextField
                    type="date" size="small" label="Từ ngày"
                    value={startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff' }}
                />
                <TextField
                    type="date" size="small" label="Đến ngày"
                    value={endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff' }}
                />

                <FormControl size="small" sx={{ minWidth: '180px' }}>
                    <InputLabel>Trạng thái giao</InputLabel>
                    <Select value={status} label="Trạng thái giao" onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        {Object.entries(ORDER_STATUS).map(([key, val]) => (
                            <MenuItem key={key} value={key}>{val.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: '180px' }}>
                    <InputLabel>Thanh toán</InputLabel>
                    <Select value={paymentStatus} label="Thanh toán" onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        {Object.entries(PAYMENT_STATUS).map(([key, val]) => (
                            <MenuItem key={key} value={key}>{val.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* BẢNG ĐƠN HÀNG */}
            <TableContainer component={Paper} elevation={2}>
                <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', py: 1.5 }}>Mã ĐH</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Khách hàng</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Ngày đặt</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Cập nhật lúc</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Tổng tiền</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Giao hàng</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Thanh toán</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Chi tiết</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>Không tìm thấy đơn hàng nào.</TableCell></TableRow>
                        ) : (
                            orders.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold" color="primary.main">{row.orderNumber}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">{row.receiverName}</Typography>
                                        <Typography variant="caption" color="text.secondary">{row.phone}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{new Date(row.createdAt).toLocaleDateString('vi-VN')}</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(row.createdAt).toLocaleTimeString('vi-VN')}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{new Date(row.updatedAt || row.createdAt).toLocaleDateString('vi-VN')}</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(row.updatedAt || row.createdAt).toLocaleTimeString('vi-VN')}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold" color="error.main">{formatPrice(row.totalAmount)}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">{row.paymentMethod}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={ORDER_STATUS[row.status]?.label} color={ORDER_STATUS[row.status]?.color} size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={PAYMENT_STATUS[row.paymentStatus]?.label} color={PAYMENT_STATUS[row.paymentStatus]?.color} variant="outlined" size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton color="info" onClick={() => handleOpenDetail(row.id)} title="Xem và Xử lý">
                                            <VisibilityIcon />
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
                    <Pagination count={totalPages} page={page} onChange={(e, val) => handleFilterChange('page', val)} color="primary" />
                </Box>
            )}

            {/* MODAL CHI TIẾT & XỬ LÝ ĐƠN HÀNG */}
            <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="md" scroll="paper">
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#111', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Chi tiết đơn hàng {orderDetail && `#${orderDetail.orderNumber}`}
                    {orderDetail && <Chip label={ORDER_STATUS[orderDetail.status]?.label} color={ORDER_STATUS[orderDetail.status]?.color} size="small" />}
                </DialogTitle>

                <DialogContent dividers sx={{ bgcolor: '#f9f9f9', p: { xs: 2, md: 4 } }}>
                    {loadingDetail ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
                    ) : orderDetail ? (
                        <Box>

                            {/* Khối thông tin khách hàng - ĐÃ CHUYỂN SANG FLEXBOX CSS THUẦN */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3, alignItems: 'stretch' }}>

                                {/* CỘT TRÁI: ĐỊA CHỈ */}
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #eee', flex: 7, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocalShippingIcon fontSize="small" /> ĐỊA CHỈ GIAO HÀNG
                                    </Typography>

                                    {/* Thanh cuộn */}
                                    <Box sx={{
                                        flexGrow: 1,
                                        maxHeight: '160px',
                                        overflowY: 'auto',
                                        pr: 1,
                                        '&::-webkit-scrollbar': { width: '5px' },
                                        '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: '5px' }
                                    }}>
                                        <Typography variant="body2" fontWeight="bold">{orderDetail.receiverName} - {orderDetail.phone}</Typography>
                                        <Typography variant="body2" color="text.secondary" mt={0.5}>{orderDetail.fullAddress}</Typography>
                                        {orderDetail.note && (
                                            <Typography variant="body2" color="error.main" mt={1} sx={{ fontStyle: 'italic', wordBreak: 'break-word' }}>
                                                * Ghi chú: {orderDetail.note}
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>

                                {/* CỘT PHẢI: THANH TOÁN */}
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #eee', flex: 3, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="success.main" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AttachMoneyIcon fontSize="small" /> THANH TOÁN ({orderDetail.paymentMethod})
                                    </Typography>

                                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Tiền hàng:</Typography>
                                            <Typography variant="body2">{formatPrice(orderDetail.totalAmount - orderDetail.shippingFee + (orderDetail.discount || 0))}</Typography>    {/* + orderDetail.discount */}
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">Phí ship:</Typography>
                                            <Typography variant="body2">{formatPrice(orderDetail.shippingFee)}</Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body1" fontWeight="bold">Tổng cộng:</Typography>
                                            <Typography variant="h6" fontWeight="bold" color="error.main">{formatPrice(orderDetail.totalAmount)}</Typography>
                                        </Box>

                                        {/* Chip trạng thái ép xuống đáy */}
                                        <Box sx={{ mt: 'auto', pt: 2 }}>
                                            <Chip
                                                label={PAYMENT_STATUS[orderDetail.paymentStatus]?.label}
                                                color={PAYMENT_STATUS[orderDetail.paymentStatus]?.color}
                                                size="small"
                                                variant="outlined"
                                                sx={{ width: '100%', fontWeight: 'bold' }}
                                            />
                                        </Box>
                                    </Box>
                                </Paper>

                            </Box>


                            {/* Danh sách sản phẩm */}
                            <Typography variant="subtitle1" fontWeight="bold" mb={2}>Sản phẩm đã đặt ({orderDetail.items.length})</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {orderDetail.items.map(item => (
                                    <Paper key={item.id} elevation={0} sx={{ p: 1.5, display: 'flex', gap: 2, alignItems: 'center', border: '1px solid #eee', borderRadius: 2 }}>
                                        <Box sx={{ width: 60, height: 80, borderRadius: 1, overflow: 'hidden', flexShrink: 0, bgcolor: '#eee' }}>
                                            {item.imageUrl ? <img src={item.imageUrl} alt="sp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="body2" fontWeight="bold" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.productName}</Typography>
                                            <Typography variant="caption" color="text.secondary">Phân loại: {item.color} - {item.size} | SKU: {item.sku}</Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                                <Typography variant="body2">{formatPrice(item.unitPrice)} x <b>{item.quantity}</b></Typography>
                                                <Typography variant="body2" fontWeight="bold" color="error.main">{formatPrice(item.lineTotal)}</Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        </Box>
                    ) : null}
                </DialogContent>


                {/* KHU VỰC ĐỔI TRẠNG THÁI */}
                <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#fff', borderTop: '1px solid #ddd' }}>
                    <Button onClick={handleCloseModal} color="inherit" disabled={isSubmitting}>Đóng</Button>

                    {/* Chỉ hiện công cụ chuyển trạng thái nếu đơn chưa vào "Ngõ cụt" (Hủy hoặc Hoàn trả) */}
                    {orderDetail && orderDetail.status !== 'CANCELED' && orderDetail.status !== 'REFUNDED' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" fontWeight="bold">Chuyển trạng thái:</Typography>
                            <FormControl size="small" sx={{ minWidth: '180px' }}>
                                <Select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    disabled={isSubmitting}
                                >
                                    {/* Nếu đơn đã giao thành công, chỉ cho phép chọn Hoàn trả */}
                                    {orderDetail.status === 'DELIVERED' ? [
                                        <MenuItem key="DELIVERED" value="DELIVERED" sx={{ color: 'green', fontWeight: 'bold' }}>Giao thành công</MenuItem>,
                                        <MenuItem key="REFUNDED" value="REFUNDED" sx={{ color: 'gray', fontWeight: 'bold' }}>Hoàn trả hàng</MenuItem>
                                    ] : (
                                        // Logic "Từng bước một"
                                        (() => {
                                            const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED'];
                                            const currentIndex = STATUS_FLOW.indexOf(orderDetail.status);
                                            const availableOptions = [];

                                            // 1. Luôn hiện trạng thái hiện tại (để Admin thấy đang đứng ở đâu)
                                            availableOptions.push(
                                                <MenuItem key={orderDetail.status} value={orderDetail.status}>
                                                    {ORDER_STATUS[orderDetail.status].label}
                                                </MenuItem>
                                            );

                                            // 2. Chỉ hiện DUY NHẤT bước tiếp theo liền kề
                                            if (currentIndex !== -1 && currentIndex < STATUS_FLOW.length - 1) {
                                                const nextStatus = STATUS_FLOW[currentIndex + 1];
                                                availableOptions.push(
                                                    <MenuItem
                                                        key={nextStatus}
                                                        value={nextStatus}
                                                        sx={nextStatus === 'DELIVERED' ? { color: 'green', fontWeight: 'bold' } : {}}
                                                    >
                                                        {ORDER_STATUS[nextStatus].label}
                                                    </MenuItem>
                                                );
                                            }

                                            // 3. Luôn chèn nút Hủy đơn hàng ở cuối (nếu chưa giao)
                                            availableOptions.push(
                                                <MenuItem key="CANCELED" value="CANCELED" sx={{ color: 'red', fontWeight: 'bold' }}>Hủy đơn hàng</MenuItem>
                                            );

                                            return availableOptions;
                                        })()
                                    )}
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleUpdateStatus}
                                disabled={isSubmitting || newStatus === orderDetail.status}
                            >
                                {isSubmitting ? 'Đang lưu...' : 'Lưu cập nhật'}
                            </Button>
                        </Box>
                    )}
                </DialogActions>

            </Dialog>
        </Box>
    );
}