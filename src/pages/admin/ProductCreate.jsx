import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, TextField, Button, Grid, MenuItem,
    FormControl, InputLabel, Select, IconButton, CircularProgress,
    Switch, FormControlLabel, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Alert, FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import api from '../../services/api';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function ProductCreate() {
    const navigate = useNavigate();

    const [productInfo, setProductInfo] = useState({
        name: '', description: '', categoryId: '', brand: '', active: true
    });
    const [categories, setCategories] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [variants, setVariants] = useState([
        { sku: '', size: '', color: '', price: '', comparePrice: '', weight: '', stockQuantity: '', imageUrl: '' }
    ]);
    const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories', { params: { page: 1, size: 1000 } });
                setCategories(res.data.result.data);
            } catch (error) { console.error(error); }
        };
        fetchCategories();
    }, []);

    // HÀM UPLOAD ẢNH/VIDEO (Tốc độ cao + Swap ảnh bìa thông minh)
    const handleImageUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true);

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const isVideo = file.type.startsWith('video/');
                const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;

                if (file.size > maxSize) {
                    alert(`File "${file.name}" vượt dung lượng (${isVideo ? '100MB' : '10MB'}). Sẽ bị bỏ qua.`);
                    return null;
                }

                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'products');

                const response = await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                return response.data.result;
            });

            const results = await Promise.all(uploadPromises);
            const validUrls = results.filter(url => url !== null);

            setImageUrls((prev) => {
                let newArray = [...prev, ...validUrls];

                const checkIsVideo = (url) => url.match(/\.(mp4|webm|mov|ogg)$/i) || url.includes('video/upload');

                // THUẬT TOÁN ĐỔI CHỖ (SWAP): Chỉ đổi nếu vị trí 0 là Video
                if (newArray.length > 0 && checkIsVideo(newArray[0])) {
                    // Tìm tấm ảnh đầu tiên trong mảng
                    const firstImageIndex = newArray.findIndex(url => !checkIsVideo(url));

                    // Nếu tìm thấy ảnh, đổi vị trí của nó với video ở vị trí 0
                    if (firstImageIndex !== -1) {
                        const temp = newArray[0];
                        newArray[0] = newArray[firstImageIndex];
                        newArray[firstImageIndex] = temp;
                    }
                }

                return newArray;
            });

            if (errors.images) setErrors(prev => ({ ...prev, images: null }));
        } catch (error) {
            alert("Lỗi tải lên: " + (error.response?.data?.message || "Vui lòng thử lại"));
        } finally {
            setIsUploading(false);
            event.target.value = null;
        }
    };

    const handleRemoveImage = async (indexToRemove) => {
        const urlToDelete = imageUrls[indexToRemove];
        setImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
        try { await api.delete(`/media/delete?url=${encodeURIComponent(urlToDelete)}`); }
        catch (error) { console.error(error); }
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const addVariantRow = () => {
        setVariants([...variants, { sku: '', size: '', color: '', price: '', comparePrice: '', weight: '', stockQuantity: '', imageUrl: '' }]);
    };

    const removeVariantRow = (index) => {
        if (variants.length === 1) return setErrors(prev => ({ ...prev, variants: "Sản phẩm phải có ít nhất 1 phân loại hàng!" }));
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleVariantImageUpload = async (index, event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            event.target.value = null; // Xóa file đang chọn để có thể chọn lại
            return alert(`File "${file.name}" không hợp lệ. Phân loại hàng chỉ chấp nhận định dạng ẢNH!`);
        }

        if (file.size > 10 * 1024 * 1024) {
            return alert(`File "${file.name}" vượt quá dung lượng 10MB.`);
        }

        setUploadingVariantIndex(index);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'products/variants');
            const response = await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            handleVariantChange(index, 'imageUrl', response.data.result);
        } catch (error) {
            alert("Lỗi tải ảnh phân loại: " + (error.response?.data?.message || "Vui lòng thử lại"));
        } finally {
            setUploadingVariantIndex(null);
            event.target.value = null;
        }
    };

    const removeVariantImage = async (index) => {
        const urlToDelete = variants[index].imageUrl;
        handleVariantChange(index, 'imageUrl', '');
        try { await api.delete(`/media/delete?url=${encodeURIComponent(urlToDelete)}`); }
        catch (error) { console.error(error); }
    };

    const validateForm = () => {
        let tempErrors = {};
        let isValid = true;

        if (!productInfo.name.trim()) {
            tempErrors.name = "Tên sản phẩm không được để trống";
            isValid = false;
        }
        if (!productInfo.categoryId) {
            tempErrors.categoryId = "Vui lòng chọn danh mục";
            isValid = false;
        }

        if (imageUrls.length === 0) {
            tempErrors.images = "Vui lòng tải lên ít nhất 1 hình ảnh làm ảnh bìa";
            isValid = false;
        } else {
            const isCoverVideo = imageUrls[0].match(/\.(mp4|webm|mov|ogg)$/i) || imageUrls[0].includes('video/upload');
            if (isCoverVideo) {
                tempErrors.images = "Ảnh bìa sản phẩm bắt buộc phải là hình ảnh. Vui lòng tải thêm ít nhất 1 bức ảnh!";
                isValid = false;
            }
        }

        let hasVariantError = false;
        for (let i = 0; i < variants.length; i++) {
            const v = variants[i];
            // ĐÃ SỬA: Thêm điều kiện !v.imageUrl vào để check rỗng
            if (!v.imageUrl || !v.sku.trim() || !v.size.trim() || !v.color.trim() || v.price === '' || v.stockQuantity === '') {
                hasVariantError = true;
                break;
            }
            if (Number(v.price) < 0 || Number(v.stockQuantity) < 0) {
                hasVariantError = true;
                break;
            }
        }

        if (hasVariantError) {
            tempErrors.variants = "Vui lòng điền đầy đủ và chính xác thông tin (Ảnh, SKU, Size, Màu, Giá >= 0, Kho >= 0) cho tất cả phân loại hàng.";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const payload = {
            ...productInfo,
            imageUrls: imageUrls,
            variants: variants.map(v => ({
                ...v,
                price: Number(v.price),
                stockQuantity: Number(v.stockQuantity),
                weight: Number(v.weight || 0),
                comparePrice: v.comparePrice ? Number(v.comparePrice) : null
            }))
        };

        try {
            await api.post('/products', payload);
            alert("Tạo sản phẩm và nhập kho thành công!");
            navigate('/admin/products');
        } catch (error) {
            setErrors({ api: error.response?.data?.message || "Có lỗi xảy ra từ máy chủ, không thể tạo sản phẩm" });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
            <style>{`
        .ql-editor img { max-width: 100%; height: auto; border-radius: 8px; }
      `}</style>

            <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom sx={{ mb: 3 }}>
                Thêm Mới Sản Phẩm
            </Typography>

            {(errors.images || errors.variants || errors.api) && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {errors.api && <div>- {errors.api}</div>}
                    {errors.images && <div>- {errors.images}</div>}
                    {errors.variants && <div>- {errors.variants}</div>}
                </Alert>
            )}

            {/* TẦNG 1: THÔNG TIN CƠ BẢN */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>Thông tin cơ bản</Typography>

                <TextField
                    fullWidth label="Tên sản phẩm (*)" margin="normal"
                    value={productInfo.name}
                    onChange={(e) => {
                        setProductInfo({ ...productInfo, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    error={!!errors.name}
                    helperText={errors.name}
                />

                <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth label="Thương hiệu (Brand)" value={productInfo.brand} onChange={(e) => setProductInfo({ ...productInfo, brand: e.target.value })} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ width: '100%' }}>
                            <FormControl fullWidth variant="outlined" error={!!errors.categoryId}>
                                <InputLabel id="category-label">Danh mục (*)</InputLabel>
                                <Select
                                    labelId="category-label" value={productInfo.categoryId} label="Danh mục (*)"
                                    onChange={(e) => {
                                        setProductInfo({ ...productInfo, categoryId: e.target.value });
                                        if (errors.categoryId) setErrors({ ...errors, categoryId: null });
                                    }}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.name} {cat.parentName ? `(Thuộc: ${cat.parentName})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
                            </FormControl>
                        </Box>
                    </Grid>
                </Grid>

                <Typography variant="subtitle2" fontWeight="bold" mb={1} color="text.secondary">Mô tả chi tiết (Hỗ trợ chèn ảnh bảng size)</Typography>
                <Box sx={{ mb: 5 }}>
                    <ReactQuill
                        theme="snow"
                        value={productInfo.description}
                        onChange={(content) => setProductInfo({ ...productInfo, description: content })}
                        modules={quillModules}
                        style={{ height: '350px', marginBottom: '40px' }}
                    />
                </Box>
            </Paper>

            {/* TẦNG 2: ẢNH & CÀI ĐẶT */}
            <Grid container spacing={3} mb={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, height: '100%', border: errors.images ? '1px solid red' : 'none' }}>
                        <Typography variant="h6" fontWeight="bold" mb={2} color={errors.images ? 'error' : 'inherit'}>Hình ảnh chung (Gallery)</Typography>
                        <Button component="label" variant="outlined" startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />} fullWidth sx={{ height: '50px', mb: 2 }} disabled={isUploading}>
                            {isUploading ? 'Đang tải...' : 'Tải lên Ảnh / Video (Dưới 100MB)'}
                            <input type="file" hidden multiple accept="image/*,video/mp4,video/webm" onChange={handleImageUpload} />
                        </Button>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {imageUrls.map((url, index) => {
                                const isVideo = url.match(/\.(mp4|webm|mov|ogg)$/i) || url.includes('video/upload');

                                return (
                                    <Box key={index} sx={{ position: 'relative', width: '100px', height: '100px', borderRadius: 1, border: index === 0 ? '2px solid #1976d2' : '1px solid #ddd' }}>

                                        {/* ĐÃ SỬA: Loại bỏ autoPlay và loop, chỉ lấy frame tĩnh làm preview */}
                                        {isVideo ? (
                                            <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} muted preload="metadata" />
                                        ) : (
                                            <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                        )}

                                        {index === 0 && (<Box sx={{ position: 'absolute', bottom: 0, width: '100%', bgcolor: 'rgba(25,118,210,0.8)', color: 'white', fontSize: '10px', textAlign: 'center', py: 0.5, borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}>ẢNH BÌA</Box>)}
                                        {isVideo && (<Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', px: 1, py: 0.2, borderRadius: 1, fontSize: '10px', fontWeight: 'bold' }}>VIDEO</Box>)}

                                        <IconButton size="small" sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', p: 0.3, '&:hover': { bgcolor: 'error.dark' } }} onClick={() => handleRemoveImage(index)}>
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>
                                );
                            })}
                        </Box>

                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold" mb={2}>Cài đặt hiển thị</Typography>
                        <FormControlLabel control={<Switch checked={productInfo.active} onChange={(e) => setProductInfo({ ...productInfo, active: e.target.checked })} color="primary" />} label={productInfo.active ? "Đang mở bán" : "Ẩn sản phẩm"} />
                    </Paper>
                </Grid>
            </Grid>

            {/* TẦNG 3: BẢNG PHÂN LOẠI HÀNG */}
            <Paper sx={{ p: 3, mb: 3, border: errors.variants ? '1px solid red' : 'none' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color={errors.variants ? 'error' : 'inherit'}>Phân loại hàng (Biến thể)</Typography>
                    <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={addVariantRow} size="small">
                        Thêm phân loại
                    </Button>
                </Box>

                <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ minWidth: 60, textAlign: 'center' }}>Ảnh</TableCell>
                                <TableCell sx={{ minWidth: 120 }}>SKU (*)</TableCell>
                                <TableCell sx={{ minWidth: 80 }}>Size (*)</TableCell>
                                <TableCell sx={{ minWidth: 80 }}>Màu (*)</TableCell>
                                <TableCell sx={{ minWidth: 80 }}>Nặng(g)</TableCell>
                                <TableCell sx={{ minWidth: 100 }}>Giá bán (*)</TableCell>
                                <TableCell sx={{ minWidth: 100 }}>Giá gốc</TableCell>
                                <TableCell sx={{ minWidth: 80 }}>Kho (*)</TableCell>
                                <TableCell align="center">Xóa</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {variants.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell align="center">
                                        {row.imageUrl ? (
                                            <Box sx={{ position: 'relative', width: 45, height: 45, margin: '0 auto' }}>
                                                <img src={row.imageUrl} alt="variant" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid #ccc' }} />
                                                <IconButton size="small" sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', padding: '2px', '&:hover': { bgcolor: 'error.dark' } }} onClick={() => removeVariantImage(index)}>
                                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Box>
                                        ) : (
                                            <Box component="label" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 45, height: 45, margin: '0 auto', border: (errors.variants && !row.imageUrl) ? '2px dashed #d32f2f' : '1px dashed #999', borderRadius: 1, cursor: 'pointer', bgcolor: (errors.variants && !row.imageUrl) ? '#ffebee' : 'transparent', '&:hover': { bgcolor: '#f0f0f0' } }}>
                                                {uploadingVariantIndex === index ? <CircularProgress size={20} /> : <PhotoCameraIcon color={(errors.variants && !row.imageUrl) ? "error" : "action"} fontSize="small" />}
                                                <input type="file" hidden accept="image/*" onChange={(e) => handleVariantImageUpload(index, e)} />
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell><TextField size="small" placeholder="Mã SKU" value={row.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} error={errors.variants && !row.sku.trim()} /></TableCell>
                                    <TableCell><TextField size="small" placeholder="S, M..." value={row.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} error={errors.variants && !row.size.trim()} /></TableCell>
                                    <TableCell><TextField size="small" placeholder="Đỏ, Đen..." value={row.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} error={errors.variants && !row.color.trim()} /></TableCell>
                                    <TableCell><TextField size="small" type="number" placeholder="Gram" value={row.weight} onChange={(e) => handleVariantChange(index, 'weight', e.target.value)} /></TableCell>
                                    <TableCell><TextField size="small" type="number" placeholder="VND" value={row.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} error={errors.variants && (row.price === '' || Number(row.price) < 0)} /></TableCell>
                                    <TableCell><TextField size="small" type="number" placeholder="Chưa giảm" value={row.comparePrice} onChange={(e) => handleVariantChange(index, 'comparePrice', e.target.value)} /></TableCell>
                                    <TableCell><TextField size="small" type="number" placeholder="SL" value={row.stockQuantity} onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)} error={errors.variants && (row.stockQuantity === '' || Number(row.stockQuantity) < 0)} /></TableCell>
                                    <TableCell align="center">
                                        <IconButton color="error" onClick={() => removeVariantRow(index)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Box sx={{ mt: 2, mb: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" color="primary" size="large" onClick={handleSubmit} sx={{ px: 5, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold' }}>
                    LƯU VÀ ĐĂNG BÁN SẢN PHẨM
                </Button>
            </Box>

        </Box>
    );
}


