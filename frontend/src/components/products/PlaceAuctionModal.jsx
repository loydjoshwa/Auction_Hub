import { useState, useEffect } from "react";

function PlaceAuctionModal({ isOpen, onClose, onPlaceAuction, product, saving = false }) {
  const [startingPrice, setStartingPrice] = useState("");
  const [duration, setDuration] = useState("1d");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStartingPrice("");
      setDuration("1d");
      setError("");
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const priceNum = parseFloat(startingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Starting bid price must be a valid number greater than 0.");
      return;
    }

    if (!duration) {
      setError("Please select an auction duration.");
      return;
    }

    setError("");
    onPlaceAuction({
      productId: product.id,
      startingPrice: priceNum,
      duration: duration,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px", width: "100%" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Place Product in Auction</h2>
          <button type="button" className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            {/* Product Summary Header */}
            <div className="auction-product-summary">
              <img
                src={getImageSrc(product.imageUrl)}
                alt={product.name}
                className="auction-product-thumb"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/100x100?text=No+Image";
                }}
              />
              <div className="auction-product-details">
                <span className="auction-product-label">Selected Item</span>
                <h4 className="auction-product-name">{product.name}</h4>
              </div>
            </div>

            {/* Starting Bid Price */}
            <div className="form-group">
              <label htmlFor="starting-price" className="form-label">
                Starting Bid Price ($) <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input
                id="starting-price"
                type="number"
                step="any"
                min="0.01"
                className="form-input"
                placeholder="e.g. 150"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                disabled={saving}
                required
              />
            </div>

            {/* Auction Duration */}
            <div className="form-group">
              <label htmlFor="auction-duration" className="form-label">
                Auction Duration <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <select
                id="auction-duration"
                className="form-input"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={saving}
                style={{ cursor: "pointer" }}
              >
                <option value="1h">1 Hour</option>
                <option value="6h">6 Hours</option>
                <option value="12h">12 Hours</option>
                <option value="1d">1 Day</option>
                <option value="3d">3 Days</option>
                <option value="7d">7 Days</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
              style={{ width: "auto" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ width: "auto" }}
            >
              {saving ? "Placing Auction..." : "Place Auction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlaceAuctionModal;
