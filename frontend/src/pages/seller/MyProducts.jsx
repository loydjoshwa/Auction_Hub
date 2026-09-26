import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";
import AddEditProductModal from "../../components/products/AddEditProductModal";
import PlaceAuctionModal from "../../components/products/PlaceAuctionModal";

function MyProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Place in Auction Modal State
  const [placeAuctionProduct, setPlaceAuctionProduct] = useState(null);
  const [savingAuction, setSavingAuction] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getMyProducts(token);
      setProducts(res.products || []);
    } catch (err) {
      setError(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
    setError("");
    setSuccessMsg("");
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
    setError("");
    setSuccessMsg("");
  };

  const handleSaveProduct = async (formData) => {
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      if (editingProduct) {
        await apiService.updateProduct(token, editingProduct.id, formData);
        setSuccessMsg("Product updated successfully!");
      } else {
        await apiService.createProduct(token, formData);
        setSuccessMsg("Product created successfully!");
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.message || "Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setError("");
    setSuccessMsg("");

    try {
      await apiService.deleteProduct(token, deletingProduct.id);
      setSuccessMsg("Product deleted successfully!");
      setDeletingProduct(null);
      fetchProducts();
    } catch (err) {
      setError(err.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenPlaceAuction = (prod) => {
    setPlaceAuctionProduct(prod);
    setError("");
    setSuccessMsg("");
  };

  const handlePlaceAuctionSubmit = async (auctionData) => {
    setSavingAuction(true);
    setError("");
    setSuccessMsg("");

    try {
      await apiService.createAuction(token, auctionData);
      setSuccessMsg("Product successfully placed in auction!");
      setPlaceAuctionProduct(null);
      fetchProducts();
    } catch (err) {
      setError(err.message || "Failed to place product in auction.");
    } finally {
      setSavingAuction(false);
    }
  };

  const getImageSrc = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem", maxWidth: "1200px" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 className="page-title" style={{ fontSize: "2rem", fontWeight: "700" }}>
            My Products
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Manage your items ready for auction
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn btn-primary"
          style={{ width: "auto", padding: "0.65rem 1.4rem" }}
        >
          + Add Product
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg("")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading your products...</p>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="empty-state-card">
          <div className="empty-state-icon">📦</div>
          <h2 className="empty-state-title">No products yet</h2>
          <p className="empty-state-desc">
            Add your first product and keep it ready for auction.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
            style={{ width: "auto", padding: "0.65rem 1.5rem", marginTop: "1rem" }}
          >
            + Add Product
          </button>
        </div>
      ) : (
        /* Products Grid */
        <div className="products-grid">
          {products.map((prod) => {
            const isInAuction = prod.status === "In Auction";

            return (
              <div key={prod.id} className="product-card">
                <div className="product-card-image-wrapper">
                  <img
                    src={getImageSrc(prod.imageUrl)}
                    alt={prod.name}
                    className="product-card-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/400x250?text=No+Image";
                    }}
                  />
                  <span
                    className={`status-badge ${
                      isInAuction ? "status-in-auction" : "status-ready"
                    }`}
                  >
                    {isInAuction ? "In Auction" : "Ready for Auction"}
                  </span>
                </div>

                <div className="product-card-content">
                  <h3 className="product-card-title">{prod.name}</h3>
                  <p className="product-card-desc">{prod.description}</p>

                  <div className="product-card-meta">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{formatDate(prod.createdAt)}</span>
                  </div>

                  <div className="product-card-actions">
                    <button
                      onClick={() => handleOpenEditModal(prod)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingProduct(prod)}
                      className="btn btn-danger btn-sm"
                      style={{ flex: 1 }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Place in Auction Button */}
                  <div style={{ marginTop: "0.75rem" }}>
                    {isInAuction ? (
                      <button
                        disabled
                        className="btn btn-disabled"
                        style={{
                          width: "100%",
                          opacity: 0.6,
                          cursor: "not-allowed",
                          fontSize: "0.85rem",
                        }}
                        title="This product is currently in an active auction."
                      >
                        In Auction
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenPlaceAuction(prod)}
                        className="btn btn-primary"
                        style={{
                          width: "100%",
                          padding: "0.45rem 1rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        Place in Auction
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AddEditProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
        saving={saving}
      />

      {/* Place in Auction Modal */}
      <PlaceAuctionModal
        isOpen={!!placeAuctionProduct}
        onClose={() => setPlaceAuctionProduct(null)}
        onPlaceAuction={handlePlaceAuctionSubmit}
        product={placeAuctionProduct}
        saving={savingAuction}
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-overlay" onClick={() => setDeletingProduct(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px", width: "100%" }}
          >
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: "var(--error)" }}>
                Delete Product
              </h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setDeletingProduct(null)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-main)", fontSize: "1rem" }}>
                Are you sure you want to delete <strong>"{deletingProduct.name}"</strong>?
              </p>
              
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeleting}
                style={{ width: "auto" }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{ width: "auto" }}
              >
                {isDeleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProducts;
