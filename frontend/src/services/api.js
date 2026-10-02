const API_BASE_URL = "http://localhost:8080";

/**
 * Generic helper for handling fetch requests and parsing API errors consistently.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      // Network error or server offline
      err.message = err.message === "Failed to fetch" 
        ? "Unable to connect to backend server (http://localhost:8080)"
        : err.message;
    }
    throw err;
  }
}

export const apiService = {
  /**
   * Request OTP code to be sent to user's email.
   * POST /api/auth/send-otp
   */
  async sendOTP(email) {
    return request("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Verify the 6-digit OTP code.
   * POST /api/auth/verify-otp
   */
  async verifyOTP(email, otp) {
    return request("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  /**
   * Register user profile after OTP verification.
   * POST /api/auth/register
   */
  async register(name, email, password) {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  /**
   * Login user with email & password.
   * POST /api/auth/login
   */
  async login(email, password) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Get user profile details using JWT bearer token.
   * GET /api/users/profile
   */
  async getProfile(token) {
    return request("/api/users/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Update user profile name using JWT bearer token.
   * PUT /api/users/profile
   */
  async updateProfile(token, name) {
    return request("/api/users/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
  },


  /**
   * Request OTP code for password reset.
   * POST /api/auth/forgot-password
   */
  async forgotPassword(email) {
    return request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Reset user password using email, OTP, and new password.
   * POST /api/auth/reset-password
   */
  async resetPassword(email, otp, password) {
    return request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, password }),
    });
  },

  /**
   * Fetch admin dashboard analytics.
   * GET /api/admin/dashboard
   */
  async getAdminDashboard(token) {
    return request("/api/admin/dashboard", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch users with search and status query filtering for admin.
   * GET /api/admin/users?search=...&status=...
   */
  async getAdminUsers(token, search = "", status = "") {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request(`/api/admin/users${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Block user by ID.
   * PATCH /api/admin/users/:id/block
   */
  async blockUser(token, userId) {
    return request(`/api/admin/users/${userId}/block`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Unblock user by ID.
   * PATCH /api/admin/users/:id/unblock
   */
  async unblockUser(token, userId) {
    return request(`/api/admin/users/${userId}/unblock`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch products for admin.
   * GET /api/admin/products
   */
  async getAdminProducts(token, search = "", status = "", inAuction = "", sort = "") {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (inAuction) params.append("inAuction", inAuction);
    if (sort) params.append("sort", sort);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request(`/api/admin/products${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Delete product by ID for admin with mandatory reason.
   * DELETE /api/admin/products/:id
   */
  async deleteAdminProduct(token, productId, reason = "") {
    return request(`/api/admin/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Fetch auctions for admin.
   * GET /api/admin/auctions
   */
  async getAdminAuctions(token, search = "", status = "", sort = "") {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (sort) params.append("sort", sort);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request(`/api/admin/auctions${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Cancel auction by ID for admin.
   * PATCH /api/admin/auctions/:id/cancel
   */
  async cancelAdminAuction(token, auctionId) {
    return request(`/api/admin/auctions/${auctionId}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch bids for admin.
   * GET /api/admin/bids
   */
  async getAdminBids(token, search = "", auctionId = "", bidderId = "", sort = "") {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (auctionId) params.append("auctionId", auctionId);
    if (bidderId) params.append("bidderId", bidderId);
    if (sort) params.append("sort", sort);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request(`/api/admin/bids${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch orders for admin.
   * GET /api/admin/orders
   */
  async getAdminOrders(token, search = "", status = "", sort = "") {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (sort) params.append("sort", sort);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return request(`/api/admin/orders${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch single order details for admin.
   * GET /api/admin/orders/:id
   */
  async getAdminOrderById(token, orderId) {
    return request(`/api/admin/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch products belonging to the logged in user.
   * GET /api/products/my
   */
  async getMyProducts(token) {
    return request("/api/products/my", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Create a new product.
   * POST /api/products
   */
  async createProduct(token, formData) {
    return request("/api/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  },

  /**
   * Fetch a single product by ID.
   * GET /api/products/:id
   */
  async getProductById(token, id) {
    return request(`/api/products/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Update an existing product.
   * PUT /api/products/:id
   */
  async updateProduct(token, id, formData) {
    return request(`/api/products/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  },

  /**
   * Delete a product by ID.
   * DELETE /api/products/:id
   */
  async deleteProduct(token, id) {
    return request(`/api/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch all active/public auctions.
   * GET /api/auctions
   */
  async getAuctions(token) {
    return request("/api/auctions", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Create an auction for a product.
   * POST /api/auctions
   */
  async createAuction(token, { productId, startingPrice, duration }) {
    return request("/api/auctions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
        starting_price: parseFloat(startingPrice),
        duration: duration,
      }),
    });
  },

  /**
   * Fetch a single auction by ID.
   * GET /api/auctions/:id
   */
  async getAuctionById(token, id) {
    return request(`/api/auctions/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Place a bid on an active auction.
   * POST /api/bids
   */
  async placeBid(token, { auctionId, amount }) {
    return request("/api/bids", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        auction_id: parseInt(auctionId, 10),
        amount: parseFloat(amount),
      }),
    });
  },

  /**
   * Fetch bid history for an auction.
   * GET /api/bids/auction/:auctionId
   */
  async getAuctionBids(token, auctionId) {
    return request(`/api/bids/auction/${auctionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * End an active auction manually (Seller only).
   * PATCH /api/auctions/:id/end
   */
  async endAuction(token, auctionId) {
    return request(`/api/auctions/${auctionId}/end`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch all auctions where the authenticated user placed bids.
   * GET /api/bids/my
   */
  async getMyBids(token) {
    return request("/api/bids/my", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch all ended auctions won by the logged-in buyer.
   * GET /api/auctions/won
   */
  async getWonAuctions(token) {
    return request("/api/auctions/won", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch all auctions created by the logged-in seller.
   * GET /api/auctions/seller
   */
  async getMyAuctions(token) {
    return request("/api/auctions/seller", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch all user orders.
   * GET /api/orders
   */
  async getUserOrders(token) {
    return request("/api/orders", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch user orders separated into buyerOrders and sellerOrders.
   * GET /api/orders/my-orders
   */
  async getMyOrders(token) {
    return request("/api/orders/my-orders", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Fetch a single order by ID.
   * GET /api/orders/:id
   */
  async getOrderById(token, id) {
    return request(`/api/orders/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Update delivery address for an order (Buyer only, before Shipped).
   * PUT /api/orders/:id/address
   */
  async updateDeliveryAddress(token, id, address) {
    return request(`/api/orders/${id}/address`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ deliveryAddress: address }),
    });
  },

  /**
   * Mark order as Packed (Admin/Seller).
   * PATCH /api/orders/:id/pack
   */
  async markOrderPacked(token, id) {
    return request(`/api/orders/${id}/pack`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Mark order as Shipped (Admin/Seller).
   * PATCH /api/orders/:id/ship
   */
  async markOrderShipped(token, id) {
    return request(`/api/orders/${id}/ship`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Mark order as Delivered (Buyer only).
   * PATCH /api/orders/:id/deliver
   */
  async markOrderDelivered(token, id) {
    return request(`/api/orders/${id}/deliver`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Update order status with mandatory reason (Admin).
   * PUT /api/orders/:id/status
   */
  async updateOrderStatus(token, id, status, reason = "") {
    return request(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, reason }),
    });
  },

  /**
   * Get or create a private buyer-seller conversation for an auction.
   * GET /api/chat/auction/:auctionId
   */
  async getChatConversation(token, auctionId) {
    return request(`/api/chat/auction/${auctionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Get all messages for a conversation.
   * GET /api/chat/conversation/:id/messages
   */
  async getChatMessages(token, conversationId) {
    return request(`/api/chat/conversation/${conversationId}/messages`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Send a chat message in a conversation.
   * POST /api/chat/conversation/:id/messages
   */
  async sendChatMessage(token, conversationId, message) {
    return request(`/api/chat/conversation/${conversationId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
  },
};

export default apiService;
