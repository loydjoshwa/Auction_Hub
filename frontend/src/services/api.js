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
};

export default apiService;
