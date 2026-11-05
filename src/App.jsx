
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import SourcesPage from "./pages/SourcesPage";
import ProfilePage from "./pages/ProfilePage";
import UploadPage from "./pages/UploadPage";


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
          <Route
            path="/"
            element={<Navigate to="/sources" replace />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/upload"
            element={<UploadPage />}
          />

          <Route
            path="/sources"
            element={<SourcesPage />}
          />

          <Route
            path="/review"
            element={<PlaceholderPage title="Review Center" />}
          />

          <Route
            path="/history"
            element={<PlaceholderPage title="History & Activity" />}
          />

          <Route
            path="/settings"
            element={<PlaceholderPage title="Settings" />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/sources" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}


