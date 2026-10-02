import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/api";

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");

  // Address Form State
  const [address, setAddress] = useState("");
  const [updatingAddress, setUpdatingAddress] = useState(false);

  // Status Action Loading State
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Admin Control State
  const [adminStatus, setAdminStatus] = useState("Pending Address");
  const [adminReason, setAdminReason] = useState("");
  const [adminReasonErr, setAdminReasonErr] = useState("");

  // Chat State
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getOrderById(token, id);
      if (res.order) {
        setOrder(res.order);
        setAddress(res.order.deliveryAddress || "");
        setAdminStatus(res.order.status || "Pending Address");
      } else {
        setError("Order details not found.");
      }
    } catch (err) {
      setError(err.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchOrder();
    }
  }, [token, id]);

  useEffect(() => {
    if (order?.status) {
      setAdminStatus(order.status);
    }
  }, [order?.status]);

  // Load chat messages when chat drawer opens
  const fetchChat = async () => {
    if (!order?.auctionId) return;
    try {
      const convRes = await apiService.getChatConversation(token, order.auctionId);
      if (convRes.conversation) {
        setConversation(convRes.conversation);
        const msgRes = await apiService.getChatMessages(token, convRes.conversation.id);
        setMessages(msgRes.messages || []);
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  useEffect(() => {
    if (chatOpen && order?.auctionId) {
      fetchChat();
      const interval = setInterval(fetchChat, 3000); // poll chat messages every 3s
      return () => clearInterval(interval);
    }
  }, [chatOpen, order?.auctionId]);

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    setUpdatingAddress(true);
    setActionMsg("");
    setActionErr("");

    try {
      const res = await apiService.updateDeliveryAddress(token, order.id, address.trim());
      setActionMsg("🎉 Delivery address saved successfully!");
      if (res.order) setOrder(res.order);
    } catch (err) {
      setActionErr(err.message || "Failed to update delivery address.");
    } finally {
      setUpdatingAddress(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!window.confirm("Confirm that you have received the item and want to mark the order as Delivered?")) {
      return;
    }
    setUpdatingStatus(true);
    setActionMsg("");
    setActionErr("");

    try {
      const res = await apiService.markOrderDelivered(token, order.id);
      setActionMsg("✅ Order marked as Delivered!");
      if (res.order) setOrder(res.order);
    } catch (err) {
      setActionErr(err.message || "Failed to mark order as Delivered.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkPacked = async () => {
    setUpdatingStatus(true);
    setActionMsg("");
    setActionErr("");

    try {
      const res = await apiService.markOrderPacked(token, order.id);
      setActionMsg("📦 Order marked as Packed!");
      if (res.order) setOrder(res.order);
    } catch (err) {
      setActionErr(err.message || "Failed to mark order as Packed.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkShipped = async () => {
    setUpdatingStatus(true);
    setActionMsg("");
    setActionErr("");

    try {
      const res = await apiService.markOrderShipped(token, order.id);
      setActionMsg("🚚 Order marked as Shipped!");
      if (res.order) setOrder(res.order);
    } catch (err) {
      setActionErr(err.message || "Failed to mark order as Shipped.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAdminStatusUpdate = async (e) => {
    e.preventDefault();
    if (!adminReason.trim()) {
      setAdminReasonErr("Please provide a mandatory reason for updating the order status.");
      return;
    }

    setUpdatingStatus(true);
    setActionMsg("");
    setActionErr("");
    setAdminReasonErr("");

    try {
      const res = await apiService.updateOrderStatus(token, order.id, adminStatus, adminReason.trim());
      setActionMsg(`✅ Order status updated to "${adminStatus}" successfully!`);
      if (res.order) {
        setOrder(res.order);
        setAdminReason("");
      }
    } catch (err) {
      setActionErr(err.message || "Failed to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    setSendingMsg(true);
    try {
      await apiService.sendChatMessage(token, conversation.id, newMessage.trim());
      setNewMessage("");
      fetchChat();
    } catch (err) {
      alert(err.message || "Failed to send message.");
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "3rem 1.5rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto" }}></div>
        <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: "3rem 1.5rem", maxWidth: "800px", margin: "0 auto" }}>
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <span>{error || "Order not found."}</span>
        </div>
        <Link to={user?.role === "admin" ? "/admin/orders" : "/my-orders"} className="btn btn-secondary" style={{ display: "inline-flex", width: "auto" }}>
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const isBuyer = user && (user.id === order.buyerId || user.id === order.buyer?.id);
  const isSeller = user && (user.id === order.sellerId || user.id === order.seller?.id);
  const isAdmin = user && user.role === "admin";

  const isAddressLocked = order.status === "Shipped" || order.status === "Delivered";

  const title = order.auction?.title || order.auction?.product?.name || "Product Item";
  const imageUrl = order.auction?.product?.imageUrl || "";

  // Progress Stepper Order
  const steps = ["Pending Address", "Address Added", "Packed", "Shipped", "Delivered"];
  const currentStepIndex = steps.indexOf(order.status) !== -1 ? steps.indexOf(order.status) : 0;

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem", maxWidth: "1050px", margin: "0 auto" }}>
      {/* Top Breadcrumb */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{ width: "auto", padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
        >
          ← Back
        </button>

        <span
          className="badge"
          style={{
            background: order.status === "Delivered" ? "rgba(16, 185, 129, 0.15)" : order.status === "Cancelled" ? "rgba(239, 68, 68, 0.15)" : "rgba(99, 102, 241, 0.15)",
            color: order.status === "Delivered" ? "#34d399" : order.status === "Cancelled" ? "#f87171" : "#a5b4fc",
            border: `1px solid ${order.status === "Delivered" ? "rgba(16, 185, 129, 0.3)" : order.status === "Cancelled" ? "rgba(239, 68, 68, 0.3)" : "rgba(99, 102, 241, 0.3)"}`,
            padding: "0.4rem 0.9rem",
            fontSize: "0.85rem",
            fontWeight: "700",
          }}
        >
          Order Status • {order.status}
        </span>
      </div>

      {actionMsg && (
        <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
          <span>{actionMsg}</span>
        </div>
      )}

      {actionErr && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <span>{actionErr}</span>
        </div>
      )}

      {/* Main Order Card */}
      <div className="card" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "2rem", alignItems: "start" }}>
          {/* Left: Product & Pricing */}
          <div>
            {imageUrl && (
              <img
                src={imageUrl.startsWith("http") ? imageUrl : `http://localhost:8080${imageUrl}`}
                alt={title}
                style={{ width: "100%", height: "220px", objectFit: "cover", borderRadius: "var(--radius-md)", marginBottom: "1rem", background: "rgba(15, 23, 42, 0.8)" }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            )}
            <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.5rem" }}>
              {title}
            </h2>
            <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--accent)", marginBottom: "1rem" }}>
              ₹{order.finalAmount?.toLocaleString("en-IN")}
            </div>

            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span>👤 Seller: <strong style={{ color: "var(--text-main)" }}>{order.seller?.name || "Seller"}</strong></span>
              <span>🛒 Buyer: <strong style={{ color: "var(--text-main)" }}>{order.buyer?.name || "Buyer"}</strong></span>
            </div>
          </div>

          {/* Right: Order Stepper & Address */}
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1.25rem" }}>
              Order Progress Tracking
            </h3>

            {/* Stepper Progress */}
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: "2rem" }}>
              {steps.map((stepName, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={stepName} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, textAlign: "center", position: "relative", zIndex: 2 }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: isCompleted ? "var(--primary)" : "rgba(255, 255, 255, 0.1)",
                        color: isCompleted ? "#ffffff" : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        fontSize: "0.85rem",
                        boxShadow: isCurrent ? "0 0 12px rgba(99, 102, 241, 0.6)" : "none",
                        marginBottom: "0.4rem",
                      }}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: isCurrent ? "700" : "500", color: isCurrent ? "var(--primary)" : "var(--text-muted)" }}>
                      {stepName}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Address Management Section */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.025)",
                border: "1px solid var(--bg-card-border)",
                borderRadius: "var(--radius-md)",
                padding: "1.25rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                  Delivery Address {isAddressLocked && "🔒 (Locked)"}
                </h4>
              </div>

              {isBuyer && !isAddressLocked ? (
                <form onSubmit={handleSaveAddress}>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full shipping address with pincode..."
                    className="form-control"
                    style={{ width: "100%", marginBottom: "0.75rem", resize: "vertical" }}
                    disabled={updatingAddress}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingAddress}
                    style={{ width: "auto", padding: "0.45rem 1.1rem", fontSize: "0.85rem" }}
                  >
                    {updatingAddress ? "Saving..." : order.deliveryAddress ? "Update Address" : "Add Address"}
                  </button>
                </form>
              ) : (
                <p style={{ color: "var(--text-main)", fontSize: "0.925rem", lineHeight: "1.5", whiteSpace: "pre-line", margin: 0 }}>
                  {order.deliveryAddress || "No delivery address provided yet."}
                </p>
              )}
            </div>

            {/* Admin Progress Control */}
            {isAdmin && (
              <div
                style={{
                  background: "rgba(99, 102, 241, 0.05)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#a5b4fc", marginBottom: "0.75rem" }}>
                  ⚙️ Admin Order Progress Management
                </h4>
                <form onSubmit={handleAdminStatusUpdate}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                        New Status
                      </label>
                      <select
                        className="form-input"
                        value={adminStatus}
                        onChange={(e) => setAdminStatus(e.target.value)}
                        style={{ width: "100%", padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                      >
                        <option value="Pending Address">Pending Address</option>
                        <option value="Address Added">Address Added</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                        Reason for Status Change <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter mandatory reason..."
                        value={adminReason}
                        onChange={(e) => {
                          setAdminReason(e.target.value);
                          if (e.target.value.trim()) setAdminReasonErr("");
                        }}
                        style={{ width: "100%", padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
                      />
                    </div>
                  </div>

                  {adminReasonErr && (
                    <div style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                      {adminReasonErr}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingStatus}
                    style={{ width: "auto", padding: "0.4rem 1.1rem", fontSize: "0.825rem" }}
                  >
                    {updatingStatus ? "Updating Status..." : "Update Status"}
                  </button>
                </form>
              </div>
            )}

            {/* Role Action Controls */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {/* Buyer Action: Mark as Delivered when Shipped */}
              {isBuyer && order.status === "Shipped" && (
                <button
                  onClick={handleMarkDelivered}
                  disabled={updatingStatus}
                  className="btn btn-primary"
                  style={{ width: "auto", padding: "0.6rem 1.4rem" }}
                >
                  {updatingStatus ? "Updating..." : "✅ Mark as Delivered"}
                </button>
              )}

              {/* Seller Action: Mark Packed / Shipped */}
              {isSeller && (order.status === "Address Added" || order.status === "Pending Address") && (
                <button
                  onClick={handleMarkPacked}
                  disabled={updatingStatus}
                  className="btn btn-primary"
                  style={{ width: "auto" }}
                >
                  {updatingStatus ? "Updating..." : "📦 Mark as Packed"}
                </button>
              )}

              {isSeller && order.status === "Packed" && (
                <button
                  onClick={handleMarkShipped}
                  disabled={updatingStatus}
                  className="btn btn-primary"
                  style={{ width: "auto" }}
                >
                  {updatingStatus ? "Updating..." : "🚚 Mark as Shipped"}
                </button>
              )}

              {/* Live Chat Button for Buyer and Seller */}
              {(isBuyer || isSeller) && (
                <button
                  onClick={() => {
                    setChatOpen((prev) => !prev);
                    if (!chatOpen) fetchChat();
                  }}
                  className="btn btn-secondary"
                  style={{ width: "auto" }}
                >
                  💬 {chatOpen ? "Close Chat" : isBuyer ? "Chat with Seller" : "Chat with Buyer"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Tracking History Section */}
      {order.trackingHistory && order.trackingHistory.length > 0 && (
        <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "1rem" }}>
            📋 Order Tracking History
          </h3>
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--bg-card-border)" }}>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Updated By</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Reason / Note</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {order.trackingHistory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        className="badge"
                        style={{
                          background: item.status === "Delivered" ? "rgba(16, 185, 129, 0.15)" : item.status === "Cancelled" ? "rgba(239, 68, 68, 0.15)" : "rgba(99, 102, 241, 0.15)",
                          color: item.status === "Delivered" ? "#34d399" : item.status === "Cancelled" ? "#f87171" : "#a5b4fc",
                          border: `1px solid ${item.status === "Delivered" ? "rgba(16, 185, 129, 0.3)" : item.status === "Cancelled" ? "rgba(239, 68, 68, 0.3)" : "rgba(99, 102, 241, 0.3)"}`,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: "600", color: "var(--text-main)" }}>
                      {item.updatedBy || "System"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>
                      {item.reason || "-"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-dim)", fontSize: "0.825rem" }}>
                      {new Date(item.createdAt).toLocaleString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Chat Drawer Section */}
      {chatOpen && (
        <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--primary-light)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
              💬 Direct Messages ({isBuyer ? `Seller: ${order.seller?.name || "Seller"}` : `Buyer: ${order.buyer?.name || "Buyer"}`})
            </h3>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>
              &times;
            </button>
          </div>

          {/* Messages Window */}
          <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "var(--radius-md)", padding: "1rem", height: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
            {messages.length === 0 ? (
              <p style={{ color: "var(--text-dim)", textAlign: "center", margin: "auto" }}>
                No messages yet. Send a message to start communicating!
              </p>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === user?.id;
                return (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        padding: "0.6rem 0.9rem",
                        borderRadius: "12px",
                        maxWidth: "70%",
                        fontSize: "0.9rem",
                        background: isMe ? "var(--primary)" : "rgba(255, 255, 255, 0.08)",
                        color: isMe ? "#ffffff" : "var(--text-main)",
                      }}
                    >
                      {m.message}
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                      {m.sender?.name || (isMe ? "You" : "Other")}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="form-control"
              style={{ flex: 1 }}
              disabled={sendingMsg}
            />
            <button type="submit" className="btn btn-primary" disabled={sendingMsg} style={{ width: "auto" }}>
              {sendingMsg ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default OrderDetails;
