import {
    Container, Box, Typography, Paper,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Contact() {
    return (
        <Box sx={{ bgcolor: '#fbfbfb', minHeight: '100vh', pb: 10 }}>
            {/* Banner Header */}
            <Box sx={{ bgcolor: '#111', color: '#fff', py: 6, textAlign: 'center', mb: 6 }}>
                <Typography variant="h3" fontWeight="bold" sx={{ letterSpacing: 2, mb: 1 }}>
                    LIÊN HỆ & CHÍNH SÁCH
                </Typography>
                <Typography variant="body1" sx={{ color: '#ccc' }}>
                    Mọi thông tin bạn cần để mua sắm an tâm tại M.A Fashion Vibe
                </Typography>
            </Box>

            <Container maxWidth="lg">
                {/* PHẦN 1: THÔNG TIN VÀ BẢN ĐỒ (CÂN BẰNG 50/50 BẰNG FLEXBOX) */}
                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2, border: '1px solid #eee', mb: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, md: 6 }, alignItems: 'stretch' }}>

                        {/* Cột Trái: Thông tin (Chiếm đúng 1 nửa) */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="h5" fontWeight="bold" mb={4} sx={{ color: '#111' }}>
                                THÔNG TIN CỬA HÀNG
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <LocationOnIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Địa chỉ</Typography>
                                        <Typography variant="body2" color="text.secondary">123 Đường Thời Trang, Phường Sành Điệu, Quận 1, TP. Hồ Chí Minh</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <PhoneIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Hotline (Zalo/Hotline)</Typography>
                                        <Typography variant="body2" color="text.secondary">0123 456 789 (Hỗ trợ 24/7)</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <EmailIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Email</Typography>
                                        <Typography variant="body2" color="text.secondary">support@mafashionvibe.vn</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <AccessTimeIcon sx={{ color: 'primary.main', mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Giờ mở cửa</Typography>
                                        <Typography variant="body2" color="text.secondary">Thứ 2 - Chủ Nhật: 08:00 - 22:00</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Cột Phải: Bản đồ (Chiếm đúng 1 nửa, tự động kéo dãn lấp đầy khoảng trống) */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ width: '100%', height: '100%', minHeight: '350px', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7000.430311363127!2d105.76789051708319!3d10.028528030418334!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0895a51d60719%3A0x9d76b0035f6d53d0!2zxJDhuqFpIGjhu41jIEPhuqduIFRoxqE!5e0!3m2!1svi!2s!4v1775227589379!5m2!1svi!2s"
                                    style={{ width: '100%', height: '100%', minHeight: '350px', border: 0, display: 'block' }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="MA Fashion Vibe Map"
                                ></iframe>
                            </Box>
                        </Box>

                    </Box>
                </Paper>

                {/* PHẦN 2: CHÍNH SÁCH HỖ TRỢ */}
                <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center" sx={{ color: '#111' }}>
                    CHÍNH SÁCH DÀNH CHO KHÁCH HÀNG
                </Typography>

                <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
                    <Accordion defaultExpanded disableGutters sx={{ border: '1px solid #eee', mb: 2, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LocalShippingIcon sx={{ color: '#111' }} />
                                <Typography fontWeight="bold" fontSize="1.1rem">Chính sách Giao hàng</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ bgcolor: '#f9f9f9', p: 3, borderTop: '1px solid #eee' }}>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                - <b>Thời gian giao hàng:</b> Từ 2-3 ngày đối với nội thành TP.HCM và 3-5 ngày đối với các tỉnh thành khác.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                - <b>Phí vận chuyển:</b> Đồng giá 30.000 VNĐ cho mọi đơn hàng dưới 500.000 VNĐ. Miễn phí vận chuyển (Freeship) cho đơn hàng từ 500.000 VNĐ trở lên.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - Khách hàng được phép <b>kiểm tra hàng trước khi thanh toán</b>. Nếu sản phẩm không đúng mô tả, bạn có thể từ chối nhận hàng ngay lập tức.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion disableGutters sx={{ border: '1px solid #eee', mb: 2, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <AssignmentReturnIcon sx={{ color: '#111' }} />
                                <Typography fontWeight="bold" fontSize="1.1rem">Chính sách Đổi trả & Hoàn tiền</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ bgcolor: '#f9f9f9', p: 3, borderTop: '1px solid #eee' }}>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                - <b>Thời hạn đổi trả:</b> Trong vòng 07 ngày kể từ ngày nhận hàng thành công.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                - <b>Điều kiện đổi trả:</b> Sản phẩm còn nguyên tem mác, chưa qua sử dụng, chưa giặt ủi và không bị hư hỏng do tác động từ phía khách hàng.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - <b>Quy trình hoàn tiền:</b> Sau khi nhận lại hàng và kiểm tra hợp lệ, M.A Fashion Vibe sẽ tiến hành hoàn tiền vào tài khoản ngân hàng của quý khách trong vòng 24 - 48 giờ làm việc.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion disableGutters sx={{ border: '1px solid #eee', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <SecurityIcon sx={{ color: '#111' }} />
                                <Typography fontWeight="bold" fontSize="1.1rem">Chính sách Bảo mật Thông tin</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ bgcolor: '#f9f9f9', p: 3, borderTop: '1px solid #eee' }}>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                - Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng (Tên, Số điện thoại, Địa chỉ, Lịch sử mua hàng).
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                - Dữ liệu chỉ được sử dụng cho mục đích giao hàng và hỗ trợ chăm sóc khách hàng, cam kết không mua bán hoặc trao đổi với bất kỳ bên thứ ba nào.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Container>
        </Box>
    );
}


