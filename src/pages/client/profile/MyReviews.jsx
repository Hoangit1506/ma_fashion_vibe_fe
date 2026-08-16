import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Tabs, Tab, Paper, Button,
    CircularProgress, Pagination, Rating, Chip, Divider,
    TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import ReviewModal from './ReviewModal';

export default function MyReviews() {
    const [currentTab, setCurrentTab] = useState(0);

    // ================= STATE: TAB 1 (CHỜ ĐÁNH GIÁ) =================
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [pagePending, setPagePending] = useState(1);
    const [totalPagesPending, setTotalPagesPending] = useState(1);

    const [searchInputPending, setSearchInputPending] = useState('');
    const [keywordPending, setKeywordPending] = useState('');
    // Thêm State Sắp xếp cho Tab 1
    const [sortOptionPending, setSortOptionPending] = useState('order.createdAt_desc');

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedProductToReview, setSelectedProductToReview] = useState(null);

    // ================= STATE: TAB 2 (LỊCH SỬ ĐÁNH GIÁ) =================
    const [historyReviews, setHistoryReviews] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [pageHistory, setPageHistory] = useState(1);
    const [totalPagesHistory, setTotalPagesHistory] = useState(1);

    const [searchInputHistory, setSearchInputHistory] = useState('');
    const [keywordHistory, setKeywordHistory] = useState('');

    const [filterRating, setFilterRating] = useState(0);
    const [filterHasMedia, setFilterHasMedia] = useState(false);
    const [filterHasComment, setFilterHasComment] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortOption, setSortOption] = useState('createdAt_desc');

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    // --- DEBOUNCE TÌM KIẾM ---
    useEffect(() => {
        const timer = setTimeout(() => setKeywordPending(searchInputPending), 500);
        return () => clearTimeout(timer);
    }, [searchInputPending]);

    useEffect(() => {
        const timer = setTimeout(() => setKeywordHistory(searchInputHistory), 500);
        return () => clearTimeout(timer);
    }, [searchInputHistory]);

    // --- API TAB 1 ---
    const fetchPendingReviews = useCallback(async () => {
        setLoadingPending(true);
        try {
            const [sortBy, direction] = sortOptionPending.split('_');
            const res = await api.get('/reviews/me/pending', {
                params: {
                    page: pagePending,
                    size: 5,
                    sortBy: sortBy,
                    direction: direction,
                    ...(keywordPending && { keyword: keywordPending })
                }
            });
            setPendingReviews(res.data.result.data);
            setTotalPagesPending(res.data.result.totalPages);
        } catch (error) {
            console.error("Lỗi lấy danh sách chờ đánh giá:", error);
        } finally {
            setLoadingPending(false);
        }
    }, [pagePending, keywordPending, sortOptionPending]);

    // --- API TAB 2 ---
    const fetchHistoryReviews = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const [sortBy, direction] = sortOption.split('_');
            const params = {
                page: pageHistory,
                size: 5,
                sortBy: sortBy,
                direction: direction,
                ...(keywordHistory && { keyword: keywordHistory }),
                ...(filterRating > 0 && { rating: filterRating }),
                ...(filterHasMedia && { hasMedia: true }),
                ...(filterHasComment && { hasComment: true }),
                ...(startDate && { startDate: `${startDate}T00:00:00` }),
                ...(endDate && { endDate: `${endDate}T23:59:59` })
            };

            const res = await api.get('/reviews/me/history', { params });
            setHistoryReviews(res.data.result.data);
            setTotalPagesHistory(res.data.result.totalPages);
        } catch (error) {
            console.error("Lỗi lấy lịch sử đánh giá:", error);
        } finally {
            setLoadingHistory(false);
        }
    }, [pageHistory, keywordHistory, filterRating, filterHasMedia, filterHasComment, startDate, endDate, sortOption]);

    useEffect(() => { if (currentTab === 0) fetchHistoryReviews(); }, [currentTab, fetchHistoryReviews]);
    useEffect(() => { if (currentTab === 1) fetchPendingReviews(); }, [currentTab, fetchPendingReviews]);

    const handleFilterChange = (setter, value) => { setter(value); setPageHistory(1); };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };


    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={1}>Đánh giá của tôi</Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>Quản lý các đánh giá sản phẩm bạn đã mua</Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
                    {/* ĐÃ ĐỔI VỊ TRÍ 2 TAB */}
                    <Tab label="Lịch sử đánh giá" sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '1rem' }} />
                    <Tab label="Chờ đánh giá" sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '1rem' }} />
                </Tabs>
            </Box>

            {/* ================= TAB 0: LỊCH SỬ ĐÁNH GIÁ (Giờ là Tab mặc định) ================= */}
            {currentTab === 0 && (
                <Box>
                    <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #eee' }}>

                        {/* ĐÃ FIX: Cho phép wrap khi thiếu chỗ (flexWrap: 'wrap') */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>

                            {/* ĐÃ FIX: Thêm minWidth: { xs: '100%', sm: 250 } để không bao giờ bị bóp nghẹt */}
                            <TextField
                                size="small" variant="outlined"
                                sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 250 }, bgcolor: 'white' }}
                                placeholder="Tìm kiếm tên sản phẩm, mã đơn, nội dung..."
                                value={searchInputHistory}
                                onChange={(e) => { setSearchInputHistory(e.target.value); setPageHistory(1); }}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
                            />

                            <FormControl size="small" sx={{ width: { xs: '100%', sm: 190 }, bgcolor: 'white', flexShrink: 0 }}>
                                <InputLabel>Sắp xếp theo</InputLabel>
                                <Select value={sortOption} label="Sắp xếp theo" onChange={(e) => handleFilterChange(setSortOption, e.target.value)}>
                                    <MenuItem value="createdAt_desc">Đánh giá mới nhất</MenuItem>
                                    <MenuItem value="createdAt_asc">Đánh giá cũ nhất</MenuItem>
                                    <MenuItem value="rating_desc">Số sao: Cao đến thấp</MenuItem>
                                    <MenuItem value="rating_asc">Số sao: Thấp đến cao</MenuItem>
                                </Select>
                            </FormControl>

                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                                <Typography variant="body2" fontWeight="500" color="text.secondary">Thời gian:</Typography>
                                <TextField type="date" size="small" sx={{ bgcolor: 'white', width: 130 }} value={startDate} onChange={(e) => handleFilterChange(setStartDate, e.target.value)} />
                                <Typography variant="body2" color="text.secondary">-</Typography>
                                <TextField type="date" size="small" sx={{ bgcolor: 'white', width: 130 }} value={endDate} onChange={(e) => handleFilterChange(setEndDate, e.target.value)} />
                                {(startDate || endDate) && (
                                    <Button size="small" color="error" variant="text" sx={{ minWidth: 'auto', p: '4px 8px' }} onClick={() => { setStartDate(''); setEndDate(''); setPageHistory(1); }}>
                                        Xóa
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <Chip label="Tất cả" onClick={() => { setFilterRating(0); setFilterHasMedia(false); setFilterHasComment(false); setPageHistory(1); }} color={filterRating === 0 && !filterHasMedia && !filterHasComment ? "primary" : "default"} variant={filterRating === 0 && !filterHasMedia && !filterHasComment ? "filled" : "outlined"} sx={{ fontWeight: '500' }} />
                            <Chip label="5 Sao" onClick={() => handleFilterChange(setFilterRating, 5)} color={filterRating === 5 ? "primary" : "default"} variant={filterRating === 5 ? "filled" : "outlined"} />
                            <Chip label="4 Sao" onClick={() => handleFilterChange(setFilterRating, 4)} color={filterRating === 4 ? "primary" : "default"} variant={filterRating === 4 ? "filled" : "outlined"} />
                            <Chip label="Có hình ảnh/video" onClick={() => handleFilterChange(setFilterHasMedia, !filterHasMedia)} color={filterHasMedia ? "primary" : "default"} variant={filterHasMedia ? "filled" : "outlined"} />
                            <Chip label="Có bình luận" onClick={() => handleFilterChange(setFilterHasComment, !filterHasComment)} color={filterHasComment ? "primary" : "default"} variant={filterHasComment ? "filled" : "outlined"} />
                        </Box>
                    </Box>

                    {loadingHistory ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
                    ) : historyReviews.length === 0 ? (
                        <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 2, border: '1px dashed #ccc' }}>
                            <Typography color="text.secondary">Không tìm thấy đánh giá nào phù hợp với bộ lọc.</Typography>
                        </Paper>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {historyReviews.map((review, index) => (
                                <Paper key={index} elevation={0} sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Rating value={review.rating} readOnly size="small" />
                                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{formatDate(review.createdAt)}</Typography>
                                        </Box>
                                    </Box>
                                    {review.content && <Typography variant="body1" mb={2}>{review.content}</Typography>}
                                    {review.mediaUrls && review.mediaUrls.length > 0 && (
                                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                                            {review.mediaUrls.map((url, i) => (
                                                <Box key={i} sx={{ width: 72, height: 72, borderRadius: 1, border: '1px solid #ddd', overflow: 'hidden' }}>
                                                    {url.includes('.mp4') ? <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={url} alt="review-media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                    <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1 }}>
                                        <Box component={Link} to={`/product/${review.productSlug}`} sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}>
                                            {review.imageUrl ? <img src={review.imageUrl} alt={review.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Box sx={{ width: '100%', height: '100%', bgcolor: '#ccc' }} />}
                                        </Box>
                                        <Box>
                                            <Typography component={Link} to={`/product/${review.productSlug}`} variant="body2" fontWeight="500" sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' }, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{review.productName}</Typography>
                                            <Typography variant="caption" color="text.secondary">Mã đơn: #{review.orderNumber}</Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))}
                            {totalPagesHistory > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Pagination count={totalPagesHistory} page={pageHistory} onChange={(e, val) => setPageHistory(val)} color="primary" />
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            {/* ================= TAB 1: CHỜ ĐÁNH GIÁ (Giờ nằm bên phải) ================= */}
            {currentTab === 1 && (
                <Box>
                    {/* ĐÃ FIX CSS BỊ LÚN CHO TAB NÀY */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                        <TextField
                            size="small" variant="outlined"
                            sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 250 }, bgcolor: 'white' }}
                            placeholder="Tìm kiếm theo Tên sản phẩm, Mã đơn hàng..."
                            value={searchInputPending}
                            onChange={(e) => { setSearchInputPending(e.target.value); setPagePending(1); }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
                        />
                        <FormControl size="small" sx={{ width: { xs: '100%', sm: 220 }, bgcolor: 'white', flexShrink: 0 }}>
                            <InputLabel>Sắp xếp theo</InputLabel>
                            <Select
                                value={sortOptionPending}
                                label="Sắp xếp theo"
                                onChange={(e) => { setSortOptionPending(e.target.value); setPagePending(1); }}
                            >
                                <MenuItem value="order.createdAt_desc">Đơn hàng mới nhất</MenuItem>
                                <MenuItem value="order.createdAt_asc">Đơn hàng cũ nhất</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {loadingPending ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
                    ) : pendingReviews.length === 0 ? (
                        <Paper sx={{ p: 5, textAlign: 'center', bgcolor: '#f9f9f9', borderRadius: 2, border: '1px dashed #ccc' }}>
                            <Typography color="text.secondary">Bạn không có đơn hàng nào đang chờ đánh giá hoặc không tìm thấy kết quả.</Typography>
                        </Paper>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {pendingReviews.map((item, index) => (
                                <Paper key={index} elevation={0} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', border: '1px solid #eee', borderRadius: 2 }}>
                                    <Box component={Link} to={`/product/${item.productSlug}`} sx={{ width: 80, height: 80, flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}>
                                        {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Box sx={{ width: '100%', height: '100%', bgcolor: '#eee' }} />}
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography component={Link} to={`/product/${item.productSlug}`} variant="subtitle1" fontWeight="bold" sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { color: 'primary.main' } }}>
                                            {item.productName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" mt={0.5}>Phân loại: {item.variantName}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Mã đơn hàng: #{item.orderNumber}</Typography>
                                    </Box>
                                    <Button variant="outlined" color="primary" sx={{ textTransform: 'none', fontWeight: 'bold', flexShrink: 0 }}
                                        onClick={() => { setSelectedProductToReview(item); setReviewModalOpen(true); }}>
                                        Đánh giá ngay
                                    </Button>
                                </Paper>
                            ))}
                            {totalPagesPending > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <Pagination count={totalPagesPending} page={pagePending} onChange={(e, val) => setPagePending(val)} color="primary" />
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            <ReviewModal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} itemToReview={selectedProductToReview} onSuccess={() => { fetchPendingReviews(); setPageHistory(1); }} />
        </Box>
    );
}

