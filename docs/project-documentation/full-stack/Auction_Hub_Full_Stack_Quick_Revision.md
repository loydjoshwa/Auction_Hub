# Auction Hub - Full-Stack Quick Revision & Interview Cheat Sheet

> **Document Type:** Rapid-Fire Revision Guide & Interview Defense Cheat Sheet  
> **Target Audience:** College Project Viva, Technical Interviews, and Architecture Code Defense  
> **Source Verification:** Cross-verified against React 19 Frontend and Go 1.26 Backend source code.

---

## Cross-Reference Links

- **Full-Stack Complete Documentation:** [Auction_Hub_Full_Stack_Complete_Documentation.md](./Auction_Hub_Full_Stack_Complete_Documentation.md)
- **Frontend Complete Documentation:** [Frontend Complete Documentation](../frontend/Auction_Hub_Frontend_Documentation.md)
- **Frontend Quick Revision Guide:** [Frontend Quick Revision Guide](../frontend/Auction_Hub_Frontend_Quick_Revision.md)
- **Backend Complete Documentation:** [Backend Complete Documentation](../backend/Auction_Hub_Backend_Documentation.md)
- **Backend Quick Revision Guide:** [Backend Quick Revision Guide](../backend/Auction_Hub_Backend_Quick_Revision.md)

---

## 1. One-Minute Full-Stack Elevator Pitch

> "Auction Hub is a high-performance online auction marketplace built as a decoupled full-stack application.
>
> On the client side, it features a **React 19 Single-Page Application (SPA)** bundled with **Vite 8**, using **React Router v7** for declarative route guarding and the **React Context API** for global authentication and real-time notifications. The user interface is crafted with responsive, custom **Vanilla CSS** featuring glassmorphic design tokens without third-party CSS libraries. All communication runs through a centralized native `fetch` client with JWT Bearer authentication and `FormData` image uploads.
>
> On the server side, it runs a **Go (1.26.2)** **Modular Monolith** using the **Gin Web Framework (v1.12.0)** structured in three distinct layers: **Controllers**, **Services**, and **Repositories**. Data persistence is handled by **PostgreSQL** via **GORM (v1.31.2)** with automated migrations, while transient 6-digit OTP codes are managed in **Redis** with 5-minute TTL expirations.
>
> Core business capabilities include real-time bid validation wrapped in database transactions, automated lazy auction expiration with order generation, order fulfillment tracking, and post-auction buyer-seller chat over efficient polling."

---

## 2. Tech Stack At-a-Glance

