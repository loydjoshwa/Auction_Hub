import { useState } from "react";
import { useNavigate } from "react-router-dom";

function VerifyOTP() {
  const navigate = useNavigate();

  const registrationData = JSON.parse(
    sessionStorage.getItem("registrationData") || "null"
  );

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    if (!registrationData) {
      setError("Registration information not found. Please register again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: registrationData.email,
            otp: otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      setSuccess("Email verified successfully!");

      // Register user after OTP verification
      const registerResponse = await fetch(
        "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: registrationData.name,
            email: registrationData.email,
            password: registrationData.password,
          }),
        }
      );

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          registerData.message || "Registration failed"
        );
      }

      sessionStorage.removeItem("registrationData");

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
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

        <h2 style={styles.heading}>Verify Email</h2>

        <p style={styles.subtitle}>
          Enter the 6-digit OTP sent to:
        </p>

        <p style={styles.email}>
          {registrationData?.email || "Email not found"}
        </p>

        <form onSubmit={handleVerifyOTP}>
          <div style={styles.inputGroup}>
            <label>OTP</label>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
              maxLength={6}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          {success && <p style={styles.success}>{success}</p>}

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigate("/register")}
        >
          Back to Registration
        </button>
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
    marginBottom: "5px",
  },

  email: {
    fontWeight: "bold",
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

  success: {
    color: "green",
    fontSize: "14px",
    marginBottom: "15px",
  },

  backButton: {
    width: "100%",
    marginTop: "15px",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    cursor: "pointer",
  },
};

export default VerifyOTP;