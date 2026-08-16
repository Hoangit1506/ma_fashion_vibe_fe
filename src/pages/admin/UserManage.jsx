import { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, TextField, Pagination, Chip, IconButton,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Switch,
    Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
    Snackbar, Alert
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export default function UserManage() {
    const { user: currentUser } = useContext(AuthContext);
    const [searchParams, setSearchParams] = useSearchParams();

    // 1. LẤY TRẠNG THÁI TỪ URL (Đã đổi mặc định sortBy thành lastLoginAt)
    const page = parseInt(searchParams.get('page') || '1', 10);
    const keyword = searchParams.get('keyword') || '';
    const role = searchParams.get('role') || '';
    const enabled = searchParams.get('enabled') || '';
    const sortBy = searchParams.get('sortBy') || 'lastLoginAt';
    const direction = searchParams.get('direction') || 'desc';

    // 2. STATE DỮ LIỆU
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState(keyword);

    // Modal tạo Nhân viên
    const [openModal, setOpenModal] = useState(false);
    // const [staffForm, setStaffForm] = useState({ email: '', fullName: '', password: '' });
    const [staffForm, setStaffForm] = useState({ email: '', fullName: '', password: '', confirmPassword: '' });
    const [creating, setCreating] = useState(false);

    // Modal Xác nhận Khóa/Mở Khóa
    const [confirmDialog, setConfirmDialog] = useState({ open: false, userId: null, isLocking: false });

    // Thông báo MUI
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const showMessage = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

    // 3. GỌI API LẤY DANH SÁCH
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/users', {
                params: {
                    page, size: 10, keyword, sortBy, direction,
                    role: role === '' ? null : role,
                    enabled: enabled === '' ? null : enabled === 'true'
                }
            });
            setUsers(response.data.result.data);
            setTotalPages(response.data.result.totalPages);
        } catch (error) {
            console.error("Lỗi tải danh sách người dùng:", error);
            showMessage("Không thể tải danh sách tài khoản", "error");
        } finally {
            setLoading(false);
        }
    }, [page, keyword, role, enabled, sortBy, direction]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // 4. XỬ LÝ TÌM KIẾM
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inputValue !== keyword) {
                setSearchParams(prev => {
                    if (inputValue) prev.set('keyword', inputValue);
                    else prev.delete('keyword');
                    prev.set('page', '1');
                    return prev;
                });
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue, keyword, setSearchParams]);

    // 5. CÁC HÀM XỬ LÝ LỌC & SẮP XẾP
    const handleFilterChange = (field, value) => {
        setSearchParams(prev => {
            if (value !== '') prev.set(field, value);
            else prev.delete(field);
            prev.set('page', '1');
            return prev;
        });
    };

    const handleSortDropdown = (e) => {
        const value = e.target.value;
        if (!value) return;
        const [newSortBy, newDirection] = value.split('-');
        setSearchParams(prev => {
            prev.set('sortBy', newSortBy);
            prev.set('direction', newDirection);
            prev.set('page', '1');
            return prev;
        });
    };

    const handlePageChange = (event, value) => {
        setSearchParams(prev => { prev.set('page', value); return prev; });
    };

    // 6. XỬ LÝ NÚT KHÓA/MỞ KHÓA (Bật Modal Xác nhận)
    const openConfirmToggle = (userId, currentEnabledStatus) => {
        setConfirmDialog({ open: true, userId, isLocking: currentEnabledStatus }); // Nếu đang enabled (true) thì hành động là Khóa (isLocking = true)
    };

    const executeToggleStatus = async () => {
        try {
            await api.patch(`/users/${confirmDialog.userId}/status`);
            showMessage("Cập nhật trạng thái thành công!", "success");
            setConfirmDialog({ open: false, userId: null, isLocking: false });
            fetchUsers();
        } catch (error) {
            showMessage(error.response?.data?.message || "Lỗi khi cập nhật trạng thái", "error");
            setConfirmDialog({ ...confirmDialog, open: false });
        }
    };

    // 7. GỌI API TẠO NHÂN VIÊN
    const handleCreateStaff = async () => {
        if (!staffForm.email || !staffForm.fullName || !staffForm.password || !staffForm.confirmPassword) {
            showMessage("Vui lòng điền đầy đủ thông tin", "error");
            return;
        }
        if (staffForm.password !== staffForm.confirmPassword) {
            showMessage("Mật khẩu xác nhận không khớp!", "error");
            return;
        }
        setCreating(true);
        try {
            await api.post('/users/staff', staffForm);
            showMessage("Tạo tài khoản nhân viên thành công!", "success");
            setOpenModal(false);
            setStaffForm({ email: '', fullName: '', password: '', confirmPassword: '' });
            // setStaffForm({ email: '', fullName: '', password: '' });
            fetchUsers();
        } catch (error) {
            showMessage(error.response?.data?.message || "Lỗi khi tạo tài khoản", "error");
        } finally {
            setCreating(false);
        }
    };

    // Helpers format ngày
    const formatDateTime = (dateString) => {
        if (!dateString) return 'Chưa từng ĐN';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    };

    const currentSortValue = `${sortBy}-${direction}`;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                    Quản lý Tài khoản
                </Typography>
                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setOpenModal(true)}>
                    Tạo Nhân Viên
                </Button>
            </Box>

            {/* THANH CÔNG CỤ */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    label="Tìm Email, Tên, SĐT..." variant="outlined" size="small"
                    value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: '200px' }}
                />

                <FormControl size="small" sx={{ minWidth: '150px' }}>
                    <InputLabel>Vai trò</InputLabel>
                    <Select value={role} label="Vai trò" onChange={(e) => handleFilterChange('role', e.target.value)}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        <MenuItem value="USER">Khách hàng</MenuItem>
                        <MenuItem value="STAFF">Nhân viên</MenuItem>
                        <MenuItem value="ADMIN">Quản trị viên</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: '150px' }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select value={enabled} label="Trạng thái" onChange={(e) => handleFilterChange('enabled', e.target.value)}>
                        <MenuItem value=""><em>-- Tất cả --</em></MenuItem>
                        <MenuItem value="true">Đang hoạt động</MenuItem>
                        <MenuItem value="false">Đã khóa</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: '200px' }}>
                    <InputLabel>Sắp xếp theo</InputLabel>
                    <Select value={currentSortValue} label="Sắp xếp theo" onChange={handleSortDropdown}>
                        <MenuItem value="lastLoginAt-desc">Đăng nhập gần đây</MenuItem>
                        <MenuItem value="lastLoginAt-asc">Ít đăng nhập</MenuItem>
                        <MenuItem value="createdAt-desc">Mới tạo nhất</MenuItem>
                        <MenuItem value="createdAt-asc">Tạo lâu nhất</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {/* BẢNG DỮ LIỆU */}
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell fontWeight="bold">Thông tin</TableCell>
                            <TableCell>Vai trò</TableCell>
                            <TableCell>Ngày đăng ký</TableCell>
                            <TableCell>Đăng nhập cuối</TableCell>
                            <TableCell align="center">Trạng thái</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell></TableRow>
                        ) : users.length === 0 ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Không tìm thấy tài khoản nào.</TableCell></TableRow>
                        ) : (
                            users.map((row) => {
                                const isRowAdmin = row.roles.includes('ADMIN') || row.roles.includes('ROLE_ADMIN');

                                return (
                                    <TableRow key={row.id} hover sx={{ opacity: row.enabled ? 1 : 0.6, transition: '0.3s' }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <Typography variant="body1" fontWeight="bold">
                                                    {row.fullName || 'Chưa cập nhật tên'}
                                                </Typography>
                                                {/* HIỂN THỊ PROVIDER */}
                                                <Chip
                                                    label={row.provider}
                                                    size="small"
                                                    color={row.provider === 'GOOGLE' ? 'error' : 'default'}
                                                    variant={row.provider === 'GOOGLE' ? 'filled' : 'outlined'}
                                                    sx={{ ml: 1, height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{row.email}</Typography>

                                            {/* CHỈ HIỂN THỊ KHI CÓ DỮ LIỆU */}
                                            {row.phone && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    SĐT: {row.phone}
                                                </Typography>
                                            )}
                                            {row.dob && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Ngày sinh: {formatDateOnly(row.dob)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isRowAdmin ? (
                                                <Chip label="ADMIN" color="error" size="small" sx={{ fontWeight: 'bold' }} />
                                            ) : row.roles.includes('STAFF') || row.roles.includes('ROLE_STAFF') ? (
                                                <Chip label="STAFF" color="warning" size="small" sx={{ fontWeight: 'bold' }} />
                                            ) : (
                                                <Chip label="USER" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                                        <TableCell>{formatDateTime(row.lastLoginAt)}</TableCell>
                                        <TableCell align="center">
                                            <Switch
                                                checked={row.enabled}
                                                onChange={() => openConfirmToggle(row.id, row.enabled)}
                                                color="success"
                                                disabled={isRowAdmin}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* PHÂN TRANG */}
            {totalPages > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
                    <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" size="large" />
                </Box>
            )}

            {/* MODAL XÁC NHẬN KHÓA / MỞ KHÓA */}
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                <DialogTitle sx={{ fontWeight: 'bold', color: confirmDialog.isLocking ? 'error.main' : 'success.main' }}>
                    Xác nhận {confirmDialog.isLocking ? 'Khóa' : 'Mở khóa'} tài khoản
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bạn có chắc chắn muốn <strong>{confirmDialog.isLocking ? 'khóa' : 'mở khóa'}</strong> tài khoản này không?
                        {confirmDialog.isLocking && " Người dùng sẽ không thể đăng nhập hoặc làm mới phiên làm việc cho đến khi bạn mở lại."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} color="inherit">Hủy</Button>
                    <Button onClick={executeToggleStatus} variant="contained" color={confirmDialog.isLocking ? "error" : "success"}>
                        Đồng ý
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL TẠO NHÂN VIÊN */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>Tạo tài khoản Nhân viên</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField label="Email" type="email" fullWidth required
                            value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} />
                        <TextField label="Họ và tên" fullWidth required
                            value={staffForm.fullName} onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })} />
                        <TextField label="Mật khẩu" type="password" fullWidth required
                            value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} />
                        <TextField label="Xác nhận mật khẩu" type="password" fullWidth required
                            value={staffForm.confirmPassword} onChange={e => setStaffForm({ ...staffForm, confirmPassword: e.target.value })} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setOpenModal(false)} color="inherit">Hủy</Button>
                    <Button onClick={handleCreateStaff} variant="contained" disabled={creating}>
                        {creating ? <CircularProgress size={24} color="inherit" /> : "Tạo mới"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontWeight: 'bold' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