| Layer | Technology | Version | Purpose in Auction Hub | Source Location |
| :--- | :--- | :---: | :--- | :--- |
| **Frontend UI** | **React** | `^19.2.8` | Component rendering, hooks, virtual DOM | [`frontend/package.json`](file:///c:/Auction_Hub/frontend/package.json) |
| **Frontend Bundler** | **Vite** | `^8.2.2` | Fast HMR dev server & production bundling | [`frontend/vite.config.js`](file:///c:/Auction_Hub/frontend/vite.config.js) |
| **Frontend Routing** | **React Router** | `^7.18.3` | Client-side routing with custom route guards | [`frontend/src/routes/AppRoute.jsx`](file:///c:/Auction_Hub/frontend/src/routes/AppRoute.jsx) |
| **Frontend Styling** | **Vanilla CSS** | Pure CSS | Custom design tokens, glassmorphism, responsive | [`frontend/src/index.css`](file:///c:/Auction_Hub/frontend/src/index.css) |
| **HTTP Transport** | **Native Fetch** | Browser API | REST communication to Go backend | [`frontend/src/services/api.js`](file:///c:/Auction_Hub/frontend/src/services/api.js) |
| **Backend Language** | **Go (Golang)** | `1.26.2` | Compiled, type-safe, concurrent web backend | [`backend/go.mod`](file:///c:/Auction_Hub/backend/go.mod) |
| **HTTP Framework** | **Gin** | `v1.12.0` | High-throughput HTTP router & middleware pipeline | [`backend/go.mod`](file:///c:/Auction_Hub/backend/go.mod) |
| **Database ORM** | **GORM** | `v1.31.2` | Schema migration, query builder, transactions | [`backend/go.mod`](file:///c:/Auction_Hub/backend/go.mod) |
| **Relational DB** | **PostgreSQL** | v1.6.2 driver | Durable relational storage across 10 tables | [`backend/database/database.go`](file:///c:/Auction_Hub/backend/database/database.go) |
| **In-Memory Store** | **Redis** | `go-redis/v9` | 5-minute transient OTP storage | [`backend/database/redis.go`](file:///c:/Auction_Hub/backend/database/redis.go) |
| **Auth Tokens** | **JWT** | `golang-jwt/v5` | Stateless authentication tokens (24-hour expiry) | [`backend/utilis/jwt.go`](file:///c:/Auction_Hub/backend/utilis/jwt.go) |
| **Password Hash** | **Bcrypt** | `x/crypto` | Salted password hashing (`bcrypt.DefaultCost = 10`) | [`backend/utilis/password.go`](file:///c:/Auction_Hub/backend/utilis/password.go) |

---

## 3. Full-Stack 23-Page Mapping & Connection Matrix

| # | Frontend Page | Client URL | Route Guard | Backend API Endpoint | Controller Handler | Main Database Table |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| **1** | [`Home.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/Home.jsx) | `/` | *Public* | *None (Static landing)* | — | — |
| **2** | [`Login.jsx`](file:///c:/Auction_Hub/frontend/src/pages/auth/Login.jsx) | `/login` | `GuestRoute` | `POST /api/auth/login` | `auth.Controller.Login` | `users` |
| **3** | [`Register.jsx`](file:///c:/Auction_Hub/frontend/src/pages/auth/Register.jsx) | `/register` | `GuestRoute` | `POST /api/auth/send-otp` | `auth.Controller.SendOTP` | Redis (`otp:*`) |
| **4** | [`VerifyOTP.jsx`](file:///c:/Auction_Hub/frontend/src/pages/auth/VerifyOTP.jsx) | `/verify-otp` | `GuestRoute` | `POST /api/auth/register` | `auth.Controller.Register` | `users` |
| **5** | [`ForgotPassword.jsx`](file:///c:/Auction_Hub/frontend/src/pages/auth/ForgotPassword.jsx) | `/forgot-password` | `GuestRoute` | `POST /api/auth/reset-password` | `auth.Controller.ResetPassword` | `users`, Redis |
| **6** | [`Profile.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/Profile.jsx) | `/profile` | `ProtectedRoute` | `GET /api/users/profile` | `users.Controller.GetProfile` | `users` |
| **7** | [`MyProducts.jsx`](file:///c:/Auction_Hub/frontend/src/pages/seller/MyProducts.jsx) | `/products` | `ProtectedRoute` | `GET /api/products/my`, `POST /api/products` | `products.Controller.CreateProduct` | `products`, `product_images` |
| **8** | [`Auctions.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/Auctions.jsx) | `/auctions` | `ProtectedRoute` | `GET /api/auctions` | `auctions.Controller.GetActiveAuctions` | `auctions` *(evaluates expiry)* |
| **9** | [`AuctionDetails.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/AuctionDetails.jsx) | `/auctions/:id` | `ProtectedRoute` | `GET /api/auctions/:id`, `POST /api/bids` | `bids.Controller.CreateBid` | `auctions`, `bids`, `notifications` |
| **10**| [`MyBids.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/MyBids.jsx) | `/my-bids` | `ProtectedRoute` | `GET /api/bids/my` | `bids.Controller.GetMyBids` | `bids` |
| **11**| [`WonAuctions.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/WonAuctions.jsx) | `/won-auctions` | `ProtectedRoute` | `GET /api/auctions/won` | `auctions.Controller.GetWonAuctions` | `auctions` |
| **12**| [`MyAuctions.jsx`](file:///c:/Auction_Hub/frontend/src/pages/seller/MyAuctions.jsx) | `/my-auctions` | `ProtectedRoute` | `GET /api/auctions/seller` | `auctions.Controller.GetMyAuctions` | `auctions` |
| **13**| [`MyOrders.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/MyOrders.jsx) | `/my-orders` | `ProtectedRoute` | `GET /api/orders/my-orders` | `orders.Controller.GetMyOrders` | `orders` |
| **14**| [`OrderDetails.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/OrderDetails.jsx) | `/orders/:id` | `ProtectedRoute` | `GET /api/orders/:id`, `PATCH /ship`, `/deliver` | `orders.Controller.MarkAsDelivered` | `orders`, `chat_conversations` |
| **15**| [`MyReports.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/MyReports.jsx) | `/my-reports` | `ProtectedRoute` | `GET /api/reports/my-reports` | `reports.Controller.GetUserReports` | `reports` |
| **16**| [`Dashboard.jsx`](file:///c:/Auction_Hub/frontend/src/pages/admin/Dashboard.jsx) | `/admin` | `AdminRoute` | `GET /api/admin/dashboard` | `admin.Controller.GetDashboard` | Aggregates all 10 tables |
| **17**| [`ManageUsers.jsx`](file:///c:/Auction_Hub/frontend/src/pages/admin/ManageUsers.jsx) | `/admin/users` | `AdminRoute` | `GET /api/admin/users`, `PATCH /block` | `admin.Controller.BlockUser` | `users` |
| **18**| [`ManageProducts.jsx`](file:///c:/Auction_Hub/frontend/src/pages/admin/ManageProducts.jsx) | `/admin/products` | `AdminRoute` | `GET /api/admin/products`, `DELETE /:id` | `admin.Controller.DeleteProduct` | `products` |
| **19**| [`ManageAuctions.jsx`](file:///c:/Auction_Hub/frontend/src/pages/admin/ManageAuctions.jsx) | `/admin/auctions` | `AdminRoute` | `GET /api/admin/auctions`, `PATCH /pause` | `admin.Controller.PauseAuction` | `auctions` |
| **20**| [`ManageBids.jsx`](file:///c:/Auction_Hub/frontend/src/pages/admin/ManageBids.jsx) | `/admin/bids` | `AdminRoute` | `GET /api/admin/bids` | `admin.Controller.GetAllBids` | `bids` |
| **21**| [`ManageOrders.jsx`](file:///c:/Auction_Hub/frontend/src/pages/admin/ManageOrders.jsx) | `/admin/orders` | `AdminRoute` | `GET /api/admin/orders` | `admin.Controller.GetAllOrders` | `orders` |
| **22**| [`AdminProfile.jsx`](file:///c:/Auction_Hub/frontend/src/pages/admin/AdminProfile.jsx) | `/admin/profile` | `AdminRoute` | `GET /api/users/profile` | `users.Controller.GetProfile` | `users` |
| **23**| [`ManageReports.jsx`](file:///c:/Auction_Hub/frontend/src/pages/admin/ManageReports.jsx) | `/admin/reports` | `AdminRoute` | `GET /api/admin/reports`, `PATCH /status` | `reports.Controller.UpdateReportStatus` | `reports` |

---

## 4. Critical Execution Flows in 60 Seconds

### A. High-Stakes Bidding Flow
```
User Enters Bid -> AuctionDetails.jsx -> apiService.placeBid()
  -> POST /api/bids -> AuthMiddleware (Validates JWT)
  -> bids.Service Pre-checks (Active? EndTime future? Bidder != Seller? Amount > Current?)
  -> GORM ACID Transaction:
       1. INSERT INTO bids
       2. UPDATE auctions SET current_price = amount, bid_count = bid_count + 1
       3. Commit Transaction
  -> Dispatches Outbid & Seller Notifications
  -> Returns 201 Created -> React updates local state and re-renders UI
```

### B. Lazy Auction Expiration Flow
```
Client calls GET /api/auctions or GET /api/auctions/:id
  -> auctions.Repository.EvaluateExpiredAuctions() executes
  -> SELECT * FROM auctions WHERE status = 'active' AND end_time <= NOW()
  -> If bids exist:
       1. Identifies highest bidder
       2. UPDATE auctions SET status = 'ended', winner_id = highest_bid.user_id
       3. UPDATE products SET status = 'sold'
       4. INSERT INTO orders (buyer_id, seller_id, final_price, status='pending')
       5. Creates winner and seller notifications
  -> If 0 bids exist:
       UPDATE auctions SET status = 'ended', winner_id = NULL
```

### C. Post-Auction Fulfillment State Machine
```
Pending Order (Winner sets delivery address)
  -> Address Saved (Item eligible for shipment)
  -> Shipped (Seller marks shipped, buyer notified)
  -> Delivered (Buyer confirms receipt, seller notified)
  -> Completed Order
```

### D. Buyer-Seller Chat Flow
```
Buyer/Seller toggles chat in OrderDetails.jsx
  -> GET /api/chat/auction/:id resolves or creates conversation
  -> setInterval(fetchChat, 3000) starts 3-second polling
  -> POST /api/chat/conversation/:id/messages writes message to DB
  -> Dispatches in-app notification to the other participant
```

---

## 5. Top 15 Full-Stack Interview Traps & Defense Answers

### 1. Does the backend start if Redis is down?
**Trap:** "Yes, it just skips OTP caching."  
**Truth:** **No.** [`backend/database/redis.go`](file:///c:/Auction_Hub/backend/database/redis.go#L24) calls `log.Fatalf()`. The Go process crashes immediately on launch.

### 2. Is there a background cron job expiring auctions?
**Trap:** "Yes, a cron ticker runs in a goroutine every minute."  
**Truth:** **No.** Expiration is evaluated **lazily** on demand inside `EvaluateExpiredAuctions()` whenever an auction read endpoint is requested.

### 3. How does the Bidding Service handle concurrent bids?
**Trap:** "Transactions eliminate all race conditions."  
**Truth:** Transactions guarantee atomicity, but without pessimistic row locking (`SELECT ... FOR UPDATE`), two identical concurrent bids could both pass validation. Production systems should add GORM's `clause.Locking{Strength: "UPDATE"}`.

### 4. What transport protocol does the chat system use?
**Trap:** "WebSockets via Socket.io."  
**Truth:** **Pure HTTP polling.** [`OrderDetails.jsx`](file:///c:/Auction_Hub/frontend/src/pages/buyer/OrderDetails.jsx#L85) uses a 3,000ms `setInterval` calling standard REST GET endpoints.

### 5. Why are the `sellers` and `categories` routes not active?
**Trap:** "They are active microservices."  
**Truth:** Both exist as unmounted folder skeletons in `modules/`. Sellers operate under the standard `User` model, and categories are stored as free-form strings on `products.category`.

### 6. Where is the JWT signing secret stored?
**Trap:** "In a secure AWS KMS secret."  
**Truth:** It is hardcoded as `[]byte("auction-hub-secret-key")` in [`middleware/auth.go`](file:///c:/Auction_Hub/backend/middleware/auth.go) and [`utilis/jwt.go`](file:///c:/Auction_Hub/backend/utilis/jwt.go).

### 7. Why does `normalizeNotification` exist on the frontend?
**Trap:** "To filter out malicious HTML."  
**Truth:** The Go `Notification` struct lacks JSON tags, causing fields to serialize in PascalCase (`ID`, `UserID`, `Title`). The frontend normalizer maps them to camelCase.

### 8. Can a seller bid on their own auction?
**Trap:** "Yes, to set a reserve price."  
**Truth:** **No.** `bids.Service.CreateBid()` explicitly returns an error if `auction.SellerID == userID`.

### 9. Who can modify an order's delivery address?
**Trap:** "Both buyer and seller."  
**Truth:** Only the winning **buyer**, and only while the order is in `"pending"` status.

### 10. Does the frontend use Axios?
**Trap:** "Yes, via Axios interceptors."  
**Truth:** **No.** It uses the browser's native **`fetch` API** wrapped in [`frontend/src/services/api.js`](file:///c:/Auction_Hub/frontend/src/services/api.js).

### 11. What happens if an auction expires with 0 bids?
**Trap:** "An order is created with price 0."  
**Truth:** The auction status becomes `"ended"`, `winner_id` remains `NULL`, and no order record is created.

### 12. How does the frontend handle token expiration?
**Trap:** "Through an automatic silent refresh token."  
**Truth:** The API client intercepts HTTP 401, clears `localStorage`, and forces a redirect to `/login`.

### 13. What is soft deletion in this database?
**Trap:** "Rows are moved to an archive table."  
**Truth:** GORM sets a timestamp on `deleted_at`. Queries automatically append `WHERE deleted_at IS NULL`.

### 14. How are images served to the browser?
**Trap:** "From an AWS S3 bucket via signed URLs."  
**Truth:** From the local disk via Gin's static file handler: `router.Static("/uploads", "./uploads")`.

### 15. What CORS policy is configured on the backend?
**Trap:** "Restricted strictly to localhost:5173."  
**Truth:** In [`backend/cmd/server/main.go`](file:///c:/Auction_Hub/backend/cmd/server/main.go#L81), `AllowOriginFunc` returns `true` for all origins, allowing any domain to send credentials.

---

## 6. Key Code Snippets to Memorize

### 1. Safely Extracting UserID from Gin Context (Go)
```go
userIDVal, exists := c.Get("userID")
if !exists {
    c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
    return
}
userID := userIDVal.(uint)
```

### 2. GORM ACID Transaction Pattern (Go)
```go
err := s.db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&bid).Error; err != nil {
        return err // Rolls back
    }
    if err := tx.Model(&Auction{}).Where("id = ?", req.AuctionID).
        Updates(map[string]interface{}{
            "current_price": req.Amount,
            "bid_count":     gorm.Expr("bid_count + 1"),
        }).Error; err != nil {
        return err // Rolls back
    }
    return nil // Commits
})
```

### 3. Native Fetch API Client Wrapper (JavaScript)
```javascript
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Error ${response.status}`);
  }
  return data;
}
```

### 4. Client-Side Route Guarding (React)
```javascript
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
```
