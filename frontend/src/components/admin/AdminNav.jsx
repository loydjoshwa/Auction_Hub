import { Link, useLocation } from "react-router-dom";

function AdminNav() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        overflowX: "auto",
        padding: "0.5rem",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid var(--bg-card-border)",
        borderRadius: "var(--radius-md)",
        marginBottom: "1.75rem",
      }}
    >
      <Link
        to="/admin"
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "var(--radius-sm)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: isActive("/admin") ? "#ffffff" : "var(--text-muted)",
          background: isActive("/admin") ? "var(--primary)" : "transparent",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        📊 Dashboard
      </Link>

      <Link
        to="/admin/users"
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "var(--radius-sm)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: isActive("/admin/users") ? "#ffffff" : "var(--text-muted)",
          background: isActive("/admin/users") ? "var(--primary)" : "transparent",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        👥 Manage Users
      </Link>

      <Link
        to="/admin/products"
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "var(--radius-sm)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: isActive("/admin/products") ? "#ffffff" : "var(--text-muted)",
          background: isActive("/admin/products") ? "var(--primary)" : "transparent",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        📦 Manage Products
      </Link>

      <Link
        to="/admin/auctions"
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "var(--radius-sm)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: isActive("/admin/auctions") ? "#ffffff" : "var(--text-muted)",
          background: isActive("/admin/auctions") ? "var(--primary)" : "transparent",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        🏷️ Manage Auctions
      </Link>

      <Link
        to="/admin/bids"
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "var(--radius-sm)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: isActive("/admin/bids") ? "#ffffff" : "var(--text-muted)",
          background: isActive("/admin/bids") ? "var(--primary)" : "transparent",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        🔨 Manage Bids
      </Link>

      <Link
        to="/admin/orders"
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "var(--radius-sm)",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontWeight: "600",
          color: isActive("/admin/orders") ? "#ffffff" : "var(--text-muted)",
          background: isActive("/admin/orders") ? "var(--primary)" : "transparent",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        🛒 Manage Orders
      </Link>
    </div>
  );
}

export default AdminNav;
