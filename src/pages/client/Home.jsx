import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Container, CircularProgress, Chip, Paper, IconButton, Snackbar, Alert
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import CachedOutlinedIcon from '@mui/icons-material/CachedOutlined';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import api from '../../services/api';

const BANNERS = [
    {
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
        title: 'NEW COLLECTION',
        subtitle: 'M.A Fashion Vibe tự do định hình phong cách của riêng bạn'
    },
    {
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
        title: 'MÙA HÈ RỰC RỠ',
        subtitle: 'Tự tin tỏa sáng với những thiết kế mới nhất'
    },
    {
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop',
        title: 'PHONG CÁCH THANH LỊCH',
        subtitle: 'Sự kết hợp hoàn hảo giữa hiện đại và cổ điển'
    }
];

const FEATURES = [
    { icon: <LocalShippingOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />, title: 'MIỄN PHÍ VẬN CHUYỂN', desc: 'Cho đơn hàng từ 500k' },
    { icon: <CheckCircleOutlinedIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />, title: 'CHẤT LƯỢNG CAO CẤP', desc: 'Cam kết hàng chính hãng' },
    { icon: <CachedOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />, title: 'ĐỔI TRẢ DỄ DÀNG', desc: 'Trong vòng 7 ngày' },
    { icon: <SupportAgentOutlinedIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />, title: 'HỖ TRỢ 24/7', desc: 'Luôn sẵn sàng phục vụ' }
];

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();
    const [openError, setOpenError] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const sliderRef = useRef(null);

    useEffect(() => {
        if (location.state?.errorMsg) {
            setErrorMsg(location.state.errorMsg);
            setOpenError(true);
            // Xóa state để không bị hiện lại khi F5
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
        }, 5000);
        return () => clearInterval(slideInterval);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));

    const scrollLeft = () => {
        if (sliderRef.current) sliderRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    };
    const scrollRight = () => {
        if (sliderRef.current) sliderRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchLatestProducts = async () => {
            try {
                const response = await api.get('/public/products', {
                    params: { page: 1, size: 8, sortBy: 'createdAt', direction: 'desc' }
                });
                setProducts(response.data.result.data);
            } catch (error) {
                console.error("Lỗi tải sản phẩm trang chủ:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLatestProducts();
    }, []);

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const renderPrice = (min, max) => min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;

    return (
        <Box sx={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden', bgcolor: 'background.default', pb: 10 }}>

            {/* HERO BANNER */}
            <Box sx={{ width: '100%', height: { xs: '400px', md: '600px' }, position: 'relative', overflow: 'hidden' }}>
                {BANNERS.map((banner, index) => (
                    <Box
                        key={index}
                        sx={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            backgroundImage: `url(${banner.image})`, backgroundSize: 'cover', backgroundPosition: 'center 30%',
                            opacity: currentSlide === index ? 1 : 0, transition: 'opacity 1s ease-in-out',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.4)' }} />
                        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white', px: 2 }}>
                            <Typography variant="h2" fontWeight="bold" sx={{ fontSize: { xs: '2.5rem', md: '4.5rem' }, mb: 1, textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
                                {banner.title}
                            </Typography>
                            <Typography variant="h6" sx={{ mb: 4, fontWeight: 'medium', textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                                {banner.subtitle}
                            </Typography>
                            <Button component={Link} to="/products" variant="contained" color="primary" size="large" sx={{ py: 1.5, px: 4, fontSize: '1.1rem', borderRadius: '30px' }}>
                                Khám phá ngay
                            </Button>
                        </Box>
                    </Box>
                ))}

                <IconButton onClick={prevSlide} sx={{ position: 'absolute', top: '50%', left: '2%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.3)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
                    <ArrowBackIosNewIcon />
                </IconButton>
                <IconButton onClick={nextSlide} sx={{ position: 'absolute', top: '50%', right: '2%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(0,0,0,0.3)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
                    <ArrowForwardIosIcon />
                </IconButton>

                <Box sx={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
                    {BANNERS.map((_, index) => (
                        <FiberManualRecordIcon
                            key={index} onClick={() => setCurrentSlide(index)}
                            sx={{ fontSize: currentSlide === index ? 16 : 12, color: currentSlide === index ? 'primary.main' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: '0.3s' }}
                        />
                    ))}
                </Box>
            </Box>

            {/* DẢI ƯU ĐÃI */}
            <Container maxWidth="xl" sx={{ mt: { xs: -4, md: -6 }, position: 'relative', zIndex: 2, mb: 10 }}>
                <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: '#fff' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 3 }}>
                        {FEATURES.map((feature, idx) => (
                            <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 2, borderRight: { md: idx !== FEATURES.length - 1 ? '1px solid #eee' : 'none' } }}>
                                {feature.icon}
                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">{feature.title}</Typography>
                                <Typography variant="body2" color="text.secondary">{feature.desc}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Container>

            {/* SẢN PHẨM MỚI NHẤT */}
            <Container maxWidth="xl">
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary', textTransform: 'uppercase', mb: 1 }}>
                        SẢN PHẨM MỚI NHẤT
                    </Typography>
                    <Box sx={{ width: '80px', height: '4px', bgcolor: 'secondary.main', margin: '0 auto', borderRadius: 2 }} />
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 10 }}><CircularProgress color="primary" /></Box>
                ) : (
                    <Box sx={{ position: 'relative' }}>

                        <IconButton
                            onClick={scrollLeft}
                            sx={{
                                position: 'absolute', left: { xs: 8, md: -20 }, top: '40%', transform: 'translateY(-50%)', zIndex: 10,
                                width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }, display: 'flex'
                            }}
                        >
                            <ArrowBackIosNewIcon fontSize="medium" color="primary" />
                        </IconButton>

                        <Box
                            ref={sliderRef}
                            sx={{
                                display: 'flex', gap: 3, overflowX: 'auto', scrollSnapType: 'x mandatory',
                                scrollBehavior: 'smooth', pb: 4, pt: 1, alignItems: 'stretch',
                                '&::-webkit-scrollbar': { display: 'none' }
                            }}
                        >
                            {products.map((product) => (
                                <Box
                                    key={product.id}
                                    sx={{
                                        width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)', lg: 'calc(25% - 18px)' },
                                        scrollSnapAlign: 'start', flexShrink: 0, display: 'flex', flexDirection: 'column'
                                    }}
                                >
                                    <Card
                                        elevation={0}
                                        sx={{
                                            display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 2, border: '1px solid #eee', bgcolor: '#fff',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                                                borderColor: 'primary.main',
                                                '& .product-title': { color: 'primary.main' }
                                            }
                                        }}
                                    >
                                        <Box component={Link} to={`/product/${product.slug}`} sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>

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

                                            {/* ĐÃ GỌT DŨA LẠI CARD CONTENT */}
                                            <CardContent sx={{
                                                flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                                p: 1.5, // Giảm padding chung
                                                '&:last-child': { pb: 1.5 } // Triệt tiêu khoảng trống thừa dưới cùng của MUI
                                            }}>

                                                <Typography
                                                    className="product-title"
                                                    variant="subtitle1" fontWeight="bold"
                                                    sx={{
                                                        display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, textOverflow: 'ellipsis',
                                                        mb: 0.5, lineHeight: 1.2, height: '2.4em', transition: 'color 0.3s' // Nén chiều cao dòng lại một chút
                                                    }}
                                                >
                                                    {product.name}
                                                </Typography>

                                                <Typography variant="body1" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: 0.5 }}>
                                                    {product.categoryName}
                                                </Typography>

                                                <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                                </Box>
                            ))}
                        </Box>

                        <IconButton
                            onClick={scrollRight}
                            sx={{
                                position: 'absolute', right: { xs: 8, md: -20 }, top: '40%', transform: 'translateY(-50%)', zIndex: 10,
                                width: 48, height: 48, bgcolor: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                '&:hover': { bgcolor: '#fff', transform: 'translateY(-50%) scale(1.1)' }, display: 'flex'
                            }}
                        >
                            <ArrowForwardIosIcon fontSize="medium" color="primary" />
                        </IconButton>

                    </Box>
                )}

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Button
                        component={Link} to="/products"
                        variant="outlined" color="primary" size="large"
                        sx={{ borderWidth: 2, px: 6, py: 1.5, fontWeight: 'bold', '&:hover': { borderWidth: 2 } }}
                    >
                        XEM TẤT CẢ SẢN PHẨM
                    </Button>
                </Box>
            </Container>

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
