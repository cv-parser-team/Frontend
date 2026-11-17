
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import ProfilePage from "./pages/ProfilePage";
import UploadPage from "./pages/UploadPage";
import ReviewCenter from "./pages/ReviewCenter";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
 import ResourcesPage from "./pages/ResourcesPage";
import ResourceDetailPage from "./pages/ResourceDetailPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SettingsPage from "./pages/SettingsPage.jsx";

function PlaceholderPage({ title }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        This page is under development.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
    
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

          <Route
            path="/upload"
            element={<UploadPage />}
          />

             <Route
          path="/sources"
          element={<ResourcesPage />}
        />

        <Route
          path="/sources/:resourceId"
          element={<ResourceDetailPage />}
        />

         

        </Route>
       <Route path="/login" element={<LoginPage />} />
       <Route path="/signup" element={<SignUpPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


