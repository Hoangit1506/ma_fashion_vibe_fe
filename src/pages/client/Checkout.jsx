import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container, Box, Typography, Button, Paper, Divider, CircularProgress,
    Radio, RadioGroup, FormControlLabel, FormControl, TextField, MenuItem, Select, InputLabel, Chip, Checkbox
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentIcon from '@mui/icons-material/Payment';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import api from '../../services/api';
import axios from 'axios';

export default function Checkout() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cartData, setCartData] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [orderNote, setOrderNote] = useState('');

    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [newAddress, setNewAddress] = useState({
        receiverName: '', phone: '', street: '', label: '', isDefault: false,
        provinceId: '', provinceName: '',
        districtId: '', districtName: '',
        wardId: '', wardName: ''
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const cartRes = await api.get('/cart');
                const cart = cartRes.data.result;

                if (!cart || !cart.items || cart.items.length === 0) {
                    alert("Giỏ hàng trống! Đang quay lại trang chủ.");
                    navigate('/');
                    return;
                }

                // ĐÃ THÊM BẢO MẬT: Chặn truy cập lậu nếu giỏ hàng có hàng lỗi, ẩn, hoặc vượt tồn kho
                const hasInactive = cart.items.some(item => item.active === false);
                const hasOverStock = cart.items.some(item => item.quantity > item.maxStock);

                if (hasInactive || hasOverStock) {
                    alert("Giỏ hàng của bạn đang có sản phẩm không hợp lệ (ngừng kinh doanh hoặc vượt quá tồn kho). Vui lòng điều chỉnh lại!");
                    navigate('/cart');
                    return;
                }

                setCartData(cart);

                const addrRes = await api.get('/users/addresses');
                const addrList = addrRes.data.result || [];
                setAddresses(addrList);

                if (addrList.length > 0) {
                    setSelectedAddressId(addrList[0].id);
                } else {
                    setShowNewAddressForm(true);
                }

                const provRes = await axios.get('https://esgoo.net/api-tinhthanh/1/0.htm');
                if (provRes.data.error === 0) setProvinces(provRes.data.data);

            } catch (error) {
                console.error("Lỗi lấy dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [navigate]);

    const handleProvinceChange = async (e) => {
        const pId = e.target.value;
        const pObj = provinces.find(p => p.id === pId);
        setNewAddress({ ...newAddress, provinceId: pId, provinceName: pObj.full_name, districtId: '', districtName: '', wardId: '', wardName: '' });
        setDistricts([]); setWards([]);

        const res = await axios.get(`https://esgoo.net/api-tinhthanh/2/${pId}.htm`);
        if (res.data.error === 0) setDistricts(res.data.data);
    };

    const handleDistrictChange = async (e) => {
        const dId = e.target.value;
        const dObj = districts.find(d => d.id === dId);
        setNewAddress({ ...newAddress, districtId: dId, districtName: dObj.full_name, wardId: '', wardName: '' });
        setWards([]);

        const res = await axios.get(`https://esgoo.net/api-tinhthanh/3/${dId}.htm`);
        if (res.data.error === 0) setWards(res.data.data);
    };

    const handleWardChange = (e) => {
        const wId = e.target.value;
        const wObj = wards.find(w => w.id === wId);
        setNewAddress({ ...newAddress, wardId: wId, wardName: wObj.full_name });
    };

    const handleSaveNewAddress = async () => {
        if (!newAddress.receiverName || !newAddress.phone || !newAddress.provinceName || !newAddress.districtName || !newAddress.wardName || !newAddress.street) {
            return alert("Vui lòng điền đầy đủ thông tin địa chỉ!");
        }
        try {
            const payload = {
                receiverName: newAddress.receiverName,
                phone: newAddress.phone,
                province: newAddress.provinceName,
                district: newAddress.districtName,
                ward: newAddress.wardName,
                street: newAddress.street,
                isDefault: addresses.length === 0 ? true : newAddress.isDefault,
                label: newAddress.label || 'Địa chỉ'
            };
            const res = await api.post('/users/addresses', payload);

            if (res.data && res.data.result) {
                const savedAddress = res.data.result;

                if (savedAddress.isDefault || savedAddress.default) {
                    setAddresses([savedAddress, ...addresses.map(a => ({ ...a, isDefault: false, default: false }))]);
                } else {
                    setAddresses([...addresses, savedAddress]);
                }

                setSelectedAddressId(savedAddress.id);
                setShowNewAddressForm(false);
                setNewAddress({ receiverName: '', phone: '', street: '', label: '', isDefault: false, provinceId: '', provinceName: '', districtId: '', districtName: '', wardId: '', wardName: '' });
            } else {
                throw new Error("Không nhận được dữ liệu địa chỉ từ Server.");
            }
        } catch (error) {
            console.error("Chi tiết lỗi:", error);
            alert("Lỗi lưu địa chỉ: " + (error.response?.data?.message || "Hệ thống đang bận, vui lòng thử lại sau."));
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) return alert("Vui lòng chọn địa chỉ giao hàng!");
        if (!paymentMethod) return alert("Vui lòng chọn phương thức thanh toán!");

        try {
            setIsSubmitting(true);

            const res = await api.post('/orders', {
                addressId: selectedAddressId,
                paymentMethod: paymentMethod,
                note: orderNote
            });

            const newOrder = res.data.result;
            window.dispatchEvent(new Event('cartUpdated'));

            if (paymentMethod === 'COD') {
                navigate(`/order-success?orderNumber=${newOrder.orderNumber}`);
            } else if (paymentMethod === 'VNPAY') {
                if (newOrder.paymentUrl) {
                    window.location.href = newOrder.paymentUrl;
                } else {
                    alert("Lỗi: Không lấy được đường dẫn thanh toán VNPAY!");
                }
            }

        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            alert("Lỗi đặt hàng: " + (error.response?.data?.message || "Hệ thống đang bận."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

    let totalWeightGrams = 0;
    let totalOriginalAmount = 0;
    let shippingFee = 0;

    if (cartData && cartData.items) {
        totalWeightGrams = cartData.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);
        totalOriginalAmount = cartData.items.reduce((sum, item) => {
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

    const finalAmount = cartData ? cartData.totalAmount + shippingFee : 0;
    const discountAmount = totalOriginalAmount - (cartData?.totalAmount || 0);

    // ĐÃ SỬA: Chặn nếu có sản phẩm hết hàng hoặc ngừng bán
    const isCartInvalid = cartData && cartData.items.some(item => item.quantity > item.maxStock || item.active === false);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="xl" sx={{ py: 6, minHeight: '80vh', bgcolor: '#fdfdfd' }}>
            <Typography variant="h4" fontWeight="900" mb={4} textAlign="center">XÁC NHẬN THANH TOÁN</Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4, alignItems: 'flex-start' }}>

                <Box sx={{ width: { xs: '100%', lg: '60%' } }}>

                    <Paper elevation={0} sx={{ p: 4, borderRadius: 2, mb: 4, border: '1px solid #eee' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" fontWeight="bold">1. ĐỊA CHỈ GIAO HÀNG</Typography>
                        </Box>

                        {addresses.length > 0 && !showNewAddressForm && (
                            <FormControl component="fieldset" fullWidth>
                                <RadioGroup value={selectedAddressId} onChange={(e) => setSelectedAddressId(Number(e.target.value))}>

                                    <Box sx={{
                                        display: 'flex', flexDirection: 'column', gap: 2,
                                        maxHeight: '420px', overflowY: 'auto', pr: 1,
                                        '&::-webkit-scrollbar': { width: '6px' },
                                        '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: '4px' }
                                    }}>
                                        {addresses.map(addr => {
                                            const isDef = addr.isDefault === true || addr.default === true;

                                            return (
                                                <Box key={addr.id} sx={{ border: selectedAddressId === addr.id ? '2px solid #1976d2' : '1px solid #ddd', borderRadius: 2, p: 2, display: 'flex', alignItems: 'flex-start', cursor: 'pointer', bgcolor: selectedAddressId === addr.id ? '#f4fbff' : '#fff' }} onClick={() => setSelectedAddressId(addr.id)}>
                                                    <FormControlLabel value={addr.id} control={<Radio />} label="" sx={{ m: 0, mr: 1 }} />
                                                    <Box>
                                                        <Typography fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            {addr.address.receiverName} | {addr.address.phone}
                                                            {addr.label && addr.label !== 'Địa chỉ' && <Chip label={addr.label} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />}
                                                            {isDef && <Chip label="Mặc định" color="error" variant="outlined" size="small" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 'bold' }} />}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                                                            {addr.address.street}, {addr.address.ward}, {addr.address.district}, {addr.address.province}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </RadioGroup>
                                <Button variant="outlined" onClick={() => setShowNewAddressForm(true)} sx={{ mt: 3, width: 'fit-content' }}>
                                    + Thêm địa chỉ mới
                                </Button>
                            </FormControl>
                        )}

                        {showNewAddressForm && (
                            <Box sx={{ bgcolor: '#fafafa', p: 3, borderRadius: 2, border: '1px dashed #ccc' }}>
                                <Typography fontWeight="bold" mb={2}>Thêm địa chỉ giao hàng mới</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                        <TextField fullWidth label="Họ tên người nhận" size="small" value={newAddress.receiverName} onChange={e => setNewAddress({ ...newAddress, receiverName: e.target.value })} />
                                        <TextField fullWidth label="Số điện thoại" size="small" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Tỉnh / Thành phố</InputLabel>
                                            <Select value={newAddress.provinceId} label="Tỉnh / Thành phố" onChange={handleProvinceChange} MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}>
                                                {provinces.map(p => <MenuItem key={p.id} value={p.id}>{p.full_name}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small" disabled={!newAddress.provinceId}>
                                            <InputLabel>Quận / Huyện</InputLabel>
                                            <Select value={newAddress.districtId} label="Quận / Huyện" onChange={handleDistrictChange} MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}>
                                                {districts.map(d => <MenuItem key={d.id} value={d.id}>{d.full_name}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="small" disabled={!newAddress.districtId}>
                                            <InputLabel>Phường / Xã</InputLabel>
                                            <Select value={newAddress.wardId} label="Phường / Xã" onChange={handleWardChange} MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}>
                                                {wards.map(w => <MenuItem key={w.id} value={w.id}>{w.full_name}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                        <TextField
                                            fullWidth label="Số nhà, Tên đường..." size="small"
                                            value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                            sx={{ flex: 2 }}
                                        />
                                        <TextField
                                            fullWidth label="Tên gợi nhớ (Tùy chọn)" size="small"
                                            placeholder="VD: Nhà riêng, Công ty..."
                                            value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                            sx={{ flex: 1 }}
                                        />
                                    </Box>

                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={addresses.length === 0 ? true : newAddress.isDefault}
                                                onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                                disabled={addresses.length === 0}
                                                sx={{
                                                    color: '#111',
                                                    '&.Mui-checked': { color: addresses.length === 0 ? '#888' : '#111' },
                                                    '&.Mui-disabled': { color: '#ccc' },
                                                    p: 0, mr: 1
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" fontWeight="bold" color={addresses.length === 0 ? 'text.secondary' : 'text.primary'}>
                                                Đặt làm địa chỉ mặc định
                                            </Typography>
                                        }
                                    />
                                </Box>

                                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                    <Button variant="contained" onClick={handleSaveNewAddress} sx={{ bgcolor: '#111' }}>LƯU ĐỊA CHỈ</Button>
                                    {addresses.length > 0 && <Button variant="text" color="inherit" onClick={() => setShowNewAddressForm(false)}>Hủy</Button>}
                                </Box>
                            </Box>
                        )}
                    </Paper>

                    <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid #eee' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <PaymentIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" fontWeight="bold">2. PHƯƠNG THỨC THANH TOÁN</Typography>
                        </Box>

                        <FormControl component="fieldset" fullWidth>
                            <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                <Box sx={{ border: paymentMethod === 'COD' ? '2px solid #111' : '1px solid #ddd', borderRadius: 2, p: 2, mb: 2, cursor: 'pointer' }} onClick={() => setPaymentMethod('COD')}>
                                    <FormControlLabel value="COD" control={<Radio sx={{ color: '#111', '&.Mui-checked': { color: '#111' } }} />} label={<Typography fontWeight="bold">Thanh toán khi nhận hàng (COD)</Typography>} />
                                    <Typography variant="body2" color="text.secondary" ml={4}>Nhận hàng, kiểm tra rồi mới thanh toán tiền mặt cho shipper.</Typography>
                                </Box>
                                <Box sx={{ border: paymentMethod === 'VNPAY' ? '2px solid #005baa' : '1px solid #ddd', borderRadius: 2, p: 2, cursor: 'pointer' }} onClick={() => setPaymentMethod('VNPAY')}>
                                    <FormControlLabel value="VNPAY" control={<Radio sx={{ color: '#005baa', '&.Mui-checked': { color: '#005baa' } }} />} label={<Typography fontWeight="bold" color="#005baa">Thanh toán trực tuyến VNPAY</Typography>} />
                                    <Typography variant="body2" color="text.secondary" ml={4}>Thanh toán an toàn qua ứng dụng ngân hàng, mã QR, ví điện tử VNPAY.</Typography>
                                </Box>
                            </RadioGroup>
                        </FormControl>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid #eee', mt: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold">3. GHI CHÚ ĐƠN HÀNG (TÙY CHỌN)</Typography>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            placeholder="Lưu ý cho người bán (ví dụ: giao giờ hành chính, gọi trước khi giao...)"
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            sx={{ bgcolor: '#fff' }}
                        />
                    </Paper>
                </Box>

                <Box sx={{ width: { xs: '100%', lg: '40%' }, position: { lg: 'sticky' }, top: '100px' }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #eee' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <ShoppingCartCheckoutIcon />
                            <Typography variant="h6" fontWeight="bold">ĐƠN HÀNG ({cartData.items.length} SP)</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ maxHeight: '350px', overflowY: 'auto', mb: 3, pr: 1, '&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: '5px' } }}>
                            {cartData.items.map((item, idx) => (
                                <Box key={item.id}>
                                    <Box sx={{ display: 'flex', gap: 2, py: 2 }}>
                                        <Box sx={{ width: 70, height: 90, borderRadius: 1, overflow: 'hidden', flexShrink: 0, bgcolor: '#f5f5f5' }}>
                                            <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3, mb: 0.5 }}>
                                                {item.productName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">Phân loại: {item.color} | Size: {item.size}</Typography>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 1 }}>
                                                <Typography variant="body2" fontWeight="bold" color="text.secondary">SL: {item.quantity}</Typography>

                                                <Box sx={{ textAlign: 'right' }}>
                                                    {item.comparePrice && item.comparePrice > item.price && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through', display: 'block' }}>
                                                            {formatPrice(item.comparePrice)}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="body1" fontWeight="bold" color="error.main">{formatPrice(item.price)}</Typography>
                                                </Box>
                                            </Box>

                                            {item.quantity > item.maxStock && (
                                                <Typography variant="caption" color="error.main" display="block" fontWeight="bold" mt={0.5}>
                                                    * Lỗi: Vượt quá tồn kho (Chỉ còn {item.maxStock})
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    {idx < cartData.items.length - 1 && <Divider sx={{ borderStyle: 'dashed' }} />}
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Tạm tính:</Typography>
                                <Box sx={{ textAlign: 'right' }}>
                                    {discountAmount > 0 && <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through', mr: 1 }}>{formatPrice(totalOriginalAmount)}</Typography>}
                                    <Typography variant="body2" fontWeight="bold">{formatPrice(cartData.totalAmount)}</Typography>
                                </Box>
                            </Box>

                            {discountAmount > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="success.main">Tiết kiệm được:</Typography>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">-{formatPrice(discountAmount)}</Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Tổng khối lượng:</Typography>
                                <Typography variant="body2" fontWeight="bold">{(totalWeightGrams / 1000).toFixed(2)} kg</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Phí giao hàng:</Typography>
                                {shippingFee === 0 ? <Chip label="Miễn phí" color="success" size="small" sx={{ fontWeight: 'bold', height: 20 }} /> : <Typography variant="body2" fontWeight="bold">{formatPrice(shippingFee)}</Typography>}
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-end' }}>
                                <Typography variant="subtitle1" fontWeight="bold">Tổng thanh toán:</Typography>
                                <Typography variant="h5" color="error.main" fontWeight="bold">{formatPrice(finalAmount)}</Typography>
                            </Box>
                        </Box>

                        <Button
                            variant="contained" fullWidth size="large"
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting || isCartInvalid}
                            sx={{ mt: 3, bgcolor: paymentMethod === 'VNPAY' ? '#005baa' : '#111', py: 2, fontSize: '1rem', fontWeight: 'bold', '&:hover': { opacity: 0.9 } }}
                        >
                            {isSubmitting ? <CircularProgress size={26} color="inherit" /> : (paymentMethod === 'VNPAY' ? 'THANH TOÁN VỚI VNPAY' : 'XÁC NHẬN ĐẶT HÀNG')}
                        </Button>
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
}
