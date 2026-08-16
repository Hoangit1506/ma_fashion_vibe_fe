import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/common/ScrollToTop';

// Import Layouts
import ClientLayout from './layouts/ClientLayout';
import AdminLayout from './layouts/AdminLayout';

// Import Pages - Client
import Home from './pages/client/Home';
import Login from './pages/client/Login';
import Register from './pages/client/Register';
import ForgotPassword from './pages/client/ForgotPassword';
import ProductList from './pages/client/ProductList';
import ProductDetail from './pages/client/ProductDetail';
import Cart from './pages/client/Cart';
import Checkout from './pages/client/Checkout';
import OrderSuccess from './pages/client/OrderSuccess';
import Contact from './pages/client/Contact';

import ProfileLayout from './pages/client/profile/ProfileLayout';
import ProfileInfo from './pages/client/profile/ProfileInfo';
import ChangePassword from './pages/client/profile/ChangePassword';
import AddressBook from './pages/client/profile/AddressBook';
import OrderHistory from './pages/client/profile/OrderHistory';
import MyReviews from './pages/client/profile/MyReviews';

// Import Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryManage from './pages/admin/CategoryManage';
import ProductManage from './pages/admin/ProductManage';
import ProductCreate from './pages/admin/ProductCreate';
import ProductEdit from './pages/admin/ProductEdit';
import InventoryManage from './pages/admin/InventoryManage';
import OrderManage from './pages/admin/OrderManage';
import UserManage from './pages/admin/UserManage';
import ReviewManage from './pages/admin/ReviewManage';


// Import Tường lửa
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>

            {/* NHÓM 1: GIAO DIỆN KHÁCH HÀNG (Dùng ClientLayout có Navbar) */}
            <Route path="/" element={<ClientLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="products" element={<ProductList />} />
              <Route path="product/:slug" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="/contact" element={<Contact />} />

              <Route element={<ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN']} />}>
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-success" element={<OrderSuccess />} />

                <Route path="profile" element={<ProfileLayout />}>
                  <Route index element={<ProfileInfo />} />
                  <Route path="password" element={<ChangePassword />} />
                  <Route path="addresses" element={<AddressBook />} />
                  <Route path="orders" element={<OrderHistory />} />
                  <Route path="reviews" element={<MyReviews />} />
                </Route>
              </Route>

            </Route>

            {/* NHÓM 2: GIAO DIỆN QUẢN TRỊ (Dùng AdminLayout có Sidebar) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="categories" element={<CategoryManage />} />
                <Route path="products" element={<ProductManage />} />
                <Route path="products/create" element={<ProductCreate />} />
                <Route path="products/edit/:id" element={<ProductEdit />} />
                <Route path="inventory" element={<InventoryManage />} />
                <Route path="orders" element={<OrderManage />} />
                <Route path="users" element={<UserManage />} />
                <Route path="reviews" element={<ReviewManage />} />
              </Route>
            </Route>

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;