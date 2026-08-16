import { Box, Container, Typography, IconButton, TextField, Button, Divider, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';

export default function Footer() {
    return (
        <Box sx={{ bgcolor: '#111111', color: '#e0e0e0', pt: 8, pb: 4, mt: 'auto' }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* CỘT 1: THÔNG TIN THƯƠNG HIỆU */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="h5" fontWeight="bold" color="white" gutterBottom>
                            M.A FASHION VIBE
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.8 }}>
                            Tự hào mang đến những bộ sưu tập thời trang nam nữ hiện đại, cá tính. Định hình phong cách của riêng bạn.
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <LocationOnIcon sx={{ mr: 1, fontSize: 20 }} />
                            <Typography variant="body2">123 Đường Thời Trang, Quận 1, TP. HCM</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <PhoneIcon sx={{ mr: 1, fontSize: 20 }} />
                            <Typography variant="body2">0123 456 789 (Zalo/Hotline)</Typography>
                        </Box>
                    </Grid>

                    {/* CỘT 2: LIÊN KẾT NHANH */}
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>
                            Danh Mục
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Link to="/products" style={{ color: '#e0e0e0', textDecoration: 'none' }}>Sản Phẩm Mới</Link>
                            <Link to="/products?category=nam" style={{ color: '#e0e0e0', textDecoration: 'none' }}>Thời Trang Nam</Link>
                            <Link to="/products?category=nu" style={{ color: '#e0e0e0', textDecoration: 'none' }}>Thời Trang Nữ</Link>
                        </Box>
                    </Grid>

                    {/* CỘT 3: HỖ TRỢ KHÁCH HÀNG */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>
                            Hỗ Trợ
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Link to="/policy/shipping" style={{ color: '#e0e0e0', textDecoration: 'none' }}>Chính sách giao hàng</Link>
                            <Link to="/policy/return" style={{ color: '#e0e0e0', textDecoration: 'none' }}>Chính sách đổi trả</Link>
                            <Link to="/size-guide" style={{ color: '#e0e0e0', textDecoration: 'none' }}>Hướng dẫn chọn size</Link>
                        </Box>
                    </Grid>

                    {/* CỘT 4: BẢN TIN & MẠNG XÃ HỘI */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>
                            Các trang mạng xã hội
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton sx={{ color: 'white', bgcolor: '#333', '&:hover': { bgcolor: '#1976d2' } }}><FacebookIcon /></IconButton>
                            <IconButton sx={{ color: 'white', bgcolor: '#333', '&:hover': { bgcolor: '#e1306c' } }}><InstagramIcon /></IconButton>
                            <IconButton sx={{ color: 'white', bgcolor: '#333', '&:hover': { bgcolor: '#1da1f2' } }}><TwitterIcon /></IconButton>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ bgcolor: '#333', my: 4 }} />

                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="grey.500">
                        &copy; {new Date().getFullYear()} M.A Fashion Vibe. Bản quyền thuộc về M.A Fashion Vibe.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}