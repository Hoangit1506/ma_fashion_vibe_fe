import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, TextField,
    FormControl, InputLabel, Select, MenuItem, CircularProgress, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// IMPORT THƯ VIỆN BIỂU ĐỒ CỦA MUI
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';

import api from '../../services/api';

const STATUS_COLORS = {
    PENDING: '#795548',     // Nâu (Thổ) - Chờ xác nhận
    CONFIRMED: '#fbc02d',   // Vàng (Kim) - Đã xác nhận
    PROCESSING: '#0288d1',  // Xanh dương (Thủy) - Đang chuẩn bị (Tạo sự cân bằng)
    SHIPPING: '#ed6c02',    // Cam - Đang giao (Sự dịch chuyển)
    DELIVERED: '#2e7d32',   // Xanh lá (Mộc) - Thành công (Sinh sôi)
    CANCELED: '#d32f2f',    // Đỏ - Đã hủy
    REFUNDED: '#9e9e9e'     // Xám/Trắng - Hoàn trả
};

const STATUS_LABELS = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PROCESSING: 'Đang chuẩn bị',
    SHIPPING: 'Đang giao',
    DELIVERED: 'Thành công',
    CANCELED: 'Đã hủy',
    REFUNDED: 'Hoàn trả'
};

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    // STATE BỘ LỌC THỜI GIAN
    const [timePreset, setTimePreset] = useState('thisMonth');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // --- HÀM TÍNH TOÁN NGÀY THÁNG ---
    const getFormattedDate = (dateObj) => {
        // Trả về định dạng YYYY-MM-DD
        const d = new Date(dateObj);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    // --- HÀM GỌI API ---
    const fetchDashboardData = useCallback(async (startDate, endDate) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/dashboard/stats', {
                params: {
                    startDate: startDate || null,
                    endDate: endDate || null
                }
            });
            setDashboardData(res.data.result);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu thống kê:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- EFFECT: LẮNG NGHE SỰ THAY ĐỔI CỦA BỘ LỌC ---
    useEffect(() => {
        let start = '';
        let end = '';

        if (timePreset === 'custom') {
            start = customStart;
            end = customEnd;
        } else {
            const today = new Date();
            end = getFormattedDate(today);

            let from = new Date();
            if (timePreset === 'today') from.setDate(today.getDate());
            else if (timePreset === '7days') from.setDate(today.getDate() - 6); // 7 ngày bao gồm hôm nay
            else if (timePreset === 'thisMonth') from.setDate(1);
            else if (timePreset === 'thisYear') from.setMonth(0, 1);

            start = getFormattedDate(from);
        }

        // Gọi API với ngày đã được tính toán
        fetchDashboardData(start, end);
    }, [timePreset, customStart, customEnd, fetchDashboardData]);

    // --- XỬ LÝ SỰ KIỆN ĐỔI BỘ LỌC ---
    const handlePresetChange = (e) => {
        const val = e.target.value;
        setTimePreset(val);
        // Nếu chọn preset có sẵn (không phải custom) thì xóa trắng 2 ô DatePicker đi
        if (val !== 'custom') {
            setCustomStart('');
            setCustomEnd('');
        }
    };

    const handleCustomDateChange = (field, val) => {
        setTimePreset('custom'); // Tự động nhảy Dropdown về "Tùy chỉnh"
        if (field === 'start') setCustomStart(val);
        if (field === 'end') setCustomEnd(val);
    };

    const formatPrice = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    if (loading && !dashboardData) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>;
    }

    const { kpi, charts, orderStatus, reports } = dashboardData || {};

    // Chuẩn bị dữ liệu cho LineChart (Doanh thu)
    const xLabels = charts?.map(c => {
        const parts = c.date.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : c.date;
    }) || [];
    const revenueData = charts?.map(c => c.revenue) || [];

    // Chuẩn bị dữ liệu cho PieChart (Trạng thái đơn)
    const pieData = orderStatus?.map((s, index) => ({
        id: index,
        value: s.count,
        label: STATUS_LABELS[s.status] || s.status,
        color: STATUS_COLORS[s.status] || '#999'
    })).filter(s => s.value > 0) || []; // Chỉ hiển thị các trạng thái > 0 đơn

    // Tạo một mảng Cảnh báo kho mới và tự động sắp xếp từ Thấp đến Cao
    const sortedLowStockAlerts = reports?.lowStockAlerts
        ? [...reports.lowStockAlerts].sort((a, b) => a.available - b.available)
        : [];

    return (
        <Box sx={{ pb: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                    Tổng Quan Hệ Thống
                </Typography>
            </Box>

            {/* ========================================== */}
            {/* TẦNG 1: BỘ LỌC THỜI GIAN */}
            {/* ========================================== */}
            <Paper sx={{ p: 2, mb: 4, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', bgcolor: '#fbfbfb' }}>
                <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                    Lọc dữ liệu theo:
                </Typography>

                <FormControl size="small" sx={{ minWidth: '200px', bgcolor: '#fff' }}>
                    <InputLabel>Khoảng thời gian</InputLabel>
                    <Select value={timePreset} label="Khoảng thời gian" onChange={handlePresetChange}>
                        <MenuItem value="today">Hôm nay</MenuItem>
                        <MenuItem value="7days">7 ngày qua</MenuItem>
                        <MenuItem value="thisMonth">Tháng này</MenuItem>
                        <MenuItem value="thisYear">Năm nay</MenuItem>
                        <MenuItem value="custom"><em>Tùy chỉnh bên cạnh ➔</em></MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        type="date" size="small" label="Từ ngày"
                        value={customStart} onChange={(e) => handleCustomDateChange('start', e.target.value)}
                        InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff' }}
                    />
                    <Typography color="text.secondary">-</Typography>
                    <TextField
                        type="date" size="small" label="Đến ngày"
                        value={customEnd} onChange={(e) => handleCustomDateChange('end', e.target.value)}
                        InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff' }}
                    />
                </Box>
            </Paper>

            {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mb: 2 }} />}

            {/* ========================================== */}
            {/* TẦNG 2: CÁC THẺ KPI (BỐ CỤC CHIA 5 ĐỒNG ĐỀU) */}
            {/* ========================================== */}
            {kpi && (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
                    gap: 3,
                    mb: 4
                }}>
                    <Card sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 2 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <AttachMoneyIcon sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
                            <Typography variant="body2" fontWeight="bold" textTransform="uppercase">Tổng Doanh Thu</Typography>
                            <Typography variant="h5" fontWeight="900" mt={1}>{formatPrice(kpi.totalRevenue)}</Typography>
                        </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: '#fffde7', color: '#f57f17', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 2 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <ShoppingBagIcon sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
                            <Typography variant="body2" fontWeight="bold" textTransform="uppercase">Tổng Đơn Hàng</Typography>
                            <Typography variant="h4" fontWeight="900" mt={1}>{kpi.totalOrders}</Typography>
                        </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: '#fff3e0', color: '#e65100', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 2 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <CheckroomIcon sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
                            <Typography variant="body2" fontWeight="bold" textTransform="uppercase">Sản Phẩm Đã Giao</Typography>
                            <Typography variant="h4" fontWeight="900" mt={1}>{kpi.totalProductsSold}</Typography>
                        </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: '#e3f2fd', color: '#1565c0', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 2 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
                            <Typography variant="body2" fontWeight="bold" textTransform="uppercase">Khách Đã Mua</Typography>
                            <Typography variant="h4" fontWeight="900" mt={1}>{kpi.totalBuyingCustomers}</Typography>
                        </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: '#e0f7fa', color: '#00838f', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 2 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <PersonAddIcon sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
                            <Typography variant="body2" fontWeight="bold" textTransform="uppercase">Tài Khoản Mới</Typography>
                            <Typography variant="h4" fontWeight="900" mt={1}>{kpi.totalNewCustomers}</Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}


            {/* ========================================== */}
            {/* TẦNG 3: BIỂU ĐỒ (CSS FLEXBOX DỌC, ÉP FULL 100% WIDTH) */}
            {/* ========================================== */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4, width: '100%' }}>

                {/* Biểu Đồ Doanh Thu */}
                <Paper sx={{ p: 3, width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={1}>
                        <TrendingUpIcon color="primary" /> Biểu Đồ Doanh Thu Giao Thành Công
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {xLabels.length === 0 ? (
                        <Box sx={{ py: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">Không có dữ liệu trong khoảng thời gian này</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ width: '100%', minHeight: '350px' }}>
                            <LineChart
                                xAxis={[{ data: xLabels, scaleType: 'point' }]}
                                series={[{
                                    data: revenueData,
                                    label: 'Doanh thu (VNĐ)',
                                    color: '#2e7d32', // Xanh lá
                                    valueFormatter: (v) => new Intl.NumberFormat('vi-VN').format(v) + ' đ',
                                    area: true,
                                }]}
                                height={350}
                                margin={{ left: 80, right: 30, top: 30, bottom: 30 }}
                                grid={{ horizontal: true }}
                            />
                        </Box>
                    )}
                </Paper>

                {/* Biểu Đồ Tròn Trạng Thái */}
                <Paper sx={{ p: 3, width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" fontWeight="bold" mb={2} textAlign="center">
                        Tỉ Lệ Trạng Thái Đơn Hàng
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {pieData.length === 0 ? (
                        <Box sx={{ py: 5, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">Không có đơn hàng nào</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                <PieChart
                                    series={[
                                        {
                                            data: pieData,
                                            innerRadius: 80,
                                            outerRadius: 150,
                                            paddingAngle: 2,
                                            cornerRadius: 4,
                                        }
                                    ]}
                                    height={350}
                                    width={400} // Ép cứng kích thước khối tròn để nó luôn cân tâm
                                    margin={{ top: 10, bottom: 10 }}
                                    slotProps={{ legend: { hidden: true } }}
                                />
                            </Box>

                            {/* Chú thích nằm dàn ngang dưới biểu đồ */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3, justifyContent: 'center' }}>
                                {pieData.map((item) => (
                                    <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: item.color }} />
                                        <Typography variant="body2" fontWeight="bold">{item.label} ({item.value})</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Paper>

            </Box>

            {/* ========================================== */}
            {/* TẦNG 4: DANH SÁCH TOP VÀ CẢNH BÁO (CSS FLEXBOX DỌC) */}
            {/* ========================================== */}
            {reports && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>

                    {/* TOP 10 SẢN PHẨM BÁN CHẠY */}
                    <Paper sx={{ p: 0, overflow: 'hidden', width: '100%', boxSizing: 'border-box', border: '1px solid #eee', boxShadow: 'none' }}>
                        <Box sx={{ bgcolor: '#fff3e0', p: 2, borderBottom: '2px solid #ff9800' }}>
                            <Typography variant="h6" fontWeight="bold" color="#e65100">🔥 Top 10 Bán Chạy Nhất</Typography>
                        </Box>
                        <TableContainer sx={{ maxHeight: 500, width: '100%' }}>
                            <Table stickyHeader sx={{ width: '100%', tableLayout: 'auto' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: '100px' }}><b>Hạng</b></TableCell>
                                        <TableCell><b>Tên Sản Phẩm</b></TableCell>
                                        <TableCell align="center" sx={{ width: '150px' }}><b>Đã Bán</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reports.topProducts?.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>Chưa có dữ liệu</TableCell></TableRow>
                                    ) : (
                                        reports.topProducts?.map((p, idx) => (
                                            <TableRow key={p.id} hover>
                                                <TableCell>
                                                    <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: idx < 3 ? '#ff9800' : '#e0e0e0', color: idx < 3 ? '#fff' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                                                        {idx + 1}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body1" fontWeight="bold" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {p.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="h6" fontWeight="bold" color="success.main">
                                                        {p.soldCount}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* CẢNH BÁO KHO */}
                    <Paper sx={{ p: 0, overflow: 'hidden', width: '100%', boxSizing: 'border-box', border: '1px solid #eee', boxShadow: 'none' }}>
                        <Box sx={{ bgcolor: '#ffebee', p: 2, borderBottom: '2px solid #f44336', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight="bold" color="#c62828" display="flex" alignItems="center" gap={1}>
                                <WarningAmberIcon /> Cảnh Báo Kho &lt; 10 Sản Phẩm
                            </Typography>
                            <Chip label={`${sortedLowStockAlerts?.length || 0} mục`} color="error" />
                        </Box>
                        <TableContainer sx={{ maxHeight: 500, width: '100%' }}>
                            <Table stickyHeader sx={{ width: '100%', tableLayout: 'auto' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><b>Tên SP / Phân loại</b></TableCell>
                                        <TableCell sx={{ width: '200px' }}><b>SKU</b></TableCell>
                                        <TableCell align="center" sx={{ width: '150px' }}><b>Còn Lại</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedLowStockAlerts.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>Kho hàng đang dồi dào, không có cảnh báo.</TableCell></TableRow>
                                    ) : (
                                        sortedLowStockAlerts.map((alert, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell>
                                                    <Typography variant="body1" fontWeight="bold" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{alert.productName}</Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Phân loại: {alert.color} - {alert.size}</Typography>
                                                </TableCell>
                                                <TableCell><Typography variant="body1">{alert.sku}</Typography></TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="h6" fontWeight="900" color="error.main">
                                                        {alert.available}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                </Box>
            )}

        </Box>
    );
}
