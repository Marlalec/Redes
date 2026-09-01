import { useState } from "react";
import { Link, NavLink } from "react-router";

const navigation = [
  { to: "/modelo-osi", label: "Modelo OSI" },
  { to: "/protocolos", label: "Protocolos" },
  { to: "/puertos", label: "Puertos" },
  { to: "/osi-en-desarrollo", label: "OSI en desarrollo" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="navbar">
        <div className="navbar__inner page-container">
          <Link className="brand" to="/" onClick={closeMenu} aria-label="OSI Dev Explorer, inicio">
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
                  `nav-links__item${isActive ? " nav-links__item--active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}

