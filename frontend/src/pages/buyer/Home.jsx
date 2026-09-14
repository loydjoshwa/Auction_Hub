import { useAuth } from "../../context/AuthContext";

function Home() {
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      {/* Compact Hero Section */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
          padding: "3rem 2rem",
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

        <h1
          style={{
            fontSize: "2.8rem",
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
            fontSize: "1.35rem",
            fontWeight: "600",
            color: "#a5b4fc",
            marginBottom: "1.25rem",
          }}
        >
          Discover Amazing Products. Place Your Bid. Win Your Deal.
        </h2>

        <p
          style={{
            maxWidth: "640px",
            margin: "0 auto 2rem auto",
            color: "var(--text-muted)",
            fontSize: "1.05rem",
            lineHeight: "1.6",
          }}
        >
          Explore exciting auctions, discover unique products, and compete with other bidders to get the items you want.
        </p>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            className="btn btn-primary"
            style={{ width: "auto", padding: "0.85rem 2.2rem" }}
          >
            Explore Auctions
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
          marginTop: "2.5rem",
          maxWidth: "850px",
          margin: "2.5rem auto 0 auto",
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
            🔨
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Discover & Bid
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
            Explore a wide range of products and place competitive bids on auctions you love.
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
            🛍️
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            Buy & Sell
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
            Find great deals as a buyer or create your own listings and sell products through Auction Hub.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
