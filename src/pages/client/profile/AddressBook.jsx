import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Divider, Chip, IconButton, CircularProgress, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert, Checkbox, FormControlLabel, Grid } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import axios from 'axios';
import api from '../../../services/api';

export default function AddressBook() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alertConfig, setAlertConfig] = useState({ open: false, type: 'success', message: '' });

    // Quản lý Form
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isChangingLocation, setIsChangingLocation] = useState(true);

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [newAddress, setNewAddress] = useState({
        receiverName: '', phone: '', street: '', label: '', isDefault: false,
        provinceId: '', provinceName: '', districtId: '', districtName: '', wardId: '', wardName: '',
        oldLocationText: ''
    });

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/addresses');
            setAddresses(res.data.result || []);
        } catch (error) {
            console.error("Lỗi lấy địa chỉ:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
        axios.get('https://esgoo.net/api-tinhthanh/1/0.htm').then(res => {
            if (res.data.error === 0) setProvinces(res.data.data);
        });
    }, []);

    // ===== XỬ LÝ DROPDOWN TỈNH/HUYỆN =====
    const handleProvinceChange = async (e) => {
        const pId = e.target.value;
        const pObj = provinces.find(p => p.id === pId);
        setNewAddress({ ...newAddress, provinceId: pId, provinceName: pObj.full_name, districtId: '', districtName: '', wardId: '', wardName: '' });
        setDistricts([]); setWards([]);
        const res = await axios.get(`https://esgoo.net/api-tinhthanh/2/${pId}.htm`);
        if (res.data.error === 0) setDistricts(res.data.data);
    };

    const handleDistrictChange = async (e) => {
        const dId = e.target.value;
        const dObj = districts.find(d => d.id === dId);
        setNewAddress({ ...newAddress, districtId: dId, districtName: dObj.full_name, wardId: '', wardName: '' });
        setWards([]);
        const res = await axios.get(`https://esgoo.net/api-tinhthanh/3/${dId}.htm`);
        if (res.data.error === 0) setWards(res.data.data);
    };

    const handleWardChange = (e) => {
        const wId = e.target.value;
        const wObj = wards.find(w => w.id === wId);
        setNewAddress({ ...newAddress, wardId: wId, wardName: wObj.full_name });
    };

    // ===== MỞ FORM THÊM / SỬA =====
    const handleOpenAdd = () => {
        setEditingId(null);
        setIsChangingLocation(true);
        setNewAddress({ receiverName: '', phone: '', street: '', label: '', isDefault: false, provinceId: '', provinceName: '', districtId: '', districtName: '', wardId: '', wardName: '', oldLocationText: '' });
        setDistricts([]); setWards([]);
        setShowForm(true);
    };

    const handleOpenEdit = (addr) => {
        setEditingId(addr.id);
        setIsChangingLocation(false);
        const isDef = addr.isDefault === true || addr.default === true;
        setNewAddress({
            receiverName: addr.address.receiverName,
            phone: addr.address.phone,
            street: addr.address.street,
            label: addr.label || '',
            isDefault: isDef,
            oldLocationText: `${addr.address.ward}, ${addr.address.district}, ${addr.address.province}`,
            provinceName: addr.address.province,
            districtName: addr.address.district,
            wardName: addr.address.ward
        });
        setShowForm(true);
    };

    // ===== LƯU FORM =====
    const handleSaveAddress = async (e) => {
        e.preventDefault();
        if (isChangingLocation && (!newAddress.provinceName || !newAddress.districtName || !newAddress.wardName)) {
            return setAlertConfig({ open: true, type: 'error', message: 'Vui lòng chọn đầy đủ Tỉnh/Quận/Phường!' });
        }

        setIsSubmitting(true);
        try {
            const payload = {
                receiverName: newAddress.receiverName,
                phone: newAddress.phone,
                street: newAddress.street,
                label: newAddress.label || 'Địa chỉ',
                isDefault: addresses.length === 0 ? true : newAddress.isDefault,
                province: newAddress.provinceName,
                district: newAddress.districtName,
                ward: newAddress.wardName,
            };

            if (editingId) {
                await api.put(`/users/addresses/${editingId}`, payload);
                setAlertConfig({ open: true, type: 'success', message: 'Cập nhật địa chỉ thành công!' });
            } else {
                await api.post('/users/addresses', payload);
                setAlertConfig({ open: true, type: 'success', message: 'Thêm địa chỉ thành công!' });
            }

            setShowForm(false);
            setEditingId(null);
            await fetchAddresses();

        } catch (error) {
            setAlertConfig({ open: true, type: 'error', message: error.response?.data?.message || 'Có lỗi xảy ra!' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ===== API ĐẶT MẶC ĐỊNH & XÓA =====
    const handleSetDefault = async (id) => {
        try {
            await api.put(`/users/addresses/${id}/default`);
            setAlertConfig({ open: true, type: 'success', message: 'Đã thiết lập làm mặc định!' });
            await fetchAddresses();
        } catch (error) {
            setAlertConfig({ open: true, type: 'error', message: 'Lỗi thiết lập mặc định!' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
        try {
            await api.delete(`/users/addresses/${id}`);
            setAlertConfig({ open: true, type: 'success', message: 'Đã xóa địa chỉ!' });
            await fetchAddresses();
        } catch (error) {
            setAlertConfig({ open: true, type: 'error', message: error.response?.data?.message || 'Lỗi khi xóa địa chỉ!' });
        }
    };

    // ===== GIAO DIỆN FORM (Được đóng gói để gọi lại nhiều nơi) =====
    const renderAddressForm = (title) => {
        // KIỂM TRA ĐỂ KHÓA CHECKBOX:
        // 1. Nếu danh sách chưa có gì -> Bắt buộc là mặc định
        // 2. Nếu đang sửa địa chỉ gốc đã là mặc định -> Bắt buộc giữ nguyên mặc định
        const originalAddress = addresses.find(a => a.id === editingId);
        const isOriginalDefault = originalAddress ? (originalAddress.isDefault || originalAddress.default) : false;
        const forceDisableCheckbox = addresses.length === 0 || isOriginalDefault;

        return (
            <Box sx={{ bgcolor: '#fafafa', p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px dashed #ccc', mb: editingId ? 0 : 5 }}>
                <Typography fontWeight="bold" mb={3} color="primary.main">
                    {title}
                </Typography>

                <Box component="form" onSubmit={handleSaveAddress} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <TextField fullWidth required label="Họ tên người nhận" size="small" value={newAddress.receiverName} onChange={e => setNewAddress({ ...newAddress, receiverName: e.target.value })} />
                        <TextField fullWidth required label="Số điện thoại" size="small" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} />
                    </Box>

                    {!isChangingLocation ? (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#fff', border: '1px solid #eee', borderRadius: 1 }}>
                            <Typography variant="body2"><strong>Khu vực:</strong> {newAddress.oldLocationText}</Typography>
                            <Button size="small" variant="outlined" onClick={() => setIsChangingLocation(true)}>Thay đổi</Button>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel>Tỉnh / Thành phố</InputLabel>
                                    <Select value={newAddress.provinceId} label="Tỉnh / Thành phố" onChange={handleProvinceChange} MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}>
                                        {provinces.map(p => <MenuItem key={p.id} value={p.id}>{p.full_name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small" required disabled={!newAddress.provinceId}>
                                    <InputLabel>Quận / Huyện</InputLabel>
                                    <Select value={newAddress.districtId} label="Quận / Huyện" onChange={handleDistrictChange} MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}>
                                        {districts.map(d => <MenuItem key={d.id} value={d.id}>{d.full_name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth size="small" required disabled={!newAddress.districtId}>
                                    <InputLabel>Phường / Xã</InputLabel>
                                    <Select value={newAddress.wardId} label="Phường / Xã" onChange={handleWardChange} MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}>
                                        {wards.map(w => <MenuItem key={w.id} value={w.id}>{w.full_name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>
                            {editingId && (
                                <Button size="small" color="inherit" onClick={() => setIsChangingLocation(false)} sx={{ alignSelf: 'flex-start', mt: -2 }}>Hủy thay đổi khu vực</Button>
                            )}
                        </>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <TextField
                            fullWidth required label="Số nhà, Tên đường..." size="small"
                            value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                            sx={{ flex: 2 }}
                        />
                        <TextField
                            fullWidth label="Tên gợi nhớ (Tùy chọn)" size="small"
                            placeholder="VD: Nhà riêng, Công ty..."
                            value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                            sx={{ flex: 1 }}
                        />
                    </Box>

                    {/* ĐÃ SỬA LỖI UI: KHÓA CHẾT CHECKBOX NẾU BUỘC PHẢI LÀ MẶC ĐỊNH */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={forceDisableCheckbox ? true : newAddress.isDefault}
                                onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                disabled={forceDisableCheckbox}
                                sx={{
                                    color: '#111',
                                    '&.Mui-checked': { color: forceDisableCheckbox ? '#888' : '#111' },
                                    '&.Mui-disabled': { color: '#ccc' }
                                }}
                            />
                        }
                        label={
                            <Typography variant="body2" fontWeight="bold" color={forceDisableCheckbox ? 'text.secondary' : 'text.primary'}>
                                Đặt làm địa chỉ mặc định
                            </Typography>
                        }
                    />

                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ bgcolor: '#111', px: 4 }}>
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'LƯU ĐỊA CHỈ'}
                        </Button>
                        <Button variant="text" color="inherit" onClick={() => { setShowForm(false); setEditingId(null); }}>
                            HỦY BỎ
                        </Button>
                    </Box>

                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Snackbar open={alertConfig.open} autoHideDuration={3000} onClose={() => setAlertConfig({ ...alertConfig, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert severity={alertConfig.type} variant="filled" sx={{ width: '100%', color: '#fff' }}>{alertConfig.message}</Alert>
            </Snackbar>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#111' }}>
                    Sổ Địa Chỉ
                </Typography>

                {!showForm && (
                    <Button variant="contained" color="primary" startIcon={<AddLocationAltIcon />} onClick={handleOpenAdd}>
                        THÊM ĐỊA CHỈ MỚI
                    </Button>
                )}
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Quản lý thông tin sổ địa chỉ của bạn
            </Typography>

            <Divider sx={{ mb: 4 }} />

            {showForm && !editingId && renderAddressForm('THÊM ĐỊA CHỈ GIAO HÀNG MỚI')}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress color="primary" /></Box>
            ) : addresses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 60, color: '#ccc', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">Bạn chưa lưu địa chỉ nào.</Typography>
                </Box>
            ) : (
                <Box sx={{
                    display: 'flex', flexDirection: 'column', gap: 3,
                    maxHeight: '600px', overflowY: 'auto', pr: 1,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: '4px' }
                }}>
                    {addresses.map((addr) => {
                        const isDef = addr.isDefault === true || addr.default === true;

                        if (editingId === addr.id) {
                            return <Box key={addr.id}>{renderAddressForm('CHỈNH SỬA ĐỊA CHỈ')}</Box>;
                        }

                        return (
                            <Paper key={addr.id} elevation={0} sx={{ p: 3, border: isDef ? '1px solid #111' : '1px solid #eee', borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {addr.address.receiverName}
                                            <Typography component="span" color="text.secondary" fontWeight="normal">|</Typography>
                                            <Typography component="span" color="text.secondary" fontWeight="normal">{addr.address.phone}</Typography>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" mb={0.5}>
                                            {addr.address.street}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" mb={1.5}>
                                            {addr.address.ward}, {addr.address.district}, {addr.address.province}
                                        </Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {addr.label && addr.label !== 'Địa chỉ' && (
                                                <Chip label={addr.label} size="small" sx={{ bgcolor: '#eee', color: '#333', fontWeight: 'bold' }} />
                                            )}
                                            {isDef && (
                                                <Chip label="Mặc định" size="small" variant="outlined" color="error" sx={{ fontWeight: 'bold' }} />
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button size="small" variant="text" sx={{ color: '#1976d2', fontWeight: 'bold' }} onClick={() => handleOpenEdit(addr)}>
                                                Cập nhật
                                            </Button>
                                            {!isDef && (
                                                <Button size="small" variant="text" color="error" onClick={() => handleDelete(addr.id)}>
                                                    Xóa
                                                </Button>
                                            )}
                                        </Box>

                                        {!isDef && (
                                            <Button size="small" variant="outlined" color="inherit" onClick={() => handleSetDefault(addr.id)}>
                                                Thiết lập mặc định
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}