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

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="nav-brand">
          <div className="nav-logo-icon">AH</div>
          <span className="nav-brand-text">Auction Hub</span>
        </Link>

        <nav>
          <ul className="nav-links">
            <li>
              <Link
                to="/"
                className={`nav-link ${isActive("/") ? "active" : ""}`}
              >
                Home
              </Link>
            </li>
          </ul>
        </nav>

        <div className="nav-user-info">
          {isLoggedIn ? (
            <>
              <Link to="/profile" style={{ textDecoration: "none" }}>
                <div className="user-avatar-badge">
                  <div className="avatar-circle">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="user-display-name">{user?.name || "User"}</span>
                </div>
              </Link>

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
