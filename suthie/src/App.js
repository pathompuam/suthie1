import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy } from "react";

// ✅ โหลดเฉพาะหน้าที่ใช้บ่อย/หน้าแรกแบบปกติ
import SutLanding from "./pages/sutlanding/SutLanding";
import Login from "./pages/login/Login";
import SutLanding2 from "./pages/sutlanding/SutLanding2";

// ✅ Lazy load ทุกหน้าที่เหลือ — โหลดเฉพาะตอนเปิดหน้านั้น
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

// ✅ Loading fallback เบาๆ
//const PageLoader = () => (
  //<div style={{
    //display: 'flex', alignItems: 'center', justifyContent: 'center',
    //height: '100vh', fontSize: 16, color: '#64748b', fontFamily: 'sans-serif'
 // }}>
   // กำลังโหลด...
  //</div>
//);

const AdminRoute = ({ children }) => {
  const userStr = localStorage.getItem("suth_user");
  if (!userStr) return <Navigate to="/login" replace />;
  try {
    JSON.parse(userStr);
  } catch {
    localStorage.removeItem("suth_user");
    return <Navigate to="/login" replace />;
  }
  return children;};

function App() {
  return (
    <BrowserRouter>
      {/* ✅ Suspense ครอบทุก Route — แสดง loader ระหว่าง lazy load */}
        <Routes>
          <Route path="/test" element={<SutLanding />} />
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