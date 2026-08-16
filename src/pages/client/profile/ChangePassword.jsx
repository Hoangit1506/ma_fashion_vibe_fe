import { useState } from 'react';
import { Box, Typography, TextField, Button, Divider, InputAdornment, IconButton, Snackbar, Alert, CircularProgress } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../../../services/api';

export default function ChangePassword() {
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState({
        old: false, new: false, confirm: false
    });

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ open: false, type: 'success', message: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword({ ...showPassword, [field]: !showPassword[field] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword.length < 8) {
            return setAlertConfig({ open: true, type: 'error', message: 'Mật khẩu mới phải có ít nhất 8 ký tự!' });
        }
        if (formData.newPassword !== formData.confirmPassword) {
            return setAlertConfig({ open: true, type: 'error', message: 'Mật khẩu xác nhận không khớp!' });
        }

        setLoading(true);
        try {
            // Sẽ gọi API đổi mật khẩu ở đây
            const res = await api.put('/users/change-password', formData);

            setAlertConfig({ open: true, type: 'success', message: res.data.message || 'Đổi mật khẩu thành công!' });
            setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' }); // Xóa trắng form

        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);
            setAlertConfig({
                open: true, type: 'error',
                message: error.response?.data?.message || 'Mật khẩu cũ không chính xác!'
            });
        } finally {
            setLoading(false);
        }
    };

    // Component nhỏ tạo Nút con mắt bật/tắt mật khẩu
    const PasswordEndAdornment = ({ field }) => (
        <InputAdornment position="end">
            <IconButton onClick={() => togglePasswordVisibility(field)} edge="end">
                {showPassword[field] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
        </InputAdornment>
    );

    return (
        <Box>
            <Snackbar
                open={alertConfig.open} autoHideDuration={3000}
                onClose={() => setAlertConfig({ ...alertConfig, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity={alertConfig.type} variant="filled" sx={{ width: '100%', color: '#fff' }}>
                    {alertConfig.message}
                </Alert>
            </Snackbar>

            <Typography variant="h5" fontWeight="bold" sx={{ color: '#111', mb: 1 }}>
                Đổi Mật Khẩu
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
            </Typography>

            <Divider sx={{ mb: 5 }} />

            {/* Form được thu gọn vào giữa để không bị bè ra quá to */}
            <Box sx={{ maxWidth: '500px', mx: 'auto' }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                    <Box>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                            Mật khẩu hiện tại
                        </Typography>
                        <TextField
                            size="medium" fullWidth name="oldPassword" required
                            type={showPassword.old ? 'text' : 'password'}
                            value={formData.oldPassword} onChange={handleChange}
                            InputProps={{ endAdornment: <PasswordEndAdornment field="old" /> }}
                        />
                    </Box>

                    <Box>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                            Mật khẩu mới
                        </Typography>
                        <TextField
                            size="medium" fullWidth name="newPassword" required
                            type={showPassword.new ? 'text' : 'password'}
                            value={formData.newPassword} onChange={handleChange}
                            InputProps={{ endAdornment: <PasswordEndAdornment field="new" /> }}
                            helperText="Mật khẩu phải có độ dài ít nhất 8 ký tự."
                        />
                    </Box>

                    <Box>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                            Xác nhận mật khẩu mới
                        </Typography>
                        <TextField
                            size="medium" fullWidth name="confirmPassword" required
                            type={showPassword.confirm ? 'text' : 'password'}
                            value={formData.confirmPassword} onChange={handleChange}
                            InputProps={{ endAdornment: <PasswordEndAdornment field="confirm" /> }}
                        />
                    </Box>

                    <Button
                        type="submit" variant="contained" color="primary"
                        disabled={loading}
                        sx={{ py: 1.5, mt: 2, fontWeight: 'bold', fontSize: '1rem', borderRadius: 2 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
                    </Button>

                </Box>
            </Box>
        </Box>
    );
}