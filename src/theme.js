import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            // Xanh lá sáng (như cỏ non đang đâm chồi - Mộc)
            main: '#66BB6A',
            light: '#98EE99',
            dark: '#338A3E',
            contrastText: '#ffffff',
        },
        secondary: {
            // Vàng Kim loại (Kim) lấy cảm hứng từ viền logo
            main: '#D4AF37',
            contrastText: '#ffffff',
        },
        background: {
            default: '#F4F6F8', // FDFDFD
            paper: '#FFFFFF',
        },
        text: {
            primary: '#3E2723', // Nâu đất tối (Thổ)
            secondary: '#795548',
        }
    },
    typography: {
        fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
        button: {
            textTransform: 'none', // Bỏ viết hoa toàn bộ nút bấm nhìn cho hiện đại
            fontWeight: 'bold',
        }
    },
    components: {
        // Bo góc nhẹ cho các khối Paper và Button để tạo cảm giác mềm mại (hợp web nữ)
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 8 },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { borderRadius: 12 },
            },
        },
    },
});

export default theme;