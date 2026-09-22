import { useState, useEffect } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function AddEditProductModal({ isOpen, onClose, onSave, product = null, saving = false }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDescription(product.description || "");
      setImageFile(null);
      // Construct image preview URL
      const fullUrl = product.imageUrl?.startsWith("http")
        ? product.imageUrl
        : `http://localhost:8080${product.imageUrl}`;
      setImagePreview(fullUrl || "");
    } else {
      setName("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
    }
    setError("");
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError("Invalid file type. Please select a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image file size must be less than 5MB.");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      setError("Product Name is required and cannot be empty.");
      return;
    }

    if (!trimmedDesc) {
      setError("Description is required and cannot be empty.");
      return;
    }

    if (!product && !imageFile) {
      setError("Product Image is required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", trimmedName);
    formData.append("description", trimmedDesc);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", width: "100%" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">{product ? "Edit Product" : "Add New Product"}</h2>
          <button type="button" className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="product-name" className="form-label">
                Product Name <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input
                id="product-name"
                type="text"
                className="form-input"
                placeholder="e.g. Vintage Mechanical Watch"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="product-description" className="form-label">
                Description <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <textarea
                id="product-description"
                className="form-input"
                rows="4"
                placeholder="Describe your product details, condition, features..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                style={{ resize: "vertical" }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Product Image {!product && <span style={{ color: "var(--error)" }}>*</span>}
              </label>

              {imagePreview ? (
                <div className="image-preview-container">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-preview"
                  />
                  <div className="image-preview-actions">
                    <label htmlFor="product-image" className="btn btn-secondary btn-sm" style={{ cursor: "pointer", width: "auto" }}>
                      Change Image
                    </label>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleRemoveImage}
                      disabled={saving}
                      style={{ width: "auto" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="file-dropzone">
                  <input
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={saving}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="product-image" className="file-dropzone-label">
                    <div className="upload-icon">📷</div>
                    <span className="upload-text">Click to select an image</span>
                    <span className="upload-hint">JPG, JPEG, PNG, WEBP (Max 5MB)</span>
                  </label>
                </div>
              )}
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
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditProductModal;
