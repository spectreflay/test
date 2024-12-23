import React, { useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import StaffLogin from "./components/auth/StaffLogin";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Discounts from "./pages/Discounts";
import Inventory from "./pages/Inventory";
import CreateStore from "./pages/CreateStore";
import Stores from "./pages/Stores";
import UserManagement from "./pages/UserManagement";
import Unauthorized from "./pages/Unauthorized";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Documentation from "./pages/Documentation";
import { RootState } from "./store";
import { PERMISSIONS } from "./utils/permissions";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import EmailVerification from "./pages/EmailVerification";
import ResendVerification from "./pages/ResendVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SubscriptionRestrictedRoute from "./components/subscription/subscriptionRestrictedRoute";
import { subscriptionManager } from "./utils/subscription/subscriptionManager";

function App() {
  const { token, staff } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token && location.pathname === "/") {
      if (staff) {
        navigate(`/stores/${staff.store}/dashboard`);
      } else {
        navigate("/stores");
      }
    }
  }, [token, staff, navigate, location.pathname]);
  useEffect(() => {
    // Cleanup subscription manager on unmount
    return () => {
      subscriptionManager.cleanup();
    };
  }, []);

  return (
    <ThemeProvider>
      <Routes>
        <Route index path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/About" element={<About />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Basic routes available even with expired subscription */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route
            index
            element={
              staff ? (
                <Navigate to={`/stores/${staff.store}/dashboard`} replace />
              ) : (
                <Stores />
              )
            }
          />
          <Route
            path="stores"
            element={
              staff ? (
                <Navigate to={`/stores/${staff.store}/dashboard`} replace />
              ) : (
                <Stores />
              )
            }
          />

          <Route
            path="stores/create"
            element={
              staff ? (
                <Navigate to={`/stores/${staff.store}/dashboard`} replace />
              ) : (
                <CreateStore />
              )
            }
          />
          <Route path="stores/:storeId">
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="settings"
              element={
                <ProtectedRoute
                  requiredPermission={PERMISSIONS.MANAGE_SETTINGS}
                >
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories"
              element={
                <ProtectedRoute
                  requiredPermission={PERMISSIONS.MANAGE_INVENTORY}
                >
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <SubscriptionRestrictedRoute
                  requiredFeature={PERMISSIONS.MANAGE_INVENTORY}
                >
                  <Products />
                </SubscriptionRestrictedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute
                  requiredPermission={PERMISSIONS.MANAGE_INVENTORY}
                >
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.CREATE_SALE}>
                  <Sales />
                </ProtectedRoute>
              }
            />
            <Route
              path="discounts"
              element={
                <ProtectedRoute
                  requiredPermission={PERMISSIONS.MANAGE_INVENTORY}
                >
                  <Discounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_REPORTS}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_USERS}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
