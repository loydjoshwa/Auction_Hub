import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiService } from "../../services/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await apiService.forgotPassword(email);
      setSuccess("A reset OTP has been sent to your email address.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send reset OTP. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await apiService.resetPassword(email, otp, newPassword);
      setSuccess("Password reset successfully! Redirecting to Sign In...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-header">
          <span className="brand-badge">Auction Hub</span>
          <h1 className="brand-title">Reset Password</h1>
          <p className="brand-subtitle">
            {step === 1
              ? "Enter your registered email address to receive a 6-digit reset code"
              : `Enter the reset OTP sent to ${email}`}
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

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label className="form-label">Registered Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: "1rem" }}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Sending OTP...
                </>
              ) : (
                "Send Reset OTP"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
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

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: "1rem" }}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStep(1);
                setError("");
                setSuccess("");
              }}
              style={{ marginTop: "0.75rem", width: "100%" }}
            >
              Resend Code / Change Email
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: "1.75rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Remembered your password?{" "}
          <Link to="/login" className="btn-link">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
