import { useContext, useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Divider, Snackbar, Alert, CircularProgress } from '@mui/material';
import { AuthContext } from '../../../context/AuthContext';
import api from '../../../services/api';

export default function ProfileInfo() {
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        dob: ''
    });

    const [loading, setLoading] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ open: false, type: 'success', message: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
                dob: user.dob || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Gọi API Update
            const res = await api.put('/users/my-profile', {
                fullName: formData.fullName,
                phone: formData.phone,
                dob: formData.dob ? formData.dob : null // Nếu rỗng thì gửi null để không lỗi ngày tháng
            });

            if (res.data.success) {
                setAlertConfig({ open: true, type: 'success', message: 'Cập nhật hồ sơ thành công!' });

                // Tự động tải lại trang sau 1.5s để Context cập nhật lại Tên trên Sidebar và Navbar
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            setAlertConfig({
                open: true, type: 'error',
                message: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {/* Thanh thông báo góc trên */}
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
                Thông Tin Tài Khoản
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Quản lý thông tin tài khoản của bạn
            </Typography>

            <Divider sx={{ mb: 4 }} />

            <Box component="form" onSubmit={handleUpdate} sx={{ width: '100%' }}>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, mb: 3 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                            Tên đăng nhập / Email
                        </Typography>
                        <TextField
                            size="medium" fullWidth name="email" value={formData.email} disabled
                            sx={{ bgcolor: '#f9f9f9', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#888' } }}
                            helperText="Email không thể thay đổi."
                        />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                            Họ và Tên
                        </Typography>
                        <TextField
                            size="medium" fullWidth name="fullName"
                            value={formData.fullName} onChange={handleChange}
                            required
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, mb: 4 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                            Số điện thoại
                        </Typography>
                        <TextField
                            size="medium" fullWidth name="phone" placeholder="Chưa cập nhật"
                            value={formData.phone} onChange={handleChange}
                        />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary" mb={1}>
                            Ngày sinh
                        </Typography>
                        <TextField
                            size="medium" fullWidth name="dob" type="date"
                            value={formData.dob} onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                        type="submit" variant="contained" color="primary"
                        disabled={loading}
                        sx={{ px: 8, py: 1.5, fontWeight: 'bold', fontSize: '1rem', borderRadius: 2 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'LƯU THAY ĐỔI'}
                    </Button>
                </Box>

            </Box>
        </Box>
    );
}
