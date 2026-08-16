import { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Rating
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../../services/api'; // Đường dẫn import API

export default function ReviewModal({ open, onClose, itemToReview, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [reviewContent, setReviewContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Reset lại toàn bộ form mỗi khi mở Modal lên
    useEffect(() => {
        if (open) {
            setRating(5);
            setReviewContent('');
            setSelectedFiles([]);
            setPreviewUrls([]);
        }
    }, [open]);

    // XỬ LÝ CHỌN FILE ẢNH/VIDEO
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length + selectedFiles.length > 5) {
            alert("Bạn chỉ được tải lên tối đa 5 tệp (ảnh/video)");
            return;
        }

        const validFiles = [];
        const newPreviewUrls = [];

        files.forEach(file => {
            if (file.type.startsWith('image/') && file.size > 10 * 1024 * 1024) {
                alert(`Ảnh ${file.name} vượt quá 10MB`);
                return;
            }
            if (file.type.startsWith('video/') && file.size > 100 * 1024 * 1024) {
                alert(`Video ${file.name} vượt quá 100MB`);
                return;
            }
            validFiles.push(file);
            newPreviewUrls.push(URL.createObjectURL(file));
        });

        setSelectedFiles(prev => [...prev, ...validFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    // XÓA FILE PREVIEW
    const handleRemoveFile = (indexToRemove) => {
        setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
        setPreviewUrls(prev => {
            const newUrls = prev.filter((_, idx) => idx !== indexToRemove);
            URL.revokeObjectURL(prev[indexToRemove]);
            return newUrls;
        });
    };

    // GỬI ĐÁNH GIÁ LÊN SERVER
    const handleSubmitReview = async () => {
        if (!rating) return alert("Vui lòng chọn số sao đánh giá!");

        setIsSubmittingReview(true);
        try {
            const uploadedUrls = [];

            // 1. Upload tuần tự lên Cloudinary (Chống quá tải)
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post('/media/upload?folder=reviews', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedUrls.push(res.data.result);
            }

            // 2. Gộp data bắn API tạo Review
            const reviewPayload = {
                orderId: itemToReview.orderId, // Lấy orderId từ item truyền vào
                productId: itemToReview.productId, // Lấy productId từ item truyền vào
                rating: rating,
                content: reviewContent,
                mediaUrls: uploadedUrls
            };

            await api.post('/reviews', reviewPayload);

            alert("Đánh giá sản phẩm thành công!");
            onClose(); // Đóng Modal
            if (onSuccess) onSuccess(); // Gọi hàm tải lại danh sách bên ngoài
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    return (
        <Dialog open={open} onClose={isSubmittingReview ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>Đánh giá Sản phẩm</DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                {itemToReview && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                        <Box sx={{ width: 60, height: 60, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                            <img src={itemToReview.imageUrl} alt="sp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                        <Box>
                            <Typography variant="body1" fontWeight="bold" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {itemToReview.productName}
                            </Typography>
                            {/* Hiển thị thêm phân loại cho rõ ràng */}
                            {itemToReview.variantName && (
                                <Typography variant="caption" color="text.secondary">
                                    Phân loại: {itemToReview.variantName}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, justifyContent: 'center' }}>
                    <Typography fontWeight="bold">Chất lượng sản phẩm:</Typography>
                    <Rating size="large" value={rating} onChange={(event, newValue) => setRating(newValue)} />
                </Box>

                <TextField
                    multiline rows={4} fullWidth
                    placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé..."
                    value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
                    sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {previewUrls.map((url, index) => (
                        <Box key={index} sx={{ width: 80, height: 80, position: 'relative', border: '1px solid #ccc', borderRadius: 1 }}>
                            {selectedFiles[index].type.startsWith('video/') ? (
                                <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <IconButton
                                size="small" onClick={() => handleRemoveFile(index)}
                                sx={{ position: 'absolute', top: -10, right: -10, bgcolor: '#fff', boxShadow: 1, '&:hover': { bgcolor: '#ffebee' } }}
                            >
                                <CloseIcon fontSize="small" color="error" />
                            </IconButton>
                        </Box>
                    ))}
                    {selectedFiles.length < 5 && (
                        <Box sx={{ width: 80, height: 80, border: '1px dashed #ccc', borderRadius: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} component="label">
                            <PhotoCameraIcon color="action" />
                            <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileSelect} />
                        </Box>
                    )}
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Tải lên tối đa 5 ảnh/video (Tối đa 10MB/ảnh, 100MB/video)
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
                <Button onClick={onClose} color="inherit" disabled={isSubmittingReview}>Hủy</Button>
                <Button onClick={handleSubmitReview} variant="contained" color="primary" disabled={isSubmittingReview}>
                    {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}