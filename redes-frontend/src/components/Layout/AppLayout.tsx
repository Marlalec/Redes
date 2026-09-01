import { Outlet } from "react-router";
import { Footer } from "../Footer/Footer";
import { Navbar } from "../Navbar/Navbar";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main id="main-content" className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

