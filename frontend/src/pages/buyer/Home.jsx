import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Home() {
  const { user, isLoggedIn } = useAuth();

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Hero Banner Section */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
          padding: "4rem 2.5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          border: "1px solid var(--bg-card-border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "250px",
            height: "250px",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <span className="brand-badge" style={{ marginBottom: "1.25rem" }}>
          Welcome to
        </span>

        <h1
          style={{
            fontSize: "3.2rem",
            fontWeight: "800",
            letterSpacing: "-0.03em",
            marginBottom: "0.5rem",
            background: "linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Auction Hub
        </h1>

        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#a5b4fc",
            marginBottom: "1.5rem",
          }}
        >
          Online Auction Marketplace
        </h2>

        <p
          style={{
            maxWidth: "600px",
            margin: "0 auto 2.5rem auto",
            color: "var(--text-muted)",
            fontSize: "1.1rem",
            lineHeight: "1.6",
          }}
        >
          Experience real-time competitive bidding, verified listings, and secure transactions on the next-generation auction platform.
        </p>

        {isLoggedIn ? (
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
            <div className="alert alert-success" style={{ margin: 0, padding: "0.8rem 1.5rem" }}>
              <span>Hello, <strong>{user?.name || "Member"}</strong>! You are currently logged in.</span>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
              <Link to="/profile" className="btn btn-primary" style={{ width: "auto", padding: "0.85rem 2rem" }}>
                View Profile Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/login" className="btn btn-primary" style={{ width: "auto", padding: "0.85rem 2.2rem" }}>
              Sign In to Your Account
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ width: "auto", padding: "0.85rem 2.2rem" }}>
              Create New Account
            </Link>
          </div>
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginTop: "3rem",
        }}
      >
        <div className="card">
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#a5b4fc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            ⚡
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Real-Time Bidding
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
            Stay updated with live bid increments, instant notifications, and transparent countdowns.
          </p>
        </div>

        <div className="card">
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#fcd34d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            🛡️
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Secure Authentication
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
            Protected with OTP email verification, encrypted passwords, and stateless JWT sessions.
          </p>
        </div>

        <div className="card">
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#6ee7b7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            🏷️
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Curated Categories
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
            Browse through verified electronics, collectibles, vehicles, and luxury items.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
