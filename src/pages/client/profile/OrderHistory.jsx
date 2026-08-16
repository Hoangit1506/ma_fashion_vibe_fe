import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Pagination, Chip, IconButton,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Dialog,
    DialogTitle, DialogContent, DialogActions, Button, Divider, InputAdornment, Tooltip, Rating
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../../services/api';

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

export default function OrderHistory() {
    const [searchParams, setSearchParams] = useSearchParams();

    // LỌC & URL STATE
    const page = parseInt(searchParams.get('page') || '1', 10);
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const [orders, setOrders] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState(keyword);

    // MODAL CHI TIẾT
    const [openModal, setOpenModal] = useState(false);
    const [orderDetail, setOrderDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    // --- STATE ĐÁNH GIÁ ---
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [productToReview, setProductToReview] = useState(null); // Lưu thông tin sp đang đánh giá
    const [rating, setRating] = useState(5);
    const [reviewContent, setReviewContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]); // Chứa file thật để upload
    const [previewUrls, setPreviewUrls] = useState([]); // Chứa URL tạm để hiển thị preview
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const navigate = useNavigate();
    const [repurchaseLoading, setRepurchaseLoading] = useState(false);

    // FETCH DATA
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders/me', {
                params: {
                    page, size: 10, keyword,
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
    }, [page, keyword, status, paymentStatus, startDate, endDate]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // DEBOUNCE SEARCH
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inputValue !== keyword) {
                setSearchParams(prev => {
                    if (inputValue) prev.set('keyword', inputValue);
                    else prev.delete('keyword');
                    prev.set('page', '1');
                    return prev;
                });
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue, keyword, setSearchParams]);

    const handleFilterChange = (field, value) => {
        setSearchParams(prev => {
            if (value) prev.set(field, value);
            else prev.delete(field);
            if (field !== 'page') prev.set('page', '1');
            return prev;
        });
    };

    // MỞ CHI TIẾT
    const handleOpenDetail = async (orderId) => {
        setOpenModal(true);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/orders/me/${orderId}`);
            setOrderDetail(res.data.result);
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

    // HỦY ĐƠN HÀNG
    const handleCancelOrder = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.")) return;

        setCancelLoading(true);
        try {
            await api.put(`/orders/me/${orderDetail.id}/cancel`);
            alert("Hủy đơn hàng thành công!");
            handleCloseModal();
            fetchOrders();
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
        } finally {
            setCancelLoading(false);
        }
    };

    // HÀM XỬ LÝ MUA LẠI
    const handleRepurchase = async () => {
        setRepurchaseLoading(true);
        try {
            await api.post(`/orders/me/${orderDetail.id}/repurchase`);
            handleCloseModal();
            navigate('/cart'); // Chuyển thẳng tới Giỏ hàng
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi thêm vào giỏ hàng");
        } finally {
            setRepurchaseLoading(false);
        }
    };

    // MỞ MODAL ĐÁNH GIÁ
    const handleOpenReviewModal = (item) => {
        setProductToReview(item);
        setRating(5);
        setReviewContent('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        setReviewModalOpen(true);
    };

    const handleCloseReviewModal = () => {
        setReviewModalOpen(false);
        setProductToReview(null);
    };

    // XỬ LÝ CHỌN FILE ẢNH/VIDEO
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length + selectedFiles.length > 5) {
            alert("Bạn chỉ được tải lên tối đa 5 tệp (ảnh/video)");
            return;
        }

        const validFiles = [];
        const newPreviewUrls = [];

        files.forEach(file => {
            // Kiểm tra dung lượng (10MB cho ảnh, 100MB cho video) - Khớp với Backend của bạn
            if (file.type.startsWith('image/') && file.size > 10 * 1024 * 1024) {
                alert(`Ảnh ${file.name} vượt quá 10MB`);
                return;
            }
            if (file.type.startsWith('video/') && file.size > 100 * 1024 * 1024) {
                alert(`Video ${file.name} vượt quá 100MB`);
                return;
            }
            validFiles.push(file);
            newPreviewUrls.push(URL.createObjectURL(file)); // Tạo link ảo để hiện preview
        });

        setSelectedFiles(prev => [...prev, ...validFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    // XÓA FILE PREVIEW
    const handleRemoveFile = (indexToRemove) => {
        setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
        setPreviewUrls(prev => {
            const newUrls = prev.filter((_, idx) => idx !== indexToRemove);
            URL.revokeObjectURL(prev[indexToRemove]); // Giải phóng bộ nhớ
            return newUrls;
        });
    };

    // GỬI ĐÁNH GIÁ LÊN SERVER
    const handleSubmitReview = async () => {
        if (!rating) return alert("Vui lòng chọn số sao đánh giá!");

        setIsSubmittingReview(true);
        try {
            const uploadedUrls = [];

            // 1. VÒNG LẶP UPLOAD TUẦN TỰ LÊN CLOUDINARY (Chống quá tải Server)
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const formData = new FormData();
                formData.append('file', file);

                // ĐÃ CHỈ ĐỊNH: Đẩy thẳng vào thư mục 'reviews'
                const res = await api.post('/media/upload?folder=reviews', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedUrls.push(res.data.result);
            }

            // 2. GỘP TOÀN BỘ DATA LẠI VÀ BẮN API TẠO REVIEW
            const reviewPayload = {
                orderId: orderDetail.id,
                productId: productToReview.productId,
                rating: rating,
                content: reviewContent,
                mediaUrls: uploadedUrls
            };

            await api.post('/reviews', reviewPayload);

            alert("Đánh giá sản phẩm thành công!");
            handleCloseReviewModal();
            fetchOrders(); // Load lại trang để nút Đánh giá tự động đổi thành "Đã đánh giá"

            // Nếu bạn đang mở Modal Chi tiết, chúng ta cần update lại orderDetail luôn 
            // để nút bên trong Modal Chi tiết cũng tự động bị vô hiệu hóa
            handleOpenDetail(orderDetail.id);

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={1}>Lịch sử Đơn hàng</Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>Theo dõi và quản lý các đơn hàng bạn đã mua</Typography>

            {/* BỘ LỌC */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', bgcolor: '#fbfbfb' }}>
                <TextField
                    size="small" placeholder="Tìm mã đơn hàng..."
                    value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    sx={{ minWidth: '200px', flexGrow: 1, bgcolor: '#fff' }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />

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

                <FormControl size="small" sx={{ minWidth: '150px', bgcolor: '#fff' }}>
                    <InputLabel>Giao hàng</InputLabel>
                    <Select value={status} label="Giao hàng" onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        {Object.entries(ORDER_STATUS).map(([key, val]) => (
                            <MenuItem key={key} value={key}>{val.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: '150px', bgcolor: '#fff' }}>
                    <InputLabel>Thanh toán</InputLabel>
                    <Select value={paymentStatus} label="Thanh toán" onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        {Object.entries(PAYMENT_STATUS).map(([key, val]) => (
                            <MenuItem key={key} value={key}>{val.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* BẢNG ĐƠN HÀNG CHÍNH */}
            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
                <Table size="medium">
                    <TableHead sx={{ backgroundColor: '#f0f0f0' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Mã ĐH</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Ngày đặt</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Tổng tiền</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Thao tác</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>Bạn chưa có đơn hàng nào phù hợp.</TableCell></TableRow>
                        ) : (
                            orders.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell><Typography variant="body2" fontWeight="bold" color="primary.main">{row.orderNumber}</Typography></TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{new Date(row.createdAt).toLocaleDateString('vi-VN')}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold" color="error.main">{formatPrice(row.totalAmount)}</Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={ORDER_STATUS[row.status]?.label} color={ORDER_STATUS[row.status]?.color} size="small" />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton color="info" onClick={() => handleOpenDetail(row.id)}>
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
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination count={totalPages} page={page} onChange={(e, val) => handleFilterChange('page', val)} color="primary" />
                </Box>
            )}

            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="md" scroll="paper">
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#111', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Chi tiết Đơn hàng {orderDetail && `#${orderDetail.orderNumber}`}
                    {orderDetail && <Chip label={ORDER_STATUS[orderDetail.status]?.label} color={ORDER_STATUS[orderDetail.status]?.color} size="small" />}
                </DialogTitle>

                <DialogContent dividers sx={{ bgcolor: '#f9f9f9', p: { xs: 2, md: 3 } }}>
                    {loadingDetail ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
                    ) : orderDetail ? (
                        <Box>
                            {/* Thông tin giao hàng & Thanh toán (Tỉ lệ 7/3 Flexbox y như bản cũ) */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3, alignItems: 'stretch' }}>
                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #eee', flex: 7, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocalShippingIcon fontSize="small" /> ĐỊA CHỈ GIAO HÀNG</Typography>
                                    <Box sx={{ flexGrow: 1, maxHeight: '120px', overflowY: 'auto', pr: 1 }}>
                                        <Typography variant="body2" fontWeight="bold">{orderDetail.receiverName} - {orderDetail.phone}</Typography>
                                        <Typography variant="body2" color="text.secondary" mt={0.5}>{orderDetail.fullAddress}</Typography>
                                        {orderDetail.note && <Typography variant="body2" color="error.main" mt={1} sx={{ fontStyle: 'italic', wordBreak: 'break-word' }}>* Ghi chú: {orderDetail.note}</Typography>}
                                    </Box>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #eee', flex: 3, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="success.main" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AttachMoneyIcon fontSize="small" /> THANH TOÁN ({orderDetail.paymentMethod})</Typography>
                                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body2" color="text.secondary">Tiền hàng:</Typography><Typography variant="body2">{formatPrice(orderDetail.totalAmount - orderDetail.shippingFee + orderDetail.discount)}</Typography></Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body2" color="text.secondary">Phí ship:</Typography><Typography variant="body2">{formatPrice(orderDetail.shippingFee)}</Typography></Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="body1" fontWeight="bold">Tổng cộng:</Typography><Typography variant="h6" fontWeight="bold" color="error.main">{formatPrice(orderDetail.totalAmount)}</Typography></Box>
                                        <Box sx={{ mt: 'auto', pt: 2 }}><Chip label={PAYMENT_STATUS[orderDetail.paymentStatus]?.label} color={PAYMENT_STATUS[orderDetail.paymentStatus]?.color} size="small" variant="outlined" sx={{ width: '100%', fontWeight: 'bold' }} /></Box>
                                    </Box>
                                </Paper>
                            </Box>


                            {/* Danh sách Sản phẩm */}
                            <Typography variant="subtitle1" fontWeight="bold" mb={2}>Sản phẩm đã mua</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {(() => {
                                    // Thuật toán: Chỉ cho phép hiện 1 Nút đánh giá cho mỗi ID Sản phẩm gốc
                                    const reviewedProducts = new Set();

                                    return orderDetail.items.map((item, index) => {
                                        const isFirstOfProduct = !reviewedProducts.has(item.productId);
                                        if (isFirstOfProduct && orderDetail.status === 'DELIVERED') {
                                            reviewedProducts.add(item.productId);
                                        }

                                        return (
                                            <Paper key={item.id || index} elevation={0} sx={{ p: 1.5, display: 'flex', gap: 2, border: '1px solid #eee', borderRadius: 2 }}>
                                                {/* 1. Ảnh gắn Link (Cố định 80x80) */}
                                                <Box component={Link} to={`/product/${item.productSlug}`} sx={{ width: 80, height: 80, borderRadius: 1, overflow: 'hidden', flexShrink: 0, display: 'block' }}>
                                                    {item.imageUrl && <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                </Box>

                                                {/* 2. Cột thông tin (Chia làm 2 dòng: Trên và Dưới) */}
                                                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                                                    {/* Dòng TRÊN: Tên SP (Trái) + Nút Đánh giá (Phải) */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                                                        <Box>
                                                            <Typography component={Link} to={`/product/${item.productSlug}`} variant="body2" fontWeight="bold" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' }, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                {item.productName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">Phân loại: {item.color} - {item.size}</Typography>
                                                        </Box>

                                                        {/* Nút Đánh giá */}
                                                        {isFirstOfProduct && orderDetail.status === 'DELIVERED' && !item.isReviewed && (
                                                            <Button
                                                                variant="outlined" size="small" color="primary"
                                                                sx={{ flexShrink: 0, textTransform: 'none', height: 'fit-content', py: 0.5 }}
                                                                onClick={() => handleOpenReviewModal(item)} // ĐÃ GẮN HÀM VÀO ĐÂY
                                                            >
                                                                Đánh giá
                                                            </Button>
                                                        )}
                                                        {/* Nút đã bị vô hiệu nếu isReviewed = true */}
                                                        {isFirstOfProduct && orderDetail.status === 'DELIVERED' && item.isReviewed && (
                                                            <Button variant="text" size="small" disabled sx={{ flexShrink: 0, textTransform: 'none', height: 'fit-content', py: 0.5 }}>
                                                                Đã đánh giá
                                                            </Button>
                                                        )}
                                                    </Box>

                                                    {/* Dòng DƯỚI: Đơn giá x SL (Trái) + Tổng tiền (Phải) */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
                                                        <Typography variant="body2" color="text.secondary">{formatPrice(item.unitPrice)} x <b>{item.quantity}</b></Typography>

                                                        {/* Giá tiền luôn ép sát lề phải, không bị xô lệch */}
                                                        <Typography variant="body2" fontWeight="bold" color="error.main">{formatPrice(item.lineTotal)}</Typography>
                                                    </Box>

                                                </Box>
                                            </Paper>
                                        );
                                    });
                                })()}
                            </Box>
                        </Box>
                    ) : null}
                </DialogContent>

                {/* Footer Modal: Gắn Nút Hủy và Nút Mua Lại */}
                <DialogActions sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #ddd', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Nút Hủy (Chỉ hiện khi PENDING) */}
                        {orderDetail?.status === 'PENDING' && (
                            <Button color="error" variant="outlined" onClick={handleCancelOrder} disabled={cancelLoading}>
                                {cancelLoading ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                            </Button>
                        )}

                        {/* Nút Mua Lại (MÀU XANH LÁ - Hiện khi đơn kết thúc) */}
                        {(orderDetail?.status === 'DELIVERED' || orderDetail?.status === 'CANCELED' || orderDetail?.status === 'REFUNDED') && (
                            <Button
                                variant="contained" color="success" sx={{ fontWeight: 'bold' }}
                                onClick={handleRepurchase}
                                disabled={repurchaseLoading}
                            >
                                {repurchaseLoading ? 'Đang xử lý...' : 'Mua lại'}
                            </Button>
                        )}
                    </Box>

                    <Button onClick={handleCloseModal} color="inherit" variant="contained" sx={{ bgcolor: '#eee', color: '#111' }}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL VIẾT ĐÁNH GIÁ (GIAO DIỆN CHUẨN SHOPEE) */}
            <Dialog open={reviewModalOpen} onClose={handleCloseReviewModal} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Đánh giá Sản phẩm</DialogTitle>
                <DialogContent sx={{ p: 3 }}>
                    {productToReview && (
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                            <Box sx={{ width: 60, height: 60, borderRadius: 1, overflow: 'hidden' }}>
                                <img src={productToReview.imageUrl} alt="sp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </Box>
                            <Typography variant="body1" fontWeight="bold" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {productToReview.productName}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, justifyContent: 'center' }}>
                        <Typography fontWeight="bold">Chất lượng sản phẩm:</Typography>
                        <Rating
                            size="large" value={rating}
                            onChange={(event, newValue) => setRating(newValue)}
                        />
                    </Box>

                    <TextField
                        multiline rows={4} fullWidth
                        placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé..."
                        value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    {/* Khu vực Upload Ảnh/Video */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {previewUrls.map((url, index) => (
                            <Box key={index} sx={{ width: 80, height: 80, position: 'relative', border: '1px solid #ccc', borderRadius: 1 }}>
                                {selectedFiles[index].type.startsWith('video/') ? (
                                    <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                                <IconButton
                                    size="small" onClick={() => handleRemoveFile(index)}
                                    sx={{ position: 'absolute', top: -10, right: -10, bgcolor: '#fff', boxShadow: 1, '&:hover': { bgcolor: '#ffebee' } }}
                                >
                                    <CloseIcon fontSize="small" color="error" />
                                </IconButton>
                            </Box>
                        ))}

                        {/* Nút thêm file (Ẩn đi nếu đã đủ 5 file) */}
                        {selectedFiles.length < 5 && (
                            <Box sx={{ width: 80, height: 80, border: '1px dashed #ccc', borderRadius: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} component="label">
                                <PhotoCameraIcon color="action" />
                                <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileSelect} />
                            </Box>
                        )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Tải lên tối đa 5 ảnh/video (Tối đa 10MB/ảnh, 100MB/video)
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
                    <Button onClick={handleCloseReviewModal} color="inherit" disabled={isSubmittingReview}>Hủy</Button>
                    <Button onClick={handleSubmitReview} variant="contained" color="primary" disabled={isSubmittingReview}>
                        {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}


