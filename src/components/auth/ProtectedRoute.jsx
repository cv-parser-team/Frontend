
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
  getAuthToken,
  isAuthenticated,
  restoreSession,
} from "../../api/authApi";

export default function ProtectedRoute() {
  const [hadToken] = useState(() => Boolean(getAuthToken()));
  const [status, setStatus] = useState(
    isAuthenticated() ? "authenticated" : "checking"
  );

  useEffect(() => {
    if (status !== "checking") return undefined;

    let active = true;
    restoreSession()
      .then(() => {
        if (active) setStatus("authenticated");
      })
      .catch(() => {
        if (active) setStatus("anonymous");
      });
    return () => {
      active = false;
    };
  }, [status]);

  if (status === "checking") return null;
  if (status === "authenticated") return <Outlet />;
  return (
    <Navigate
      to="/login"
      replace
      state={hadToken ? { notice: "session-expired" } : undefined}
    />
  );
}
