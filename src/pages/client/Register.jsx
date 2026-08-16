import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Typography, Box, Paper, TextField, Button, Container, Alert, CircularProgress, Link, InputAdornment, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '../../services/api';
import logoImg from '../../assets/logo.png';

export default function Register() {
    const navigate = useNavigate();

    // Step 1: Điền form | Step 2: Nhập OTP | Step 3: Thành công (Chống spam click)
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', confirmPassword: '', otp: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Tách riêng 2 state cho 2 con mắt mật khẩu
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [timeLeft]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
            return setError('Vui lòng điền đầy đủ thông tin!');
        }
        if (formData.password.length < 8) {
            return setError('Mật khẩu phải có ít nhất 8 ký tự!');
        }
        if (formData.password !== formData.confirmPassword) {
            return setError('Mật khẩu xác nhận không khớp!');
        }

        setLoading(true);
        try {
            await api.post('/auth/send-register-otp', { email: formData.email });
            setStep(2);
            setTimeLeft(300); // 5 phút
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi gửi mã OTP. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.otp) return setError('Vui lòng nhập mã OTP!');

        setLoading(true);
        try {
            const response = await api.post('/auth/register', formData);
            if (response.data.success) {
                // CHUYỂN SANG STEP 3: Màn hình thành công (Giấu luôn nút bấm, chống spam)
                setStep(3);

                // Đợi 2.5 giây cho khách đọc thông báo rồi mới chuyển trang
                setTimeout(() => navigate('/login'), 2500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, bgcolor: 'background.default' }}>
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        <Box component={RouterLink} to="/" sx={{ mb: 2 }}>
                            <img src={logoImg} alt="M.A Fashion Vibe" style={{ height: '90px', objectFit: 'contain' }} />
                        </Box>

                        {/* GIẢI QUYẾT: Tiêu đề bự, in hoa, màu Xanh lá */}
                        {step !== 3 && (
                            <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main', textTransform: 'uppercase', textAlign: 'center' }}>
                                ĐĂNG KÝ TÀI KHOẢN
                            </Typography>
                        )}

                        {error && <Alert severity="error" sx={{ width: '100%', mb: 2, py: 0 }}>{error}</Alert>}

                        {/* BƯỚC 1: FORM THÔNG TIN */}
                        {step === 1 && (
                            <Box component="form" onSubmit={handleSendOtp} sx={{ width: '100%' }}>
                                <TextField
                                    size="small" fullWidth label="Họ và tên" name="fullName"
                                    value={formData.fullName} onChange={handleChange} autoFocus sx={{ mb: 2 }}
                                />
                                <TextField
                                    size="small" fullWidth label="Địa chỉ Email" name="email" type="email"
                                    value={formData.email} onChange={handleChange} sx={{ mb: 2 }}
                                />
                                <TextField
                                    size="small" fullWidth label="Mật khẩu" name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password} onChange={handleChange} sx={{ mb: 2 }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                                <TextField
                                    size="small" fullWidth label="Xác nhận mật khẩu" name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword} onChange={handleChange} sx={{ mb: 2 }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                <Button
                                    type="submit" fullWidth variant="contained" color="primary"
                                    disabled={loading}
                                    sx={{ mt: 1, py: 1.2, fontSize: '1rem' }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Nhận mã OTP xác thực Email'}
                                </Button>
                            </Box>
                        )}

                        {/* BƯỚC 2: NHẬP MÃ OTP */}
                        {step === 2 && (
                            <Box component="form" onSubmit={handleRegister} sx={{ width: '100%' }}>
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                                        Mã xác thực 6 số đã được gửi đến email <b>{formData.email}</b>
                                    </Alert>

                                    <Typography variant="h5" color="error.main" fontWeight="bold" sx={{ mb: 1 }}>
                                        {formatTime(timeLeft)}
                                    </Typography>

                                    {/* GIẢI QUYẾT: NÚT GỬI LẠI MÃ TO, RÕ RÀNG */}
                                    {timeLeft === 0 && (
                                        <Button
                                            variant="outlined" color="primary" onClick={handleSendOtp}
                                            disabled={loading}
                                            sx={{ mt: 1, fontWeight: 'bold', px: 4, py: 1, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                        >
                                            {loading ? 'Đang gửi lại...' : 'GỬI LẠI MÃ OTP MỚI'}
                                        </Button>
                                    )}
                                </Box>

                                <TextField
                                    size="small" fullWidth label="Nhập mã OTP" name="otp"
                                    value={formData.otp} onChange={handleChange}
                                    autoFocus placeholder="VD: 123456"
                                    inputProps={{ style: { textAlign: 'center', letterSpacing: '10px', fontSize: '1.3rem', fontWeight: 'bold' }, maxLength: 6 }}
                                />

                                <Button
                                    type="submit" fullWidth variant="contained" color="primary"
                                    disabled={loading || timeLeft === 0}
                                    sx={{ mt: 3, mb: 1, py: 1.2, fontSize: '1rem' }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Hoàn tất đăng ký'}
                                </Button>

                                <Button
                                    fullWidth color="inherit" startIcon={<ArrowBackIcon />}
                                    onClick={() => setStep(1)} sx={{ textTransform: 'none' }}
                                >
                                    Sửa lại thông tin
                                </Button>
                            </Box>
                        )}

                        {/* BƯỚC 3: THÀNH CÔNG RỰC RỠ (Không có nút bấm, chống spam) */}
                        {step === 3 && (
                            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                                <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h5" fontWeight="bold" color="primary.main" gutterBottom>
                                    ĐĂNG KÝ THÀNH CÔNG!
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    Chúng tôi đã gửi một email chào mừng đến bạn.
                                </Typography>
                                <CircularProgress size={30} color="primary" />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Đang tự động chuyển hướng đến trang đăng nhập...
                                </Typography>
                            </Box>
                        )}

                        {/* LINK SANG LOGIN (Chỉ hiện ở bước 1 và 2) */}
                        {step !== 3 && (
                            <Box sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Bạn đã có tài khoản?{' '}
                                    <Link component={RouterLink} to="/login" sx={{ fontWeight: 'bold', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                        Đăng nhập ngay
                                    </Link>
                                </Typography>
                            </Box>
                        )}

                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

