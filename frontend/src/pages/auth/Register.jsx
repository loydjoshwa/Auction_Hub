import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      // Save registration details temporarily
      sessionStorage.setItem(
        "registrationData",
        JSON.stringify({
          name,
          email,
          password,
        })
      );

      navigate("/verify-otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Auction Hub</h1>

        <h2 style={styles.heading}>Create Account</h2>

        <p style={styles.subtitle}>
          Create your account to start buying and selling.
        </p>

        <form onSubmit={handleSendOTP}>
          <div style={styles.inputGroup}>
            <label>Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Sending OTP..." : "Continue"}
          </button>
        </form>

        <p style={styles.bottomText}>
          Already have an account?{" "}
          <button
            type="button"
            style={styles.link}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "400px",
    padding: "40px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  },

  title: {
    textAlign: "center",
    marginBottom: "25px",
  },

  heading: {
    marginBottom: "8px",
  },

  subtitle: {
    color: "#666",
    marginBottom: "25px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "18px",
    gap: "7px",
  },

  button: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#222",
    color: "#ffffff",
    fontSize: "16px",
    cursor: "pointer",
  },

  error: {
    color: "red",
    fontSize: "14px",
    marginBottom: "15px",
  },

  bottomText: {
    textAlign: "center",
    marginTop: "20px",
    color: "#666",
  },

  link: {
    border: "none",
    background: "none",
    color: "#0066cc",
    cursor: "pointer",
    fontSize: "15px",
  },
};

export default Register;