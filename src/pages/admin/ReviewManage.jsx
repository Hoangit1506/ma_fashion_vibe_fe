import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Pagination, CircularProgress, Chip, IconButton,
    TextField, MenuItem, Select, FormControl, InputLabel, Button, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Grid, Rating, Switch
} from '@mui/material';

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import api from '../../services/api';

export default function ReviewManage() {
    // 1. MA THUẬT GIỮ VỊ TRÍ: DÙNG URL PARAMS
    const [searchParams, setSearchParams] = useSearchParams();

    const page = parseInt(searchParams.get('page') || '1', 10);
    const keyword = searchParams.get('keyword') || '';
    const rating = searchParams.get('rating') || '';
    const approved = searchParams.get('approved') || '';

    const hasMedia = searchParams.get('hasMedia') || '';
    const hasComment = searchParams.get('hasComment') || '';

    const categoryId = searchParams.get('categoryId') || '';

    const [categories, setCategories] = useState([]);

    // Local State cho Search Input
    const [searchInput, setSearchInput] = useState(keyword);

    // State Dữ liệu
    const [reviews, setReviews] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    // State cho Modal Phản hồi
    const [replyModal, setReplyModal] = useState({
        open: false,
        reviewId: null,
        productName: '',
        text: ''
    });

    // State cho Modal Xác nhận Ẩn/Hiện
    const [confirmModal, setConfirmModal] = useState({ open: false, reviewId: null, currentStatus: true });

    // State cho Modal Phóng to Ảnh/Video
    const [previewMedia, setPreviewMedia] = useState(null);

    const [viewModal, setViewModal] = useState(null);

    // Hàm check Video
    const isVideo = (url) => url && (url.match(/\.(mp4|webm|mov|ogg)$/i) || url.includes('video/upload'));

    // --- HÀM TẢI DỮ LIỆU (DỰA VÀO URL) ---
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            // Biến đổi Params từ URL để ném xuống Backend
            const params = {
                page,
                size: 10,
                sortBy: 'createdAt',
                direction: 'desc'
            };
            if (keyword) params.keyword = keyword;
            if (rating) params.rating = rating;
            if (approved !== '') params.approved = approved;

            if (hasMedia === 'true') params.hasMedia = true;
            if (hasComment === 'true') params.hasComment = true;

            if (categoryId) params.categoryId = categoryId;

            const res = await api.get('/reviews/admin', { params });
            setReviews(res.data.result.data);
            setTotalPages(res.data.result.totalPages);
        } catch (error) {
            console.error("Lỗi lấy danh sách đánh giá", error);
        } finally {
            setLoading(false);
        }
    }, [page, keyword, rating, approved, hasMedia, hasComment, categoryId]);

    // Lắng nghe URL thay đổi là tự động tải lại dữ liệu
    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);


    // Lấy danh sách Category 1 lần khi mở trang
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories', { params: { page: 1, size: 1000 } });
                setCategories(res.data.result.data);
            } catch (error) {
                console.error("Lỗi lấy danh mục", error);
            }
        };
        fetchCategories();
    }, []);

    // --- HÀM XỬ LÝ BỘ LỌC VÀ CHUYỂN TRANG ---
    const updateParams = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        // Khi đổi bộ lọc, tự động quay về trang 1
        if (key !== 'page') newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handleSearch = () => updateParams('keyword', searchInput);

    // Bắt sự kiện ấn Enter khi search
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSearch();
    };


    // --- ĐÃ SỬA: HÀM XỬ LÝ ẨN/HIỆN (CÓ XÁC NHẬN) ---
    const handleOpenConfirm = (review) => {
        setConfirmModal({ open: true, reviewId: review.id, currentStatus: review.approved });
    };

    const handleCloseConfirm = () => {
        setConfirmModal({ open: false, reviewId: null, currentStatus: true });
    };

    const handleConfirmToggle = async () => {
        try {
            await api.patch(`/reviews/admin/${confirmModal.reviewId}/toggle-status`);
            handleCloseConfirm();
            fetchReviews(); // Tải lại dữ liệu tại trang hiện tại
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái", error);
        }
    };


    const handleOpenReplyModal = (review) => {
        setReplyModal({
            open: true,
            reviewId: review.id,
            productName: review.productName,
            text: review.adminReply || '' // Nếu đã có câu trả lời thì nạp vào để sửa
        });
    };

    const handleCloseReplyModal = () => {
        setReplyModal({ ...replyModal, open: false });
    };

    const handleSubmitReply = async () => {
        if (!replyModal.text.trim()) return;
        try {
            await api.post(`/reviews/admin/${replyModal.reviewId}/reply`, {
                replyContent: replyModal.text
            });
            handleCloseReplyModal();
            fetchReviews(); // Tải lại dữ liệu để hiện câu trả lời mới
        } catch (error) {
            console.error("Lỗi gửi phản hồi", error);
        }
    };

    // --- GIAO DIỆN ---
    return (
        <Box sx={{ pb: 5 }}>
            <Typography variant="h4" fontWeight="bold" color="primary.main" mb={3}>
                Quản Lý Đánh Giá
            </Typography>

            {/* BỘ LỌC */}
            {/* BỘ LỌC (DÙNG CSS GRID THUẦN TÚY - CHIA 4 CỘT TUYỆT ĐỐI) */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#fbfbfb', border: '1px solid #eee', boxShadow: 'none' }}>
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, // Chia đúng 4 cột bằng nhau trên PC
                    gap: 2
                }}>

                    {/* ================= DÒNG 1 (4 Thành phần) ================= */}
                    <TextField
                        fullWidth size="small" label="Tìm Tên khách / Tên SP / Nội dung..." variant="outlined"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        sx={{ bgcolor: '#fff' }}
                        InputProps={{
                            endAdornment: (
                                <IconButton onClick={handleSearch} edge="end"><SearchIcon /></IconButton>
                            ),
                        }}
                    />

                    <FormControl fullWidth size="small" sx={{ bgcolor: '#fff' }}>
                        <InputLabel>Danh mục</InputLabel>
                        <Select
                            value={categoryId}
                            label="Danh mục"
                            onChange={(e) => updateParams('categoryId', e.target.value)}
                        >
                            <MenuItem value="">Tất cả danh mục</MenuItem>
                            {categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>
                                    {cat.name} {cat.parentName ? `(${cat.parentName})` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" sx={{ bgcolor: '#fff' }}>
                        <InputLabel>Số sao</InputLabel>
                        <Select value={rating} label="Số sao" onChange={(e) => updateParams('rating', e.target.value)}>
                            <MenuItem value="">Tất cả số sao</MenuItem>
                            <MenuItem value="5">5 Sao (Tuyệt vời)</MenuItem>
                            <MenuItem value="4">4 Sao (Tốt)</MenuItem>
                            <MenuItem value="3">3 Sao (Trung bình)</MenuItem>
                            <MenuItem value="2">2 Sao (Không tốt)</MenuItem>
                            <MenuItem value="1">1 Sao (Tệ)</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" sx={{ bgcolor: '#fff' }}>
                        <InputLabel>Trạng thái</InputLabel>
                        <Select value={approved} label="Trạng thái" onChange={(e) => updateParams('approved', e.target.value)}>
                            <MenuItem value="">Tất cả trạng thái</MenuItem>
                            <MenuItem value="true">Đang hiển thị</MenuItem>
                            <MenuItem value="false">Đã bị ẩn</MenuItem>
                        </Select>
                    </FormControl>

                    {/* ================= DÒNG 2 (3 Thành phần, tự động rớt xuống) ================= */}
                    <FormControl fullWidth size="small" sx={{ bgcolor: '#fff' }}>
                        <InputLabel>Nội dung chữ</InputLabel>
                        <Select value={hasComment} label="Nội dung chữ" onChange={(e) => updateParams('hasComment', e.target.value)}>
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="true">Có văn bản</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" sx={{ bgcolor: '#fff' }}>
                        <InputLabel>Đính kèm</InputLabel>
                        <Select value={hasMedia} label="Đính kèm" onChange={(e) => updateParams('hasMedia', e.target.value)}>
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="true">Có Hình/Video</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        onClick={() => setSearchParams(new URLSearchParams())}
                        sx={{ height: '40px', whiteSpace: 'nowrap' }}
                    >
                        Xóa Bộ Lọc
                    </Button>

                </Box>
            </Paper>

            {/* BẢNG DỮ LIỆU */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Khách hàng & Thời gian</b></TableCell>
                                <TableCell><b>Sản phẩm</b></TableCell>
                                <TableCell sx={{ width: 120 }}><b>Đánh giá</b></TableCell>
                                <TableCell sx={{ width: '30%' }}><b>Nội dung & Phản hồi</b></TableCell>
                                <TableCell align="center"><b>Hiển thị</b></TableCell>
                                <TableCell align="center"><b>Thao tác</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                            ) : reviews.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Không tìm thấy đánh giá nào</TableCell></TableRow>
                            ) : (
                                reviews.map((row) => (
                                    <TableRow key={row.id} hover sx={{ opacity: row.approved ? 1 : 0.6 }}>
                                        {/* Khách hàng */}
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{row.userName}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(row.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </TableCell>

                                        {/* Sản phẩm */}
                                        <TableCell>
                                            <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {row.productName}
                                            </Typography>
                                        </TableCell>

                                        {/* Số sao */}
                                        <TableCell>
                                            <Rating value={row.rating} readOnly size="small" />
                                        </TableCell>


                                        {/* Nội dung Review & Admin Reply (Cắt ngắn chống vỡ bảng) */}
                                        <TableCell>
                                            <Typography variant="body2" sx={{
                                                mb: 1, fontStyle: row.content ? 'normal' : 'italic', color: row.content ? 'text.primary' : 'text.secondary',
                                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' // Cắt ngắn 2 dòng
                                            }}>
                                                {row.content || "(Không có nội dung chữ)"}
                                            </Typography>

                                            {/* Chỉ hiển thị số lượng file */}
                                            {row.mediaUrls && row.mediaUrls.length > 0 && (
                                                <Chip icon={<ImageIcon />} label={`${row.mediaUrls.length} file đính kèm`} size="small" variant="outlined" color="primary" sx={{ mb: 1 }} />
                                            )}

                                            {/* Cắt ngắn phản hồi Admin */}
                                            {row.adminReply && (
                                                <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, borderLeft: '3px solid #1976d2' }}>
                                                    <Typography variant="caption" fontWeight="bold" color="primary" display="block">↳ {row.repliedByAdminName}:</Typography>
                                                    <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {row.adminReply}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </TableCell>


                                        {/* CỘT HIỂN THỊ (GẮN LOGIC KHÓA SWITCH) */}
                                        <TableCell align="center">
                                            {/* Nếu đơn hàng bị REFUNDED hoặc CANCELED -> Khóa Switch, chỉ hiện mác Đã ẩn */}
                                            {row.orderStatus === 'REFUNDED' || row.orderStatus === 'CANCELED' ? (
                                                <Tooltip title="Đơn hàng đã hoàn trả/hủy. Đánh giá này bị khóa vĩnh viễn.">
                                                    <Chip label="Bị khóa" color="default" size="small" sx={{ fontWeight: 'bold', color: '#757575' }} />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title={row.approved ? "Tắt hiển thị" : "Bật hiển thị"}>
                                                    <Switch
                                                        checked={row.approved}
                                                        onChange={() => handleOpenConfirm(row)}
                                                        color="success"
                                                    />
                                                </Tooltip>
                                            )}
                                        </TableCell>

                                        {/* CỘT THAO TÁC */}
                                        <TableCell align="center">
                                            <Tooltip title="Xem chi tiết">
                                                <IconButton color="info" onClick={() => setViewModal(row)}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>

                                            {/* Khóa luôn nút Phản hồi nếu đơn đã hoàn trả (vì khách trả hàng rồi, phản hồi làm gì nữa) */}
                                            <Tooltip title={row.orderStatus === 'REFUNDED' ? "Không thể phản hồi đơn đã hoàn trả" : (row.adminReply ? "Sửa phản hồi" : "Phản hồi khách")}>
                                                <span>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleOpenReplyModal(row)}
                                                        disabled={row.orderStatus === 'REFUNDED' || row.orderStatus === 'CANCELED'}
                                                    >
                                                        {row.adminReply ? <EditIcon /> : <ReplyIcon />}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* PHÂN TRANG */}
                {!loading && totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            color="primary"
                            onChange={(e, val) => updateParams('page', val)}
                        />
                    </Box>
                )}
            </Paper>

            {/* MODAL PHẢN HỒI */}
            <Dialog open={replyModal.open} onClose={handleCloseReplyModal} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    Phản hồi đánh giá
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Sản phẩm: <b>{replyModal.productName}</b>
                    </Typography>
                    <TextField
                        autoFocus fullWidth multiline rows={4}
                        label="Nhập nội dung phản hồi của cửa hàng..."
                        placeholder="Chào bạn, cảm ơn bạn đã ủng hộ M.A Fashion Vibe..."
                        value={replyModal.text}
                        onChange={(e) => setReplyModal({ ...replyModal, text: e.target.value })}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        * Câu trả lời này sẽ được hiển thị công khai trên website cho tất cả mọi người cùng xem.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseReplyModal} color="inherit">Hủy</Button>
                    <Button onClick={handleSubmitReply} variant="contained" disabled={!replyModal.text.trim()}>
                        Gửi Phản Hồi
                    </Button>
                </DialogActions>
            </Dialog>


            {/* MODAL XEM CHI TIẾT ĐÁNH GIÁ (FULL NỘI DUNG & ẢNH) */}
            <Dialog open={Boolean(viewModal)} onClose={() => setViewModal(null)} fullWidth maxWidth="md">
                {viewModal && (
                    <>
                        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Chi tiết đánh giá
                            <Chip label={viewModal.approved ? "Đang hiển thị" : "Đã ẩn"} color={viewModal.approved ? "success" : "error"} size="small" />
                        </DialogTitle>
                        <DialogContent dividers>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">{viewModal.userName}</Typography>
                                    <Typography variant="body2" color="text.secondary">{new Date(viewModal.createdAt).toLocaleString('vi-VN')}</Typography>
                                </Box>
                                <Rating value={viewModal.rating} readOnly size="large" sx={{ color: '#faaf00' }} />
                            </Box>

                            <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {viewModal.content || "(Khách hàng không để lại bình luận)"}
                            </Typography>


                            {/* Khung hiển thị Media (Chỉ hiện Thumbnail, bấm vào mới phóng to) */}
                            {viewModal.mediaUrls && viewModal.mediaUrls.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                                    {viewModal.mediaUrls.map((url, idx) => (
                                        <Box
                                            key={idx}
                                            onClick={() => setPreviewMedia(url)} // Bấm vào để mở Preview
                                            sx={{ width: 120, height: 120, borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd', position: 'relative', cursor: 'pointer', transition: '0.2s', '&:hover': { opacity: 0.8, borderColor: '#111' } }}
                                        >
                                            {isVideo(url) ? (
                                                <>
                                                    <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Typography sx={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>VIDEO</Typography>
                                                    </Box>
                                                </>
                                            ) : (
                                                <img src={url} alt={`media-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}


                            {/* Khung hiển thị Phản hồi Admin */}
                            {viewModal.adminReply && (
                                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary" mb={1}>
                                        Phản hồi từ {viewModal.repliedByAdminName}:
                                    </Typography>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {viewModal.adminReply}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                        Vào lúc: {new Date(viewModal.repliedAt).toLocaleString('vi-VN')}
                                    </Typography>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button onClick={() => setViewModal(null)} variant="contained" color="inherit">Đóng</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* MODAL XÁC NHẬN ẨN/HIỆN ĐÁNH GIÁ */}
            <Dialog open={confirmModal.open} onClose={handleCloseConfirm}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Xác nhận thay đổi</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn <b>{confirmModal.currentStatus ? "ẨN" : "HIỂN THỊ"}</b> đánh giá này không?
                        {confirmModal.currentStatus && <><br /><Typography variant="caption" color="error">* Đánh giá bị ẩn sẽ không còn xuất hiện trên trang chủ sản phẩm nữa.</Typography></>}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseConfirm} color="inherit">Hủy</Button>
                    <Button onClick={handleConfirmToggle} variant="contained" color={confirmModal.currentStatus ? "error" : "success"}>
                        Đồng ý {confirmModal.currentStatus ? "Ẩn" : "Hiện"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL PHÓNG TO ẢNH/VIDEO ĐÁNH GIÁ (GIỐNG TRANG CHI TIẾT SP) */}
            <Dialog
                open={Boolean(previewMedia)}
                onClose={() => setPreviewMedia(null)}
                maxWidth="md"
                PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible' } }}
            >
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', outline: 'none' }}>
                    <IconButton
                        onClick={() => setPreviewMedia(null)}
                        sx={{ position: 'absolute', top: -20, right: -20, bgcolor: '#fff', boxShadow: 3, '&:hover': { bgcolor: '#f5f5f5' }, zIndex: 10 }}
                    >
                        <CloseIcon />
                    </IconButton>

                    {isVideo(previewMedia) ? (
                        <video src={previewMedia} controls autoPlay style={{ maxHeight: '80vh', maxWidth: '100%', borderRadius: '8px' }} />
                    ) : (
                        <img src={previewMedia} alt="preview" style={{ maxHeight: '80vh', maxWidth: '100%', borderRadius: '8px' }} />
                    )}
                </Box>
            </Dialog>

        </Box>
    );
}