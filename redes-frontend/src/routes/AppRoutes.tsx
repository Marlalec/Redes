
import { useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { AppLayout } from "../components/Layout/AppLayout";
import { ProtectedRoute } from "../components/Auth/ProtectedRoute";
import { HomePage } from "../pages/HomePage/HomePage";
import { LoginPage } from "../pages/LoginPage/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage/NotFoundPage";
import { OsiPage } from "../pages/OsiPage/OsiPage";
import { PortsPage } from "../pages/PortsPage/PortsPage";
import { ProtocolsPage } from "../pages/ProtocolsPage/ProtocolsPage";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="modelo-osi" element={<OsiPage />} />
            <Route path="protocolos" element={<ProtocolsPage />} />
            <Route path="puertos" element={<PortsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

