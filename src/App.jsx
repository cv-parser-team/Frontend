
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";

import DashboardLayout from "./layouts/DashboardLayout";
import ProfilePage from "./pages/ProfilePage";
import IssuesPage from "./pages/IssuesPage";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ResourcesPage from "./pages/ResourcesPage";
import ResourceDetailPage from "./pages/ResourceDetailPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SettingsPage from "./pages/SettingsPage.jsx";
import { SESSION_EXPIRED_EVENT } from "./api/axiosClient.js";
import SplashPage from "./pages/SplashPage.jsx";
function SessionExpiryRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = () => navigate("/login", {
      replace: true,
      state: { notice: "session-expired" },
    });

    window.addEventListener(SESSION_EXPIRED_EVENT, redirect);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, redirect);
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionExpiryRedirect />
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/sources" element={<ResourcesPage />} />
            <Route path="/sources/:resourceId" element={<ResourceDetailPage />} />
          </Route>
        </Route>
       <Route path="/login" element={<LoginPage />} />
       <Route path="/" element={<SplashPage />} />
       <Route path="/signup" element={<SignUpPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
