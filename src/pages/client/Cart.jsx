import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Grid, Box, Typography, Button, IconButton, Paper, Divider, CircularProgress, Chip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import api from '../../services/api';

export default function Cart() {
    const navigate = useNavigate();
    const [cartData, setCartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);


    const fetchCart = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            if (user) {
                // USER ĐÃ ĐĂNG NHẬP: Gọi API như cũ
                const res = await api.get('/cart');
                setCartData(res.data.result);
            } else {
                // KHÁCH VÃNG LAI: Lấy từ Storage và gọi API Tính toán mới
                const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
                if (guestCart.length === 0) {
                    setCartData(null);
                } else {
                    const res = await api.post('/public/cart/calculate', guestCart); // Gọi API Public
                    const data = res.data.result;
                    setCartData(data);

                    // CƠ CHẾ TỰ LÀM SẠCH (SELF-CLEANING)
                    // Lọc bỏ những sản phẩm đã bị xóa cứng trên Backend
                    const cleanCart = data.items.map(i => ({ variantId: i.variantId, quantity: i.quantity }));
                    localStorage.setItem('guestCart', JSON.stringify(cleanCart));
                    window.dispatchEvent(new Event('cartUpdated')); // Update Navbar
                }
            }
        } catch (error) {
            console.error("Lỗi lấy giỏ hàng", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
        // Lắng nghe sự kiện đăng nhập để tải lại giỏ hàng (nếu đang ở trang Cart mà login)
    }, [user]);

    const updateQuantity = async (itemId, newQuantity, maxStock) => {
        if (newQuantity < 1) return;

        // ĐÃ SỬA LOGIC VƯỢT TỒN KHO: Thay vì chặn, ta ép nó về maxStock
        let finalQuantity = newQuantity;
        if (newQuantity > maxStock) {
            alert(`Sản phẩm không đủ tồn kho (Chỉ còn ${maxStock}). Hệ thống tự điều chỉnh về mức tối đa.`);
            finalQuantity = maxStock;
        }

        if (user) {
            try {
                await api.put(`/cart/items/${itemId}`, { variantId: 0, quantity: finalQuantity });
                fetchCart(false); // Gọi fetchCart(false) để tải lại data ngầm, KHÔNG NHÁY TRANG
                window.dispatchEvent(new Event('cartUpdated'));
            } catch (e) { console.error(e); }
        } else {
            let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const index = guestCart.findIndex(item => item.variantId === itemId);
            if (index !== -1) {
                guestCart[index].quantity = finalQuantity;
                localStorage.setItem('guestCart', JSON.stringify(guestCart));
                fetchCart(false); // KHÔNG NHÁY TRANG
            }
        }
    }

    const removeItem = async (itemId) => {
        if (!window.confirm("Bạn có chắc chắn muốn bỏ sản phẩm này?")) return;

        if (user) {
            try {
                await api.delete(`/cart/items/${itemId}`);
                fetchCart(false); // KHÔNG NHÁY TRANG
                window.dispatchEvent(new Event('cartUpdated'));
            } catch (e) { console.error(e); }
        } else {
            let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            guestCart = guestCart.filter(item => item.variantId !== itemId);
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            fetchCart(false); // KHÔNG NHÁY TRANG
            window.dispatchEvent(new Event('cartUpdated'));
        }
    }


    const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const isEmpty = !cartData || !cartData.items || cartData.items.length === 0;

    let totalWeightGrams = 0;
    let totalOriginalAmount = 0;
    let shippingFee = 0;

    // Kiểm tra các lỗi trong giỏ hàng
    const hasInactiveItem = !isEmpty && cartData.items.some(item => item.active === false);
    const hasOverStockItem = !isEmpty && cartData.items.some(item => item.quantity > item.maxStock);

    // Gộp chung: Nếu có sản phẩm ngừng bán HOẶC vượt tồn kho -> Giỏ hàng không hợp lệ
    const isCartInvalid = hasInactiveItem || hasOverStockItem;

    if (!isEmpty) {
        // ĐÃ SỬA: Chỉ tính khối lượng và giá gốc cho những sản phẩm còn đang bán (active)
        totalWeightGrams = cartData.items
            .filter(item => item.active !== false)
            .reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

        totalOriginalAmount = cartData.items
            .filter(item => item.active !== false)
            .reduce((sum, item) => {
                const originalPrice = item.comparePrice && item.comparePrice > item.price ? item.comparePrice : item.price;
                return sum + (originalPrice * item.quantity);
            }, 0);

        const totalWeightKg = totalWeightGrams / 1000;

        if (cartData.totalAmount >= 500000) {
            shippingFee = 0;
        } else {
            shippingFee = 30000 + (totalWeightKg * 5000);
        }
    }

    const finalAmount = isEmpty ? 0 : cartData.totalAmount + shippingFee;
    const discountAmount = totalOriginalAmount - (cartData?.totalAmount || 0);

    return (
        <Container maxWidth="xl" sx={{ py: 6, minHeight: '60vh' }}>
            <Typography variant="h4" fontWeight="900" mb={4}>GIỎ HÀNG CỦA BẠN</Typography>

            {/* ĐÃ THÊM: Cảnh báo chung nếu có sản phẩm ngừng bán */}
            {hasInactiveItem && (
                <Box sx={{ bgcolor: '#ffebee', color: '#c62828', p: 2, mb: 4, borderRadius: 1, border: '1px solid #ef9a9a' }}>
                    <Typography fontWeight="bold">LƯU Ý QUAN TRỌNG:</Typography>
                    <Typography variant="body2">Giỏ hàng của bạn chứa sản phẩm đã ngừng kinh doanh. Vui lòng xóa các sản phẩm này để có thể tiến hành thanh toán!</Typography>
                </Box>
            )}

            {/* ĐÃ THÊM: Cảnh báo nếu vượt tồn kho */}
            {hasOverStockItem && !hasInactiveItem && (
                <Box sx={{ bgcolor: '#fff3e0', color: '#e65100', p: 2, mb: 4, borderRadius: 1, border: '1px solid #ffcc80' }}>
                    <Typography fontWeight="bold">LƯU Ý:</Typography>
                    <Typography variant="body2">Giỏ hàng của bạn chứa sản phẩm vượt quá số lượng tồn kho. Vui lòng điều chỉnh lại số lượng (bằng cách bấm dấu -) hoặc xóa sản phẩm khỏi giỏ hàng để có thể tiến hành thanh toán!</Typography>
                </Box>
            )}

            {isEmpty ? (
                <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 2, bgcolor: '#f9f9f9', border: '1px solid #eee' }}>
                    <Typography variant="h6" color="text.secondary" mb={3}>Giỏ hàng của bạn đang trống.</Typography>
                    <Button component={Link} to="/products" variant="contained" size="large" sx={{ bgcolor: '#111', fontWeight: 'bold', '&:hover': { bgcolor: '#333' } }}>
                        TIẾP TỤC MUA SẮM
                    </Button>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4, alignItems: 'flex-start' }}>

                    <Paper elevation={0} sx={{ flexGrow: 1, width: '100%', borderRadius: 2, border: '1px solid #eee', maxHeight: { xs: 'none', lg: '70vh' }, overflowY: 'auto' }}>

                        <Box sx={{ display: { xs: 'none', md: 'flex' }, p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #eee' }}>
                            <Typography fontWeight="bold" sx={{ width: '45%' }}>Sản phẩm</Typography>
                            <Typography fontWeight="bold" sx={{ width: '20%', textAlign: 'center' }}>Đơn giá</Typography>
                            <Typography fontWeight="bold" sx={{ width: '20%', textAlign: 'center' }}>Số lượng</Typography>
                            <Typography fontWeight="bold" sx={{ width: '15%', textAlign: 'right' }}>Thao tác</Typography>
                        </Box>

                        <Box sx={{ p: { xs: 2, md: 3 } }}>
                            {cartData.items.map((item, idx) => {
                                // Biến kiểm tra sản phẩm ngừng bán
                                const isInactive = item.active === false;

                                return (
                                    <Box key={item.id} sx={{ opacity: isInactive ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, py: 2 }}>

                                            <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: '45%' } }}>
                                                <Box sx={{ width: 90, height: 120, borderRadius: 1, overflow: 'hidden', flexShrink: 0, bgcolor: '#f5f5f5', position: 'relative' }}>
                                                    <img src={item.imageUrl || 'https://via.placeholder.com/150x200'} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isInactive ? 'grayscale(100%)' : 'none' }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, minWidth: 0 }}>
                                                    {/* Nếu ngừng bán thì vô hiệu hóa Link */}
                                                    {isInactive ? (
                                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#777', display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                                                            {item.productName}
                                                        </Typography>
                                                    ) : (
                                                        <Typography component={Link} to={`/product/${item.productSlug}`} variant="subtitle1" fontWeight="bold" sx={{ textDecoration: 'none', color: '#111', display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, '&:hover': { color: '#1976d2' } }}>
                                                            {item.productName}
                                                        </Typography>
                                                    )}

                                                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                                                        Màu: {item.color} | Size: {item.size}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" mt={0.5}>
                                                        Nặng: {item.weight || 0}g
                                                    </Typography>

                                                    {/* Nhãn cảnh báo ngừng kinh doanh */}
                                                    {isInactive && (
                                                        <Chip label="Ngừng kinh doanh" size="small" color="error" variant="outlined" sx={{ mt: 1, width: 'fit-content', fontWeight: 'bold' }} />
                                                    )}

                                                    {/* Cảnh báo thiếu kho (Chỉ hiện nếu còn đang bán) */}
                                                    {!isInactive && item.quantity > item.maxStock && (
                                                        <Typography variant="caption" color="error.main" display="block" fontWeight="bold" mt={0.5}>
                                                            * Sản phẩm không đủ tồn kho (Chỉ còn {item.maxStock})
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', width: { xs: '100%', md: '55%' }, alignItems: 'center', justifyContent: 'space-between' }}>

                                                <Box sx={{ width: { xs: 'auto', md: '36%' }, textAlign: { xs: 'left', md: 'center' } }}>
                                                    {!isInactive && item.comparePrice && item.comparePrice > item.price && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                                            {formatPrice(item.comparePrice)}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="subtitle1" fontWeight="bold" color={isInactive ? "text.secondary" : "error.main"}>
                                                        {formatPrice(item.price)}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ width: { xs: 'auto', md: '36%' }, display: 'flex', justifyContent: 'center' }}>
                                                    {/* Nếu ngừng bán, khóa cứng luôn bảng điều chỉnh số lượng */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 1, opacity: isInactive ? 0.5 : 1 }}>
                                                        <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1, item.maxStock)} disabled={isInactive || item.quantity <= 1}><RemoveIcon fontSize="small" /></IconButton>
                                                        <Typography sx={{ px: 1.5, fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</Typography>
                                                        <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1, item.maxStock)} disabled={isInactive || item.quantity >= item.maxStock}><AddIcon fontSize="small" /></IconButton>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ width: { xs: 'auto', md: '28%' }, textAlign: 'right' }}>
                                                    {/* Nút Xóa vẫn phải hoạt động trơn tru để khách bấm xóa */}
                                                    <IconButton onClick={() => removeItem(item.id)} color="error"><DeleteOutlineIcon /></IconButton>
                                                </Box>
                                            </Box>

                                        </Box>
                                        {idx < cartData.items.length - 1 && <Divider sx={{ my: 1 }} />}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Paper>

                    <Paper elevation={0} sx={{ width: { xs: '100%', lg: '400px' }, flexShrink: 0, p: 3, borderRadius: 2, border: '1px solid #eee', position: { lg: 'sticky' }, top: '100px' }}>
                        <Typography variant="h6" fontWeight="900" mb={3}>TÓM TẮT ĐƠN HÀNG</Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            {/* Cập nhật số lượng sản phẩm hợp lệ */}
                            <Typography variant="body1" color="text.secondary">Tạm tính ({cartData.items.filter(i => i.active !== false).length} SP):</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                                {discountAmount > 0 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                        {formatPrice(totalOriginalAmount)}
                                    </Typography>
                                )}
                                <Typography variant="body1" fontWeight="bold">{formatPrice(cartData.totalAmount)}</Typography>
                            </Box>
                        </Box>

                        {discountAmount > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="body2" color="success.main">Tiết kiệm được:</Typography>
                                <Typography variant="body2" color="success.main" fontWeight="bold">-{formatPrice(discountAmount)}</Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 2 }}>
                            <Typography variant="body1" color="text.secondary">
                                Tổng khối lượng:
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">{(totalWeightGrams / 1000).toFixed(2)} kg</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                            <Typography variant="body1" color="text.secondary">Phí giao hàng:</Typography>
                            {shippingFee === 0 && finalAmount > 0 ? (
                                <Chip label="Miễn phí" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                            ) : (
                                <Typography variant="body1" fontWeight="bold">{formatPrice(shippingFee)}</Typography>
                            )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="h6" fontWeight="bold">Tổng cộng:</Typography>
                            <Typography variant="h5" color="error.main" fontWeight="bold">{formatPrice(finalAmount)}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mb: 4 }}>(Đã bao gồm VAT nếu có)</Typography>

                        <Button
                            variant="contained" fullWidth size="large"
                            disabled={isCartInvalid}
                            sx={{ bgcolor: isCartInvalid ? '#ccc' : '#111', py: 2, fontSize: '1rem', fontWeight: 'bold', '&:hover': { bgcolor: '#333' } }}
                            onClick={() => {
                                if (!user) {
                                    alert("Vui lòng đăng nhập để tiến hành thanh toán!");
                                    // Chuyển hướng lưu trạng thái để sau khi login xong quay về đúng trang cart
                                    navigate('/login', { state: { from: '/cart' } });
                                } else {
                                    navigate('/checkout');
                                }
                            }}
                        >TIẾN HÀNH THANH TOÁN</Button>
                    </Paper>

                </Box>
            )}
        </Container>
    );
}

