import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Container, Box, Typography, Button, IconButton,
    CircularProgress, Paper, Divider, Rating, Avatar,
    Accordion, AccordionSummary, AccordionDetails, Card, CardContent, Chip, Dialog, Pagination,
    Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // --- STATE SẢN PHẨM ---
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [mainImage, setMainImage] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);

    const thumbScrollRef = useRef(null);

    // --- STATE ĐÁNH GIÁ ---
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0, totalPages: 1 });
    const [reviewPage, setReviewPage] = useState(1);

    // STATE BỘ LỌC
    const [reviewFilter, setReviewFilter] = useState(null); // null = Tất cả, 5 = 5 sao...
    const [filterHasComment, setFilterHasComment] = useState(false);
    const [filterHasMedia, setFilterHasMedia] = useState(false);

    // STATE SẮP XẾP
    const [sortOption, setSortOption] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'

    const [loadingReviews, setLoadingReviews] = useState(false);
    const [previewMedia, setPreviewMedia] = useState(null);

    const isVideo = (url) => {
        if (!url) return false;
        return url.match(/\.(mp4|webm|mov|ogg)$/i) || url.includes('video/upload');
    };

    const getAvatarName = (fullName) => {
        if (!fullName) return 'U';
        const words = fullName.trim().split(' ');
        return words[words.length - 1].charAt(0).toUpperCase();
    };

    // 1. GỌI API LẤY THÔNG TIN SẢN PHẨM
    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/public/products/${slug}`);
                const data = res.data.result;
                setProduct(data);

                if (data.imageUrls && data.imageUrls.length > 0) setMainImage(data.imageUrls[0]);
                if (data.variants && data.variants.length > 0) {
                    setSelectedColor(data.variants[0].color);
                    setSelectedSize(data.variants[0].size);
                }

                if (data.categoryId) {
                    const relatedRes = await api.get('/public/products', {
                        params: { page: 1, size: 5, categoryId: data.categoryId }
                    });
                    setRelatedProducts(relatedRes.data.result.data.filter(p => p.id !== data.id).slice(0, 4));
                }
            } catch (error) {
                console.error("Lỗi:", error);
                alert("Sản phẩm không tồn tại hoặc đã bị ẩn!");
                navigate('/products');
            } finally {
                setLoading(false);
            }
        };
        fetchProductData();
        window.scrollTo(0, 0);
    }, [slug, navigate]);

    // 2. GỌI API LẤY ĐÁNH GIÁ (Chạy lại khi có bất kỳ thay đổi nào về Lọc/Sắp xếp)
    const fetchReviews = useCallback(async () => {
        if (!product) return;
        setLoadingReviews(true);
        try {
            let sortBy = 'createdAt';
            let direction = 'desc';

            if (sortOption === 'oldest') { sortBy = 'createdAt'; direction = 'asc'; }
            else if (sortOption === 'highest') { sortBy = 'rating'; direction = 'desc'; }
            else if (sortOption === 'lowest') { sortBy = 'rating'; direction = 'asc'; }

            const reviewRes = await api.get(`/reviews/public/product/${product.id}`, {
                params: {
                    page: reviewPage,
                    size: 5,
                    rating: reviewFilter || null,
                    hasComment: filterHasComment || null,
                    hasMedia: filterHasMedia || null,
                    sortBy: sortBy,
                    direction: direction
                }
            });
            const result = reviewRes.data.result;
            setReviews(result.data || []);
            setReviewStats({
                averageRating: result.averageRating || 0,
                totalReviews: result.totalReviews || 0,
                totalPages: result.totalPages || 1
            });
        } catch (e) {
            setReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    }, [product, reviewPage, reviewFilter, sortOption, filterHasComment, filterHasMedia]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Reset về trang 1 khi đổi bộ lọc
    const handleFilterChange = (setter, value) => {
        setter(value);
        setReviewPage(1);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress color="primary" /></Box>;
    if (!product) return null;

    const availableColors = [...new Set(product.variants.map(v => v.color))];
    const availableSizes = [...new Set(product.variants.map(v => v.size))];

    const getStock = (v) => v ? Math.max(0, v.stockQuantity) : 0;
    const currentVariantRaw = product.variants.find(v => v.color === selectedColor && v.size === selectedSize);
    const currentVariant = currentVariantRaw ? { ...currentVariantRaw, stockQuantity: getStock(currentVariantRaw) } : null;

    const getImageForColor = (color) => {
        const variantWithImg = product.variants.find(v => v.color === color && v.imageUrl);
        return variantWithImg ? variantWithImg.imageUrl : null;
    };

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        const img = getImageForColor(color);
        if (img) setMainImage(img);

        const nextVariant = product.variants.find(v => v.color === color && v.size === selectedSize);
        if (nextVariant && quantity > getStock(nextVariant)) {
            setQuantity(Math.max(1, getStock(nextVariant)));
        }
    };

    const handleSizeSelect = (size) => {
        setSelectedSize(size);
        const nextVariant = product.variants.find(v => v.color === selectedColor && v.size === size);
        if (nextVariant && quantity > getStock(nextVariant)) {
            setQuantity(Math.max(1, getStock(nextVariant)));
        }
    };

    const handleQuantityChange = (type) => {
        if (!currentVariant) return;
        if (type === 'minus' && quantity > 1) setQuantity(quantity - 1);
        if (type === 'plus' && quantity < currentVariant.stockQuantity) setQuantity(quantity + 1);
    };

    const handleAddToCart = async () => {
        if (!currentVariant) {
            alert("Vui lòng chọn Màu và Size!");
            return false;
        }
        if (currentVariant.stockQuantity < quantity) {
            alert("Kho không đủ số lượng!");
            return false;
        }

        // XỬ LÝ KHÁCH VÃNG LAI (CHƯA ĐĂNG NHẬP)
        if (!user) {
            let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const existingIndex = guestCart.findIndex(item => item.variantId === currentVariant.id);

            if (existingIndex !== -1) {
                // Nếu đã có, cộng dồn
                let newQty = guestCart[existingIndex].quantity + quantity;
                guestCart[existingIndex].quantity = newQty;
            } else {
                // Nếu chưa có, thêm mới
                guestCart.push({ variantId: currentVariant.id, quantity: quantity });
            }

            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            window.dispatchEvent(new Event('cartUpdated')); // Báo Navbar
            alert("Đã thêm vào giỏ hàng thành công!");
            return true;
        }

        // XỬ LÝ USER ĐÃ ĐĂNG NHẬP
        try {
            await api.post('/cart/items', { variantId: currentVariant.id, quantity: quantity });
            window.dispatchEvent(new Event('cartUpdated'));
            alert("Đã thêm vào giỏ hàng thành công!");
            return true;
        } catch (error) {
            console.error("Lỗi thêm giỏ hàng:", error);
            alert(error.response?.data?.message || "Có lỗi xảy ra khi thêm vào giỏ hàng.");
            return false;
        }
    };

    const handleBuyNow = async () => {
        const success = await handleAddToCart();
        if (success) navigate('/cart');
    };

    const scrollThumbs = (direction) => {
        if (thumbScrollRef.current) {
            const scrollAmount = thumbScrollRef.current.clientWidth / 5 + 12;
            thumbScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const renderPrice = (min, max) => min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;

    // STYLE NÚT LỌC ĐÁNH GIÁ (Tinh chỉnh sang trọng hơn)
    const activeFilterSx = { bgcolor: '#111', color: '#fff', '&:hover': { bgcolor: '#333' }, borderRadius: 8, px: 2.5, fontWeight: 'bold', textTransform: 'none' };
    const inactiveFilterSx = { borderColor: '#ddd', color: '#555', '&:hover': { borderColor: '#111', color: '#111' }, borderRadius: 8, px: 2.5, fontWeight: 'bold', textTransform: 'none' };

    return (
        <Container maxWidth="xl" sx={{ py: 6, bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, lg: 8 }, alignItems: 'flex-start' }}>

                {/* ======================================================== */}
                {/* CỘT BÊN TRÁI: HÌNH ẢNH */}
                {/* ======================================================== */}
                <Box sx={{ width: { xs: '100%', md: '50%' }, position: { md: 'sticky' }, top: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', maxWidth: '480px' }}>
                        <Box sx={{ width: '100%', position: 'relative', pt: '133%', bgcolor: '#f5f5f5', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
                            {isVideo(mainImage) ? (
                                <video src={mainImage} controls autoPlay muted loop playsInline style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }} />
                            ) : (
                                <img src={mainImage || 'https://via.placeholder.com/600x800'} alt={product.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                            )}
                        </Box>

                        <Box sx={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {product.imageUrls?.length > 5 && (
                                <IconButton onClick={() => scrollThumbs('left')} sx={{ position: 'absolute', left: -16, zIndex: 2, bgcolor: '#fff', border: '1px solid #ddd', boxShadow: 1, '&:hover': { bgcolor: '#f0f0f0' }, width: 32, height: 32 }}>
                                    <ArrowBackIosNewIcon sx={{ fontSize: '1rem' }} color="action" />
                                </IconButton>
                            )}

                            <Box ref={thumbScrollRef} sx={{ display: 'flex', gap: '12px', overflowX: 'auto', scrollBehavior: 'smooth', width: '100%', py: 1, justifyContent: product.imageUrls?.length < 5 ? 'center' : 'flex-start', scrollSnapType: 'x mandatory', '&::-webkit-scrollbar': { display: 'none' } }}>
                                {product.imageUrls?.map((img, idx) => (
                                    <Box key={idx} onClick={() => setMainImage(img)} sx={{ position: 'relative', width: 'calc((100% - 48px) / 5)', aspectRatio: '3/4', flexShrink: 0, cursor: 'pointer', borderRadius: 1, overflow: 'hidden', scrollSnapAlign: 'start', border: mainImage === img ? '2px solid #111' : '1px solid transparent', opacity: mainImage === img ? 1 : 0.5, '&:hover': { opacity: 1 }, transition: '0.2s' }}>
                                        {isVideo(img) ? <video src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" /> : <img src={img} alt={`thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        {isVideo(img) && <Box sx={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', px: 0.5, py: 0.1, borderRadius: 1, fontSize: '0.6rem', fontWeight: 'bold' }}>VIDEO</Box>}
                                    </Box>
                                ))}
                            </Box>

                            {product.imageUrls?.length > 5 && (
                                <IconButton onClick={() => scrollThumbs('right')} sx={{ position: 'absolute', right: -16, zIndex: 2, bgcolor: '#fff', border: '1px solid #ddd', boxShadow: 1, '&:hover': { bgcolor: '#f0f0f0' }, width: 32, height: 32 }}>
                                    <ArrowForwardIosIcon sx={{ fontSize: '1rem' }} color="action" />
                                </IconButton>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* ======================================================== */}
                {/* CỘT BÊN PHẢI: THÔNG TIN SẢN PHẨM */}
                {/* ======================================================== */}
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#111', lineHeight: 1.4 }}>{product.name}</Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: '#111', pt: 0.3, '&:hover': { color: 'primary.main' } }}>
                                {product.ratingAvg ? product.ratingAvg.toFixed(1) : '0.0'}
                            </Typography>
                            <Rating value={product.ratingAvg || 0} precision={0.1} readOnly size="medium" sx={{ color: '#faaf00' }} />
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto', borderColor: '#ccc' }} />
                        <Typography variant="subtitle1" color="text.secondary" sx={{ pt: 0.3 }}>
                            Đã bán <Typography component="span" fontWeight="bold" color="text.primary">{product.soldCount || 0}</Typography>
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, mt: 2 }}>
                        {currentVariant ? (
                            <>
                                {currentVariant.comparePrice && currentVariant.comparePrice > currentVariant.price && (
                                    <Typography variant="h6" color="text.secondary" sx={{ textDecoration: 'line-through', fontWeight: 500 }}>{formatPrice(currentVariant.comparePrice)}</Typography>
                                )}
                                <Typography variant="h4" fontWeight="bold" sx={{ color: '#111' }}>{formatPrice(currentVariant.price)}</Typography>
                                {currentVariant.comparePrice && currentVariant.comparePrice > currentVariant.price && (
                                    <Chip label="Sale" size="small" color="error" sx={{ fontWeight: 'bold' }} />
                                )}
                            </>
                        ) : <Typography variant="h6" color="error.main">Vui lòng chọn phân loại</Typography>}
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    <Typography variant="body1" color="text.primary" mb={1.5}>Màu sắc: <Typography component="span" fontWeight="bold">{selectedColor}</Typography></Typography>

                    {/* ĐÃ CẬP NHẬT: KÍCH THƯỚC LỚN HƠN (56x56) ĐỂ KHÔNG BỊ CẮT QUÁ NHIỀU ẢNH KHI BO TRÒN */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                        {availableColors.map(color => {
                            const bgImg = getImageForColor(color);
                            return (
                                <Box
                                    key={color} onClick={() => handleColorSelect(color)}
                                    sx={{
                                        width: '56px', height: '56px', borderRadius: '50%', // SỬA Ở ĐÂY
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: selectedColor === color ? '2px solid #111' : '1px solid #ddd',
                                        backgroundImage: bgImg ? `url(${bgImg})` : 'none',
                                        bgcolor: bgImg ? 'transparent' : '#f5f5f5',
                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                        fontSize: '0.8rem', fontWeight: 'bold', color: '#555',
                                        padding: '2px', backgroundClip: 'content-box',
                                        '&:hover': { borderColor: '#111' },
                                        overflow: 'hidden'
                                    }}
                                >
                                    {!bgImg && color.substring(0, 3)}
                                </Box>
                            );
                        })}
                    </Box>

                    <Typography variant="body1" color="text.primary" mb={1.5}>Kích thước: <Typography component="span" fontWeight="bold">{selectedSize}</Typography></Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 4 }}>
                        {availableSizes.map(size => {
                            const v = product.variants.find(v => v.color === selectedColor && v.size === size);
                            const isOutOfStock = !v || getStock(v) <= 0;
                            return (
                                <Button key={size} onClick={() => !isOutOfStock && handleSizeSelect(size)} disabled={isOutOfStock} variant={selectedSize === size ? 'contained' : 'outlined'} sx={{ minWidth: '60px', height: '45px', borderRadius: 1, p: 0, bgcolor: selectedSize === size ? '#111' : 'transparent', color: selectedSize === size ? '#fff' : '#111', borderColor: selectedSize === size ? '#111' : '#ddd', fontWeight: 'bold', fontSize: '0.95rem', '&:hover': { bgcolor: selectedSize === size ? '#111' : '#f5f5f5', borderColor: '#111' } }}>
                                    {size}
                                </Button>
                            );
                        })}
                    </Box>

                    <Typography variant="body1" color="text.primary" mb={1.5}>Số lượng</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 1 }}>
                            <IconButton onClick={() => handleQuantityChange('minus')} disabled={quantity <= 1} sx={{ borderRadius: 0, p: 1.5 }}><RemoveIcon fontSize="small" /></IconButton>
                            <Typography sx={{ px: 2, fontWeight: 'bold', minWidth: '50px', textAlign: 'center' }}>{quantity}</Typography>
                            <IconButton onClick={() => handleQuantityChange('plus')} disabled={!currentVariant || quantity >= currentVariant.stockQuantity} sx={{ borderRadius: 0, p: 1.5 }}><AddIcon fontSize="small" /></IconButton>
                        </Box>
                        {currentVariant && <Typography variant="body2" color={currentVariant.stockQuantity < 10 ? "error.main" : "text.secondary"}>{currentVariant.stockQuantity > 0 ? `Còn ${currentVariant.stockQuantity} sản phẩm` : 'Đã hết hàng'}</Typography>}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 5 }}>
                        <Button variant="contained" size="large" onClick={handleAddToCart} disabled={!currentVariant || currentVariant.stockQuantity <= 0} sx={{ flex: 1, py: 2, bgcolor: '#111', color: '#fff', fontWeight: 'bold', fontSize: '1rem', borderRadius: 1, '&:hover': { bgcolor: '#333' } }}>THÊM VÀO GIỎ HÀNG</Button>
                        <Button variant="outlined" size="large" onClick={handleBuyNow} disabled={!currentVariant || currentVariant.stockQuantity <= 0} sx={{ flex: 1, py: 2, borderColor: '#111', color: '#111', fontWeight: 'bold', fontSize: '1rem', borderRadius: 1, '&:hover': { borderColor: '#111', bgcolor: '#f9f9f9' } }}>MUA NGAY</Button>
                    </Box>

                    <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}><Typography fontWeight="bold" fontSize="0.95rem">MÔ TẢ SẢN PHẨM</Typography></AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pt: 0, pb: 2 }}><style>{` .product-desc img { max-width: 100%; height: auto; display: block; margin: 10px auto; border-radius: 4px; } .product-desc { font-family: Roboto; font-size: 0.95rem; color: #444; line-height: 1.6; word-break: break-word; overflow-wrap: anywhere; } `}</style><Box className="product-desc" dangerouslySetInnerHTML={{ __html: product.description || 'Chưa có thông tin mô tả' }} /></AccordionDetails>
                    </Accordion>
                </Box>
            </Box>

            <Divider sx={{ my: 8 }} />

            {/* ======================================================== */}
            {/* KHU VỰC ĐÁNH GIÁ (GIAO DIỆN SANG TRỌNG, THANH LỊCH) */}
            {/* ======================================================== */}
            <Box sx={{ maxWidth: '900px', mx: 'auto', mb: 8 }} id="review-section">
                <Typography variant="h5" fontWeight="900" sx={{ mb: 4, textAlign: 'center' }}>ĐÁNH GIÁ TỪ KHÁCH HÀNG</Typography>

                {/* 1. KHỐI THỐNG KÊ & BỘ LỌC (Style đen trắng cao cấp) */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 4, mb: 4, p: 3, bgcolor: '#fbfbfb', border: '1px solid #eee', borderRadius: 2 }}>

                    {/* Phần Điểm Trung Bình (Bên Trái) - Dùng màu Vàng Gold */}
                    <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: '#111' }}>
                            {reviewStats.averageRating} <Typography component="span" variant="h5" color="text.secondary">/ 5</Typography>
                        </Typography>
                        <Rating value={parseFloat(reviewStats.averageRating)} precision={0.1} readOnly size="large" sx={{ my: 1, color: '#faaf00' }} />
                        <Typography variant="body2" color="text.secondary">{reviewStats.totalReviews} đánh giá</Typography>
                    </Box>

                    {/* Phần Nút Lọc và Sắp Xếp (Bên Phải) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, width: '100%' }}>

                        {/* Lọc theo sao */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            <Button
                                variant={reviewFilter === null ? 'contained' : 'outlined'}
                                onClick={() => handleFilterChange(setReviewFilter, null)}
                                sx={reviewFilter === null ? activeFilterSx : inactiveFilterSx}
                            >
                                Tất cả
                            </Button>
                            {[5, 4, 3, 2, 1].map((star) => (
                                <Button
                                    key={star}
                                    variant={reviewFilter === star ? 'contained' : 'outlined'}
                                    onClick={() => handleFilterChange(setReviewFilter, star)}
                                    sx={reviewFilter === star ? activeFilterSx : inactiveFilterSx}
                                >
                                    {star} Sao
                                </Button>
                            ))}
                        </Box>

                        {/* Lọc theo Nội dung (Có bình luận / Có hình ảnh) */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            <Button
                                variant={filterHasComment ? 'contained' : 'outlined'}
                                onClick={() => handleFilterChange(setFilterHasComment, !filterHasComment)}
                                sx={filterHasComment ? activeFilterSx : inactiveFilterSx}
                            >
                                Có bình luận
                            </Button>
                            <Button
                                variant={filterHasMedia ? 'contained' : 'outlined'}
                                onClick={() => handleFilterChange(setFilterHasMedia, !filterHasMedia)}
                                sx={filterHasMedia ? activeFilterSx : inactiveFilterSx}
                            >
                                Có hình ảnh / Video
                            </Button>
                        </Box>

                        <Divider sx={{ my: 1 }} />

                        {/* Dropdown Sắp xếp */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" fontWeight="bold">Sắp xếp theo:</Typography>
                            <Select
                                size="small"
                                value={sortOption}
                                onChange={(e) => handleFilterChange(setSortOption, e.target.value)}
                                sx={{ minWidth: '200px', bgcolor: '#fff' }}
                            >
                                <MenuItem value="newest">Mới nhất</MenuItem>
                                <MenuItem value="oldest">Cũ nhất</MenuItem>
                                <MenuItem value="highest">Đánh giá: Cao đến thấp</MenuItem>
                                <MenuItem value="lowest">Đánh giá: Thấp đến cao</MenuItem>
                            </Select>
                        </Box>

                    </Box>
                </Box>

                {/* 2. DANH SÁCH ĐÁNH GIÁ CỦA TRANG HIỆN TẠI */}
                {loadingReviews ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
                ) : reviews.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, borderTop: '1px dashed #eee' }}>
                        <Typography variant="body1" color="text.secondary">Chưa có đánh giá nào cho bộ lọc này.</Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {reviews.map((rev) => (
                                <Box key={rev.id} sx={{ display: 'flex', gap: 2, pb: 3, borderBottom: '1px solid #f0f0f0' }}>

                                    <Avatar sx={{ bgcolor: 'success.main', width: 45, height: 45, fontWeight: 'bold' }}>
                                        {getAvatarName(rev.userName)}
                                    </Avatar>

                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">{rev.userName}</Typography>
                                        <Rating value={rev.rating} readOnly size="small" sx={{ my: 0.5, color: '#faaf00' }} />
                                        <Typography variant="body2" sx={{ color: '#333', mt: 1, mb: 1.5, lineHeight: 1.6 }}>{rev.content}</Typography>

                                        {/* Hiển thị Ảnh/Video đánh giá */}
                                        {rev.mediaUrls && rev.mediaUrls.length > 0 && (
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                                {rev.mediaUrls.map((media, idx) => (
                                                    <Box
                                                        key={idx} onClick={() => setPreviewMedia(media)}
                                                        sx={{ width: 72, height: 72, border: '1px solid #eee', borderRadius: 1, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: '0.2s', '&:hover': { opacity: 0.8, borderColor: '#111' } }}
                                                    >
                                                        {isVideo(media) ? (
                                                            <>
                                                                <video src={media} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Typography sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>VIDEO</Typography>
                                                                </Box>
                                                            </>
                                                        ) : (
                                                            <img src={media} alt="review-media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        )}
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}


                                        {rev.adminReply && (
                                            <Box sx={{
                                                mt: 2, p: 2,
                                                bgcolor: '#f5f5f5', // Xám nhạt thanh lịch
                                                borderRadius: 2,
                                                position: 'relative',
                                                '&::before': { // Tạo mũi tên chĩa lên trên
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    left: '20px',
                                                    borderLeft: '8px solid transparent',
                                                    borderRight: '8px solid transparent',
                                                    borderBottom: '8px solid #f5f5f5'
                                                }
                                            }}>
                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#111', mb: 0.5 }}>
                                                    Phản hồi từ M.A Fashion Vibe
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                    {rev.adminReply}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                                                    {new Date(rev.repliedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                        )}

                                        <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                                            {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        {/* 3. ĐIỀU HƯỚNG PHÂN TRANG (SERVER-SIDE) */}
                        {reviewStats.totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Pagination
                                    count={reviewStats.totalPages}
                                    page={reviewPage}
                                    onChange={(e, val) => {
                                        setReviewPage(val);
                                        document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#111', color: '#fff' } }}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {/* MODAL PHÓNG TO ẢNH/VIDEO ĐÁNH GIÁ (DẤU X Ở NGOÀI) */}
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

            {/* SẢN PHẨM CÙNG DANH MỤC */}
            {relatedProducts.length > 0 && (
                <Box sx={{ mt: 8 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h5" fontWeight="900">SẢN PHẨM CÙNG DANH MỤC</Typography>
                        <Button component={Link} to={`/products?categoryId=${product.categoryId}`} endIcon={<ArrowForwardIosIcon fontSize="small" />} sx={{ color: '#111', fontWeight: 'bold' }}>
                            Xem thêm
                        </Button>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
                        {relatedProducts.map((rp) => (
                            <Card key={rp.id} elevation={0} sx={{ display: 'flex', flexDirection: 'column', borderRadius: 2, border: '1px solid #eee', bgcolor: '#fff', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 10px 20px rgba(0,0,0,0.08)', borderColor: 'primary.main', '& .product-title': { color: 'primary.main' } } }}>
                                <Box component={Link} to={`/product/${rp.slug}`} sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ position: 'relative', pt: '133%', overflow: 'hidden', bgcolor: '#f9f9f9' }}>
                                        {isVideo(rp.thumbnail) ? <video src={rp.thumbnail} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" /> : <img src={rp.thumbnail || 'https://via.placeholder.com/300x400?text=No+Image'} alt={rp.name} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}

                                        {rp.comparePrice && rp.comparePrice > rp.minPrice && rp.minPrice > 0 && (
                                            <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'error.main', color: '#fff', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold', zIndex: 1, boxShadow: 2 }}>
                                                Giảm giá {Math.round((1 - rp.minPrice / rp.comparePrice) * 100)}%
                                            </Box>
                                        )}

                                        {rp.ratingAvg >= 3.5 && (
                                            <Box sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(255,255,255,0.95)', color: '#111', px: 1, py: 0.4, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold', zIndex: 1, display: 'flex', alignItems: 'center', gap: 0.5, boxShadow: 1 }}>
                                                <span style={{ color: '#faaf00', fontSize: '0.8rem', lineHeight: 1 }}>★</span> {rp.ratingAvg.toFixed(1)}
                                            </Box>
                                        )}

                                    </Box>
                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Typography className="product-title" variant="subtitle1" fontWeight="bold" sx={{ display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis', mb: 0.5, lineHeight: 1.2, height: '2.4em', transition: 'color 0.3s' }}>{rp.name}</Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: 0.5 }}>{rp.categoryName}</Typography>
                                        <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            {rp.comparePrice && rp.comparePrice > rp.minPrice ? (
                                                <>
                                                    <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through', fontWeight: 500, fontSize: '0.95rem' }}>{formatPrice(rp.comparePrice)}</Typography>
                                                    <Typography variant="h6" color="error.main" fontWeight="bold" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>{renderPrice(rp.minPrice, rp.maxPrice)}</Typography>
                                                </>
                                            ) : <Typography variant="h6" color="error.main" fontWeight="bold" sx={{ fontSize: '1.1rem', lineHeight: 1.2 }}>{renderPrice(rp.minPrice, rp.maxPrice)}</Typography>}
                                            {rp.totalStock <= 0 && <Chip label="Hết hàng" size="small" sx={{ mt: 0.5, height: '20px', fontSize: '0.7rem' }} />}
                                        </Box>
                                    </CardContent>
                                </Box>
                            </Card>
                        ))}
                    </Box>
                </Box>
            )}
        </Container>
    );
}

