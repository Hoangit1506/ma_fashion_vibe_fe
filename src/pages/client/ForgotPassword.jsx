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

export default function ForgotPassword() {
    const navigate = useNavigate();

    // Step 1: Nhập Email | Step 2: Nhập OTP & Pass mới | Step 3: Thành công
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        email: '', otp: '', newPassword: '', confirmNewPassword: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

    // BƯỚC 1: GỬI MÃ OTP QUÊN MẬT KHẨU
    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (!formData.email) {
            return setError('Vui lòng nhập địa chỉ email của bạn!');
        }

        setLoading(true);
        try {
            await api.post('/auth/send-forgot-password-otp', { email: formData.email });
            setStep(2);
            setTimeLeft(300); // 5 phút
        } catch (err) {
            setError(err.response?.data?.message || 'Email không tồn tại trong hệ thống!');
        } finally {
            setLoading(false);
        }
    };

    // BƯỚC 2: XÁC THỰC VÀ ĐẶT LẠI MẬT KHẨU
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.otp || !formData.newPassword || !formData.confirmNewPassword) {
            return setError('Vui lòng điền đầy đủ mã OTP và mật khẩu mới!');
        }
        if (formData.newPassword.length < 8) {
            return setError('Mật khẩu phải có ít nhất 8 ký tự!');
        }
        if (formData.newPassword !== formData.confirmNewPassword) {
            return setError('Mật khẩu xác nhận không khớp!');
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/reset-password', formData);
            if (response.data.success) {
                setStep(3); // Hiện màn hình thành công
                setTimeout(() => navigate('/login'), 2500); // Tự động về Login
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

                        {step !== 3 && (
                            <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main', textTransform: 'uppercase', textAlign: 'center' }}>
                                KHÔI PHỤC MẬT KHẨU
                            </Typography>
                        )}

                        {error && <Alert severity="error" sx={{ width: '100%', mb: 2, py: 0 }}>{error}</Alert>}

                        {/* STEP 1: NHẬP EMAIL */}
                        {step === 1 && (
                            <Box component="form" onSubmit={handleSendOtp} sx={{ width: '100%' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                                    Vui lòng nhập địa chỉ email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi mã OTP để giúp bạn đặt lại mật khẩu.
                                </Typography>

                                <TextField
                                    size="small" fullWidth label="Địa chỉ Email" name="email" type="email"
                                    value={formData.email} onChange={handleChange} autoFocus sx={{ mb: 3 }}
                                />

                                <Button
                                    type="submit" fullWidth variant="contained" color="primary"
                                    disabled={loading}
                                    sx={{ py: 1.2, fontSize: '1rem', mb: 2 }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'NHẬN MÃ OTP KHÔI PHỤC'}
                                </Button>
                            </Box>
                        )}

                        {/* STEP 2: NHẬP OTP VÀ MẬT KHẨU MỚI */}
                        {step === 2 && (
                            <Box component="form" onSubmit={handleResetPassword} sx={{ width: '100%' }}>
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                                        Mã xác thực 6 số đã được gửi đến email <b>{formData.email}</b>
                                    </Alert>

                                    <Typography variant="h5" color="error.main" fontWeight="bold" sx={{ mb: 1 }}>
                                        {formatTime(timeLeft)}
                                    </Typography>

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
                                    autoFocus placeholder="VD: 123456" sx={{ mb: 2 }}
                                    inputProps={{ style: { textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 'bold' }, maxLength: 6 }}
                                />

                                <TextField
                                    size="small" fullWidth label="Mật khẩu mới" name="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.newPassword} onChange={handleChange} sx={{ mb: 2 }}
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
                                    size="small" fullWidth label="Xác nhận mật khẩu mới" name="confirmNewPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmNewPassword} onChange={handleChange} sx={{ mb: 2 }}
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
                                    disabled={loading || timeLeft === 0}
                                    sx={{ mt: 2, mb: 1, py: 1.2, fontSize: '1rem' }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'ĐẶT LẠI MẬT KHẨU'}
                                </Button>

                                <Button
                                    fullWidth color="inherit" startIcon={<ArrowBackIcon />}
                                    onClick={() => setStep(1)} sx={{ textTransform: 'none' }}
                                >
                                    Sử dụng email khác
                                </Button>
                            </Box>
                        )}

                        {/* STEP 3: THÀNH CÔNG */}
                        {step === 3 && (
                            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                                <CheckCircleOutlineIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h5" fontWeight="bold" color="primary.main" gutterBottom>
                                    CẬP NHẬT THÀNH CÔNG!
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    Mật khẩu của bạn đã được thay đổi.
                                </Typography>
                                <CircularProgress size={30} color="primary" />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Đang tự động chuyển hướng đến trang đăng nhập...
                                </Typography>
                            </Box>
                        )}

                        {/* LINK QUAY LẠI ĐĂNG NHẬP */}
                        {step !== 3 && (
                            <Box sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Nhớ mật khẩu rồi?{' '}
                                    <Link component={RouterLink} to="/login" sx={{ fontWeight: 'bold', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                        Quay lại Đăng nhập
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