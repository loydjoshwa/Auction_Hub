const API_BASE_URL = "http://localhost:8080";

/**
 * Generic helper for handling fetch requests and parsing API errors consistently.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
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
};

export default apiService;
