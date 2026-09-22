import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const isAdmin = isLoggedIn && user?.role === "admin";

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to={isAdmin ? "/admin" : "/"} className="nav-brand">
          <div className="nav-logo-icon">A</div>
          <span className="nav-brand-text">Auction Hub</span>
        </Link>

        <nav>
          <ul className="nav-links">
            {isAdmin ? (
              <>
                <li>
                  <Link
                    to="/admin"
                    className={`nav-link ${isActive("/admin") ? "active" : ""}`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/users"
                    className={`nav-link ${isActive("/admin/users") ? "active" : ""}`}
                  >
                    Manage Users
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/"
                    className={`nav-link ${isActive("/") ? "active" : ""}`}
                  >
                    Home
                  </Link>
                </li>
                {isLoggedIn && (
                  <li>
                    <Link
                      to="/products"
                      className={`nav-link ${isActive("/products") ? "active" : ""}`}
                    >
                      My Products
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </nav>

        <div className="nav-user-info">
          {isLoggedIn ? (
            <>
              {!isAdmin && (
                <Link to="/profile" style={{ textDecoration: "none" }}>
                  <div className="user-avatar-badge">
                    <div className="avatar-circle">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="user-display-name">{user?.name || "User"}</span>
                  </div>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.875rem", width: "auto" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-secondary"
                style={{ padding: "0.4rem 1rem", fontSize: "0.875rem", width: "auto" }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ padding: "0.4rem 1.1rem", fontSize: "0.875rem", width: "auto" }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
