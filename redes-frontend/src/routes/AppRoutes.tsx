
import { useEffect } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { AppLayout } from "../components/Layout/AppLayout";
import { HomePage } from "../pages/HomePage/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage/NotFoundPage";
import { OsiDevelopmentPage } from "../pages/OsiDevelopmentPage/OsiDevelopmentPage";
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
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="modelo-osi" element={<OsiPage />} />
          <Route path="protocolos" element={<ProtocolsPage />} />
          <Route path="puertos" element={<PortsPage />} />
          <Route path="osi-en-desarrollo" element={<OsiDevelopmentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

