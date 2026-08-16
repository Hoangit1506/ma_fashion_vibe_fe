import { useState, useContext } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Typography, Box, Paper, TextField, Button, Container, Alert, CircularProgress, Link, InputAdornment, IconButton, Divider
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, loginWithGoogle } = useContext(AuthContext);
    const navigate = useNavigate();

    const location = useLocation();
    const from = location.state?.from || '/'; // Nếu không có 'from' thì mặc định về trang chủ '/'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu!');
            return;
        }

        setLoading(true);
        const result = await login(email, password);

        if (result.success) {
            // Thay navigate('/') thành:
            navigate(from);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');

        const result = await loginWithGoogle(credentialResponse.credential);

        if (result.success) {
            // Thay navigate('/') thành:
            navigate(from);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, bgcolor: 'background.default' }}>
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        {/* LOGO */}
                        <Box component={RouterLink} to="/" sx={{ mb: 2 }}>
                            <img src={logoImg} alt="M.A Fashion Vibe" style={{ height: '90px', objectFit: 'contain' }} />
                        </Box>

                        {/* TIÊU ĐỀ DO BẠN TÙY CHỈNH */}
                        <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main', textTransform: 'uppercase', textAlign: 'center' }}>
                            ĐĂNG NHẬP
                        </Typography>

                        {error && <Alert severity="error" sx={{ width: '100%', mb: 2, py: 0 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                            <TextField
                                size="small" fullWidth label="Địa chỉ Email" name="email" type="email"
                                value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                autoFocus sx={{ mb: 2 }}
                            />
                            <TextField
                                size="small" fullWidth label="Mật khẩu" name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                sx={{ mb: 1 }}
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

                            {/* Quên mật khẩu */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Link component={RouterLink} to="/forgot-password" sx={{ fontSize: '0.85rem', color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
                                    Quên mật khẩu?
                                </Link>
                            </Box>

                            {/* Nút Đăng Nhập */}
                            <Button
                                type="submit" fullWidth variant="contained" color="primary"
                                disabled={loading}
                                sx={{ py: 1.2, fontSize: '1rem', mb: 2 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'ĐĂNG NHẬP'}
                            </Button>

                            {/* ĐƯỜNG KẺ "HOẶC" ĐƯỢC THIẾT KẾ ĐẸP MẮT Ở ĐÂY */}
                            <Divider sx={{ my: 2, color: 'text.secondary', fontSize: '0.85rem' }}>
                                HOẶC
                            </Divider>

                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Kết nối với Google thất bại!')}
                                    theme="outline"
                                    size="large"
                                    text="signin_with"
                                    width="100%"
                                />
                            </Box>

                            {/* Link chuyển sang Đăng ký */}
                            <Box sx={{ width: '100%', textAlign: 'center', mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Bạn chưa có tài khoản?{' '}
                                    <Link component={RouterLink} to="/register" sx={{ fontWeight: 'bold', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                        Đăng ký ngay
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
