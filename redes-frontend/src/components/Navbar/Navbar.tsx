import { useState } from "react";
import { Link, NavLink } from "react-router";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  { to: "/modelo-osi", label: "Modelo OSI" },
  { to: "/protocolos", label: "Protocolos" },
  { to: "/puertos", label: "Puertos" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();

  const closeMenu = () => setIsOpen(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    closeMenu();

    try {
      await logout();
    } catch (error) {
      console.error(
        "No fue posible cerrar la sesión en el servidor",
        error,
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <header className="navbar">
        <div className="navbar__inner page-container">
          <Link
            className="brand"
            to="/"
            onClick={closeMenu}
            aria-label="OSI Dev Explorer, inicio"
          >
            <span className="brand__mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>

            <span className="brand__text">
              <strong>OSI Dev</strong>
              <small>Explorer</small>
            </span>
          </Link>

          <button
            className="nav-toggle"
            type="button"
            aria-label="Abrir o cerrar navegación"
            aria-expanded={isOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            id="primary-navigation"
            className={`nav-links${isOpen ? " nav-links--open" : ""}`}
            aria-label="Navegación principal"
          >
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-links__item${
                    isActive ? " nav-links__item--active" : ""
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {user ? (
              <div className="nav-session">
                <span
                  className="nav-session__avatar"
                  aria-hidden="true"
                >
                  {user.displayName.slice(0, 1).toUpperCase()}
                </span>

                <span className="nav-session__copy">
                  <strong>{user.displayName}</strong>
                  <small>
                    {user.role === "ADMIN"
                      ? "Administrador"
                      : "Estudiante"}
                  </small>
                </span>

                <button
                  type="button"
                  className="nav-session__logout"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-label={
                    isLoggingOut
                      ? "Cerrando sesión"
                      : "Cerrar sesión"
                  }
                  title={
                    isLoggingOut
                      ? "Cerrando sesión"
                      : "Cerrar sesión"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  </svg>
                </button>
              </div>
            ) : null}
          </nav>
        </div>
      </header>
    </>
  );
}