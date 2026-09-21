function Home() {
  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "3rem 1.5rem",
      }}
    >
      {/* Three Banner Layout */}
      <div
        className="home-page-banners"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.3fr 1fr",
          gap: "1.5rem",
          alignItems: "stretch",
        }}
      >
        {/* ================= LEFT - DISCOVER & BID ================= */}
        <div
          className="card"
          style={{
            minHeight: "360px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#a5b4fc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              marginBottom: "1.5rem",
            }}
          >
            🔨
          </div>

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "0.8rem",
            }}
          >
            Discover & Bid
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.95rem",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Explore unique products and place competitive bids on auctions
            you love.
          </p>
        </div>

        {/* ================= CENTER - AUCTION HUB ================= */}
        <div
          className="card"
          style={{
            minHeight: "360px",
            padding: "2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",

            background:
              "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",

            border: "1px solid var(--bg-card-border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "fit-content",
              padding: "0.4rem 0.8rem",
              marginBottom: "1.2rem",
              borderRadius: "999px",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#a5b4fc",
              fontSize: "0.75rem",
              fontWeight: "700",
              letterSpacing: "0.08em",
            }}
          >
            AUCTION HUB
          </span>

          <h1
            style={{
              fontSize: "2.7rem",
              fontWeight: "800",
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
              background:
                "linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Auction Hub
          </h1>

          <p
            style={{
              maxWidth: "450px",
              color: "var(--text-muted)",
              fontSize: "1rem",
              lineHeight: "1.6",
              marginBottom: "1.8rem",
            }}
          >
            Discover amazing products, place your bid, and win your deal.
          </p>

          <button
            className="btn btn-primary"
            style={{
              width: "fit-content",
              padding: "0.8rem 1.7rem",
            }}
          >
            Explore Auctions
          </button>
        </div>

        {/* ================= RIGHT - BUY & SELL ================= */}
        <div
          className="card"
          style={{
            minHeight: "360px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#6ee7b7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              marginBottom: "1.5rem",
            }}
          >
            🛍️
          </div>

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "0.8rem",
            }}
          >
            Buy & Sell
          </h2>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.95rem",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Find great deals or create your own listings and sell products
            through Auction Hub.
          </p>
        </div>
      </div>

      {/* ================= RESPONSIVE DESIGN ================= */}
      <style>
        {`
          @media (max-width: 900px) {
            .home-page-banners {
              grid-template-columns: 1fr 1fr !important;
            }

            .home-page-banners > div:nth-child(2) {
              grid-column: 1 / -1;
              order: -1;
            }
          }

          @media (max-width: 600px) {
            .home-page-banners {
              grid-template-columns: 1fr !important;
            }

            .home-page-banners > div:nth-child(2) {
              grid-column: auto;
              order: 0;
            }
          }
        `}
      </style>
    </div>
  );
}

export default Home;