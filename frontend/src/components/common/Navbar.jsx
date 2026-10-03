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
                <li>
                  <Link
                    to="/admin/products"
                    className={`nav-link ${isActive("/admin/products") ? "active" : ""}`}
                  >
                    Manage Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/auctions"
                    className={`nav-link ${isActive("/admin/auctions") ? "active" : ""}`}
                  >
                    Manage Auctions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/bids"
                    className={`nav-link ${isActive("/admin/bids") ? "active" : ""}`}
                  >
                    Manage Bids
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/orders"
                    className={`nav-link ${isActive("/admin/orders") ? "active" : ""}`}
                  >
                    Manage Orders
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/reports"
                    className={`nav-link ${isActive("/admin/reports") ? "active" : ""}`}
                  >
                    Reports
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
                  <>
                    <li>
                      <Link
                        to="/auctions"
                        className={`nav-link ${isActive("/auctions") ? "active" : ""}`}
                      >
                        Auctions
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/my-bids"
                        className={`nav-link ${isActive("/my-bids") ? "active" : ""}`}
                      >
                        My Bids
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/won-auctions"
                        className={`nav-link ${isActive("/won-auctions") ? "active" : ""}`}
                      >
                        Won Auctions
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/my-auctions"
                        className={`nav-link ${isActive("/my-auctions") ? "active" : ""}`}
                      >
                        My Auctions
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/products"
                        className={`nav-link ${isActive("/products") ? "active" : ""}`}
                      >
                        My Products
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/my-orders"
                        className={`nav-link ${isActive("/my-orders") ? "active" : ""}`}
                      >
                        My Orders
                      </Link>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>
        </nav>

        <div className="nav-user-info">
          {isLoggedIn ? (
            <>
              {isAdmin ? (
                <Link to="/admin/profile" style={{ textDecoration: "none" }}>
                  <div
                    className="user-avatar-badge"
                    style={isActive("/admin/profile") ? { borderColor: "rgba(236, 72, 153, 0.5)", background: "rgba(236, 72, 153, 0.1)" } : {}}
                  >
                    <div className="avatar-circle" style={{ background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)" }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                    </div>
                    <span className="user-display-name">{user?.name || "Admin"}</span>
                  </div>
                </Link>
              ) : (
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
