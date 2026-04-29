import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, useEffect, useState } from "react"; 

import Login from "./pages/login/Login";
import SutLanding2 from "./pages/sutlanding/SutLanding2";

// ✅ Lazy load ทุกหน้าที่เหลือ
const Home = lazy(() => import("./pages/home/Home"));
const AssessmentResult = lazy(() => import("./pages/result/AssessmentResult"));
const Dashboard = lazy(() => import("./pages/admin/dashboard"));
const FormManager = lazy(() => import("./pages/admin/forms/FormManager"));
const FormBuilder = lazy(() => import("./pages/admin/forms/FormBuilder"));
const Appointment = lazy(() => import("./pages/admin/Appointment"));
const CaseData = lazy(() => import("./pages/admin/CaseData"));
const RolesPermissions = lazy(() => import("./pages/admin/RolesPermissions"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const RiskCases = lazy(() => import("./pages/admin/RiskCases"));
const BannerManagement = lazy(() => import("./pages/admin/BannerManagement"));
const FormView = lazy(() => import("./pages/assessment/formView/FormView"));
const HistorySearch = lazy(() => import("./pages/assessment/history/HistorySearch"));
const HistoryResult = lazy(() => import("./pages/assessment/history/HistoryResult"));

const AdminRoute = ({ children }) => {
  const userStr = sessionStorage.getItem("suth_user") || localStorage.getItem("suth_user");
  
  if (!userStr) return <Navigate to="/login" replace />;
  try {
    JSON.parse(userStr);
  } catch {
    sessionStorage.removeItem("suth_user");
    localStorage.removeItem("suth_user");
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const isAdminPath = window.location.pathname.startsWith('/admin');

    const syncSession = (event) => {
      // 🟢 1. ระบบ Global Logout: ถ้ามีแท็บนึงสั่ง Logout แท็บอื่นต้องเด้งออกด้วย
      if (event.key === 'SUTH_LOGOUT') {
        sessionStorage.removeItem('suth_token');
        sessionStorage.removeItem('suth_user');
        if (isAdminPath) window.location.href = '/login';
      }

      // 2. ถ้าแท็บอื่นขอข้อมูลมา ให้ส่งกลับไป (ถ้าเรามี)
      if (event.key === 'REQUEST_SESSION_SYNC' && sessionStorage.getItem('suth_token')) {
        localStorage.setItem('SESSION_SYNC_DATA', JSON.stringify({
          token: sessionStorage.getItem('suth_token'),
          user: sessionStorage.getItem('suth_user')
        }));
        localStorage.removeItem('SESSION_SYNC_DATA'); 
      }

      // 3. รับข้อมูลกลับมา แล้วเข้าสู่ระบบให้
      if (event.key === 'SESSION_SYNC_DATA' && event.newValue) {
        const data = JSON.parse(event.newValue);
        if (data.token && data.user) {
          sessionStorage.setItem('suth_token', data.token);
          sessionStorage.setItem('suth_user', data.user);
          setIsInitializing(false); 
        }
      }
    };

    window.addEventListener('storage', syncSession);

    // 🟢 4. ขอ Sync ข้อมูล "เฉพาะ" ตอนที่อยู่หน้า Admin เท่านั้น
    if (isAdminPath && !sessionStorage.getItem('suth_token') && !localStorage.getItem('suth_token')) {
      localStorage.setItem('REQUEST_SESSION_SYNC', Date.now().toString());
      localStorage.removeItem('REQUEST_SESSION_SYNC');
      
      const timer = setTimeout(() => setIsInitializing(false), 300);
      return () => {
        window.removeEventListener('storage', syncSession);
        clearTimeout(timer);
      };
    } else {
      setIsInitializing(false);
    }

    return () => window.removeEventListener('storage', syncSession);
  }, []);

  const isAdminPath = window.location.pathname.startsWith('/admin');

  if (isInitializing && isAdminPath) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#64748b' }}>
        กำลังเชื่อมต่อข้อมูล...
      </div>
    );
  }

  return (
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<SutLanding2 />} />
          <Route path="/login" element={<Login />} />
        
          <Route path="/assessment" element={<Home />} />
          <Route path="/assessment-result" element={<AssessmentResult />} />
          <Route path="/assessment/:id" element={<FormView />} />
          <Route path="/history" element={<HistorySearch />} />
          <Route path="/history/result" element={<HistoryResult />} />

          <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/forms" element={<AdminRoute><FormManager /></AdminRoute>} />
          <Route path="/admin/forms/create" element={<AdminRoute><FormBuilder /></AdminRoute>} />
          <Route path="/admin/forms/edit/:id" element={<AdminRoute><FormBuilder /></AdminRoute>} />
          <Route path="/admin/schedule" element={<AdminRoute><Appointment /></AdminRoute>} />
          <Route path="/admin/cases" element={<AdminRoute><CaseData /></AdminRoute>} />
          <Route path="/admin/roles" element={<AdminRoute><RolesPermissions /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="/admin/risk-cases" element={<AdminRoute><RiskCases /></AdminRoute>} />
          <Route path="/admin/banner" element={<AdminRoute><BannerManagement /></AdminRoute>} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;