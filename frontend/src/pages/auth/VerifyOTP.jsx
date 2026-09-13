import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiService } from "../../services/api";

function VerifyOTP() {
  const navigate = useNavigate();

  const [registrationData] = useState(() => {
    const dataStr = sessionStorage.getItem("registrationData");
    if (!dataStr) return null;
    try {
      return JSON.parse(dataStr);
    } catch {
      return null;
    }
  });

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(() => {
    const dataStr = sessionStorage.getItem("registrationData");
    if (!dataStr) {
      return "Registration information not found. Please register again.";
    }
    try {
      JSON.parse(dataStr);
      return "";
    } catch {
      return "Invalid registration session data. Please register again.";
    }
  });
  const [success, setSuccess] = useState("");

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    if (!registrationData || !registrationData.email) {
      setError("Registration information missing. Please go back and fill the registration form.");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Verify OTP code
      await apiService.verifyOTP(registrationData.email, otp);

      setSuccess("OTP verified! Finalizing registration...");

      // Step 2: Register account
      await apiService.register(
        registrationData.name,
        registrationData.email,
        registrationData.password
      );

      sessionStorage.removeItem("registrationData");
      setSuccess("Account created successfully! Redirecting to Login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.message || "OTP verification or registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!registrationData?.email) return;
    setError("");
    setSuccess("");
    setResending(true);

    try {
      await apiService.sendOTP(registrationData.email);
      setSuccess("A new OTP code has been sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-header">
          <span className="brand-badge">Auction Hub</span>
          <h1 className="brand-title">Verify Email</h1>
          <p className="brand-subtitle">
            Enter the 6-digit verification code sent to:
          </p>
          <p style={{ color: "#a5b4fc", fontWeight: "700", marginTop: "0.4rem", wordBreak: "break-all" }}>
            {registrationData?.email || "No email selected"}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOTP}>
          <div className="form-group">
            <label className="form-label">6-Digit OTP Code</label>
            <input
              type="text"
              className="form-input otp-input"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !registrationData}
            style={{ marginTop: "1rem" }}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Verifying...
              </>
            ) : (
              "Verify OTP & Register"
            )}
          </button>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResendOTP}
            disabled={resending || !registrationData?.email}
            style={{ fontSize: "0.85rem", padding: "0.6rem" }}
          >
            {resending ? "Sending..." : "Resend OTP Code"}
          </button>

          <Link
            to="/register"
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem", padding: "0.6rem", textDecoration: "none", textAlign: "center" }}
          >
            &larr; Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;