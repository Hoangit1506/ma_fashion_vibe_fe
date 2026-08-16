import { useEffect, useState } from 'react'; // THÊM useState
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import api from '../../services/api'; // NHỚ IMPORT API

export default function OrderSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const orderNumber = searchParams.get('orderNumber') || searchParams.get('vnp_TxnRef');
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    const isSuccess = !vnpResponseCode || vnpResponseCode === '00';

    // State để tránh gọi API 2 lần
    const [isProcessed, setIsProcessed] = useState(false);

    useEffect(() => {
        if (!orderNumber) {
            navigate('/');
            return;
        }

        // GỌI API XUỐNG BACKEND ĐỂ CẬP NHẬT TRẠNG THÁI
        const verifyPaymentWithBackend = async () => {
            const secureHash = searchParams.get('vnp_SecureHash');
            if (secureHash && !isProcessed) {
                try {
                    const queryString = searchParams.toString();
                    await api.get(`/orders/payment/vnpay-callback?${queryString}`);
                    setIsProcessed(true); // Đánh dấu đã xử lý
                } catch (error) {
                    console.error("Lỗi xác thực thanh toán với máy chủ:", error);
                }
            }
        };

        verifyPaymentWithBackend();
    }, [orderNumber, navigate, searchParams, isProcessed]);

    if (!orderNumber) return null;

    return (
        <Container maxWidth="sm" sx={{ py: 10, minHeight: '70vh' }}>
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #eee', bgcolor: '#fafafa' }}>

                {isSuccess ? (
                    <>
                        <CheckCircleOutlineIcon sx={{ fontSize: 100, color: '#2e7d32', mb: 2 }} />
                        <Typography variant="h4" fontWeight="900" sx={{ mb: 2, color: '#111' }}>
                            ĐẶT HÀNG THÀNH CÔNG!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            Cảm ơn bạn đã mua sắm tại M.A Fashion Vibe.
                        </Typography>
                    </>
                ) : (
                    <>
                        <CancelOutlinedIcon sx={{ fontSize: 100, color: '#d32f2f', mb: 2 }} />
                        <Typography variant="h4" fontWeight="900" sx={{ mb: 2, color: '#d32f2f' }}>
                            THANH TOÁN THẤT BẠI!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            Giao dịch VNPAY đã bị hủy. Đơn hàng của bạn đã được hủy trên hệ thống.
                        </Typography>
                    </>
                )}

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Mã đơn hàng của bạn là: <Typography component="span" fontWeight="bold" color="#1976d2">{orderNumber}</Typography>
                </Typography>

                {isSuccess && (
                    <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px dashed #ccc', mb: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            Chúng tôi sẽ sớm liên hệ với bạn để xác nhận đơn hàng và tiến hành giao hàng trong thời gian sớm nhất.
                        </Typography>
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                    <Button
                        component={Link}
                        to={isSuccess ? '/products' : '/cart'}
                        variant="outlined"
                        size="large"
                        sx={{ borderColor: '#111', color: '#111', fontWeight: 'bold', '&:hover': { bgcolor: '#f0f0f0', borderColor: '#111' } }}
                    >
                        {isSuccess ? 'TIẾP TỤC MUA SẮM' : 'QUAY LẠI GIỎ HÀNG'}
                    </Button>
                    <Button component={Link} to="/profile/orders" variant="contained" size="large" sx={{ bgcolor: '#111', fontWeight: 'bold', '&:hover': { bgcolor: '#333' } }}>
                        XEM ĐƠN HÀNG
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}