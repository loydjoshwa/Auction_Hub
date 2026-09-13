function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div>
          <strong style={{ color: "var(--text-main)" }}>Auction Hub</strong> &mdash; Online Auction Marketplace Platform
        </div>
        <div>
          &copy; {new Date().getFullYear()} Auction Hub. College Project Presentation.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
