# Auction Hub - Backend Quick Revision & Interview Cheat Sheet

> **Purpose:** High-yield, rapid-fire revision guide designed for quick review before a college project presentation, code defense, or technical interview. It covers the Go/Gin backend architecture, critical execution flows, database schema, and tricky edge cases.

---

## 1. One-Minute Elevator Pitch of the Backend

> "The **Auction Hub Backend** is a high-performance RESTful API built in **Go (1.26.2)** using the **Gin Web Framework (v1.12.0)**. It follows a **Modular Monolithic Architecture** structured into three clean layers: **Controllers** (HTTP routing, validation, JSON deserialization), **Services** (domain rules, ACID transactions, and notifications), and **Repositories** (GORM queries and PostgreSQL persistence).
>
> Data persistence is handled by **PostgreSQL** through **GORM (v1.31.2)** with automatic schema migrations. High-speed transient states—specifically 6-digit cryptographic OTPs for user registration and password resets—are stored in **Redis (go-redis/v9)** with strict 5-minute TTL expirations. Authentication uses stateless **JWT tokens (golang-jwt/v5)** stored on client-side cookies or headers, validated via Gin middleware that injects typed claims (`userID`, `role`) directly into the Gin context.
>
> Core business capabilities include real-time bid validation wrapped in database transactions, automated lazy auction expiration with order generation, order fulfillment tracking, and post-auction buyer-seller chat over efficient polling."

---

## 2. Tech Stack At-a-Glance

| Layer / Concern | Technology Used | Version | Primary Purpose | Source Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Language** | **Go (Golang)** | `1.26.2` | Compiled, type-safe, concurrent backend | [`go.mod`](file:///c:/Auction_Hub/go.mod#L3) |
| **HTTP Framework** | **Gin** | `v1.12.0` | High-speed HTTP router & middleware pipeline | [`go.mod`](file:///c:/Auction_Hub/go.mod#L8) |
| **Database ORM** | **GORM** | `v1.31.2` | Struct-to-relation mapping, migrations, query builder | [`go.mod`](file:///c:/Auction_Hub/go.mod#L11) |
| **Primary Database** | **PostgreSQL** | `v1.6.2` driver | Relational persistence, foreign keys, ACID bids | [`database/database.go`](file:///c:/Auction_Hub/database/database.go) |
| **In-Memory Store** | **Redis** | `go-redis/v9` (`v9.22.0`) | 5-minute transient OTP storage & verification | [`database/redis.go`](file:///c:/Auction_Hub/database/redis.go) |
| **Authentication** | **JWT** | `golang-jwt/v5` (`v5.3.1`) | Stateless authentication token generation/verification | [`utilis/jwt.go`](file:///c:/Auction_Hub/utilis/jwt.go) |
| **Password Hashing** | **Bcrypt** | `golang.org/x/crypto` | Irreversible salt + hash (`bcrypt.DefaultCost = 10`) | [`utilis/password.go`](file:///c:/Auction_Hub/utilis/password.go) |
| **CORS Middleware** | **gin-contrib/cors** | `v1.7.6` | HTTP Origin, Headers, and Credentials handling | [`cmd/server/main.go`](file:///c:/Auction_Hub/cmd/server/main.go) |

---

## 3. Backend Architectural Pattern

```
                       HTTP Request (JSON / Multipart)
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │       Gin Engine & Router       │
                    │   (CORS, Static Files, Routes)   │
                    └─────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │      Middleware Pipeline        │
                    │  (AuthMiddleware, RoleMiddleware)│
                    └─────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │        CONTROLLER LAYER         │
                    │   • Parse URI/Query params      │
                    │   • Bind JSON / Multipart Form  │
                    │   • Extract c.Get("userID")     │
                    │   • Return c.JSON(status, data) │
                    └─────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │         SERVICE LAYER           │
                    │   • Business rules & conditions │
                    │   • GORM ACID Transactions      │
                    │   • Cross-module calls (Orders, │
                    │     Notifications)              │
                    └─────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │        REPOSITORY LAYER         │
                    │   • GORM raw queries & builders │
                    │   • Preload associations        │
                    │   • Create / Update / Delete    │
                    └─────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
         ┌──────────────────────┐          ┌──────────────────────┐
         │ PostgreSQL Database  │          │      Redis Store     │
         │ (10 Relational Tables│          │ (OTPs with 5m TTL)   │
         └──────────────────────┘          └──────────────────────┘
```

### Golden Rule of Responsibility:
- **Controllers** *never* write SQL or talk directly to the database.
- **Repositories** *never* read `gin.Context` or write HTTP status codes.
- **Services** own all business logic, transactions, and inter-module coordination.

---

## 4. Server Boot Sequence (Order of Operations)

From [`cmd/server/main.go`](file:///c:/Auction_Hub/cmd/server/main.go):

1. **`godotenv.Load()`**: Attempts to load `.env` from disk. If missing, it logs a warning but proceeds using system environment variables.
2. **`database.ConnectDatabase()`**: 
   - Reads `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DB_SSLMODE`.
   - Opens PostgreSQL connection with `postgres.Open(dsn)`.
   - Calls `AutoMigrate()` on 10 active models: `User`, `Product`, `Auction`, `Bid`, `Order`, `ChatConversation`, `ChatMessage`, `Notification`, `Report`, `ProductImage`.
   - **Fails fast:** If database is unreachable, `log.Fatal` terminates the process.
3. **`database.ConnectRedis()`**:
   - Reads `REDIS_ADDR` (or defaults to `localhost:6379`).
   - Executes `rdb.Ping()`.
   - **Fails fast:** If Redis is down, `log.Fatal` terminates the server!
4. **Gin Initialization**:
   - `r := gin.Default()` (includes Logger and Recovery middlewares).
5. **CORS Configuration**:
   - Configures `cors.New(...)` allowing `http://localhost:5173` and `http://localhost:3000`, with credentials enabled.
6. **Static File Serving**:
   - Mounts `/uploads` &rarr; `./uploads` directory on disk.
7. **Module Initialization & Dependency Injection**:
   - Repositories instantiated &rarr; Services instantiated with repos &rarr; Controllers instantiated with services &rarr; Routes registered on `/api` sub-router.
8. **HTTP Listener**:
   - `r.Run(":" + port)` (defaults to port `8080`).

---

## 5. Middleware & Context Cheat Sheet

### 1. `AuthMiddleware()` ([`middleware/auth.go`](file:///c:/Auction_Hub/middleware/auth.go))
- **Header format:** Reads `Authorization: Bearer <token>`.
- **Parsing:** Validates signature using secret `[]byte("auction-hub-secret-key")`.
- **Context Injection:**
  ```go
  c.Set("userID", claims.UserID) // uint
  c.Set("role", claims.Role)     // string ("admin", "user", etc.)
  c.Next()
  ```
- **Rejection:** Aborts with `401 Unauthorized` (`c.AbortWithStatusJSON(401, ...)`).

### 2. `RoleMiddleware(allowedRoles ...string)` ([`middleware/role.go`](file:///c:/Auction_Hub/middleware/role.go))
- Reads `roleVal, exists := c.Get("role")`.
- Checks if `userRole` matches any of `allowedRoles`.
- **Rejection:** Aborts with `403 Forbidden` (`c.AbortWithStatusJSON(403, ...)`).

---

## 6. The 10 Active Modules & What They Do

| # | Module | Directory | Primary Models | Primary Responsibility |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Auth** | [`modules/auth/`](file:///c:/Auction_Hub/modules/auth/) | *(Uses User)* | Register OTP, Verify OTP, Login, Forgot Password, Reset Password |
| **2** | **Users** | [`modules/users/`](file:///c:/Auction_Hub/modules/users/) | `User` | Profile viewing, profile update, avatar change, address update |
| **3** | **Products** | [`modules/products/`](file:///c:/Auction_Hub/modules/products/) | `Product`, `ProductImage` | Multi-image product creation, catalog listing, seller item filtering |
| **4** | **Auctions** | [`modules/auctions/`](file:///c:/Auction_Hub/modules/auctions/) | `Auction` | Auction creation, public catalog, lazy auto-expiry evaluation |
| **5** | **Bids** | [`modules/bids/`](file:///c:/Auction_Hub/modules/bids/) | `Bid` | ACID transaction bidding, validation, outbid notification |
| **6** | **Orders** | [`modules/orders/`](file:///c:/Auction_Hub/modules/orders/) | `Order` | Won auction checkout, shipping address, status machine (`pending` &rarr; `delivered`) |
| **7** | **Chat** | [`modules/chat/`](file:///c:/Auction_Hub/modules/chat/) | `ChatConversation`, `ChatMessage` | Buyer-seller conversation per order, messaging with unread tracking |
| **8** | **Notifications** | [`modules/notifications/`](file:///c:/Auction_Hub/modules/notifications/) | `Notification` | System alerts for bids, wins, orders, chat; unread count & mark-as-read |
| **9** | **Reports** | [`modules/reports/`](file:///c:/Auction_Hub/modules/reports/) | `Report` | Community violation flagging against products or users |
| **10**| **Admin** | [`modules/admin/`](file:///c:/Auction_Hub/modules/admin/) | *(Aggregator)* | Platform metrics, user ban/unban, order override, report resolution |

> **Note on `sellers` and `categories`:** 
> Both folders exist in `modules/`, but their routes are **empty** and **not registered** in `main.go`. In the current implementation, every `User` can act as a seller, and categories are stored as free-form strings on the `Product` model.

---

## 7. Database Relational Map (PostgreSQL / GORM)

```
       ┌───────────────────────────────┐
       │             User              │
       │  (id, name, email, password,  │
       │   role, phone, address, ban)  │
       └───────────────┬───────────────┘
                       │
       ┌───────────────┼──────────────────────────────┐
       │ 1:N           │ 1:N                          │ 1:N
       ▼               ▼                              ▼
┌──────────────┐ ┌──────────────┐              ┌──────────────┐
│   Product    │ │     Bid      │              │ Notification │
│ (seller_id)  │ │  (user_id)   │              │  (user_id)   │
└──────┬───────┘ └──────┬───────┘              └──────────────┘
       │                │
       │ 1:1            │
       ▼                │
┌──────────────┐        │
│   Auction    │◄───────┘ (N:1)
│ (product_id) │
└──────┬───────┘
       │
       │ 1:1
       ▼
┌──────────────┐
│    Order     │◄──────┐
│ (auction_id) │       │ 1:1
└──────────────┘       ▼
               ┌────────────────────────┐
               │    ChatConversation    │
               │ (order_id, buyer/seller│
               └───────────┬────────────┘
                           │ 1:N
                           ▼
               ┌────────────────────────┐
               │      ChatMessage       │
               │ (conversation_id, etc.)│
               └────────────────────────┘
```

---

## 8. High-Stakes Bidding Flow (ACID Transaction)

Located in [`modules/bids/service.go`](file:///c:/Auction_Hub/modules/bids/service.go#L37-L123):

```
1. Client POST /api/bids/
   { "auction_id": 4, "amount": 250.00 }
         │
2. Bids Controller
   • Extracts authenticated userID from c.Get("userID")
   • Validates payload binding
         │
3. Bids Service Validations (Pre-Checks)
   • Fetch Auction from DB.
   • Verify: Auction Status == "active"
   • Verify: Now() < Auction.EndTime
   • Verify: Bidder ID != Auction.SellerID (Sellers CANNOT bid on own items!)
   • Verify: Amount > Auction.CurrentPrice
   • Verify: Amount >= Auction.StartingPrice
         │
4. GORM ACID Transaction (tx := db.Begin())
   ┌────────────────────────────────────────────────────────┐
   │ a. Insert new Bid record:                              │
   │    INSERT INTO bids (auction_id, user_id, amount, ...) │
   │                                                        │
   │ b. Update Auction Current Price & Bid Count:           │
   │    UPDATE auctions                                     │
   │    SET current_price = 250.00,                         │
   │        bid_count = bid_count + 1                       │
   │    WHERE id = 4                                        │
   │                                                        │
   │ c. Commit Transaction (tx.Commit())                    │
   └────────────────────────────────────────────────────────┘
         │
5. Post-Commit Asynchronous Notifications
   • Notify Seller: "New bid of $250 placed on your auction"
   • Find Previous Highest Bidder:
     If exists and previous_bidder != current_bidder:
       Notify Outbid User: "You were outbid on auction #4!"
         │
6. Return 201 Created with Bid object
```

---

## 9. Lazy Auction Expiration (How Auctions End)

Located in [`modules/auctions/repository.go`](file:///c:/Auction_Hub/modules/auctions/repository.go#L60-L135):

> **Key Interview Takeaway:** Auction Hub does **NOT** use a background cron job or goroutine ticker to expire auctions. It uses **on-demand lazy evaluation**.

```
Trigger: Any user calls GET /api/auctions/ or GET /api/auctions/:id
                            │
                            ▼
           r.EvaluateExpiredAuctions() is called
                            │
                            ▼
    SELECT * FROM auctions 
    WHERE status = 'active' AND end_time <= NOW()
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
          [ If Has Bids ]         [ If No Bids ]
                │                       │
Find highest bid record:         UPDATE auctions
SELECT * FROM bids               SET status = 'ended'
WHERE auction_id = ?             WHERE id = ?
ORDER BY amount DESC LIMIT 1            │
                │                 (No Order Created)
                ▼
1. UPDATE auctions 
   SET status = 'ended', 
       winner_id = highest_bid.UserID
2. UPDATE products 
   SET status = 'sold'
3. INSERT INTO orders (
     auction_id, buyer_id, seller_id, 
     final_price, status='pending'
   )
4. Create Notifications:
   • Notify Winner: "Congratulations, you won!"
   • Notify Seller: "Your auction ended with a winner!"
```

---

## 10. Order Fulfillment State Machine

Located in [`modules/orders/`](file:///c:/Auction_Hub/modules/orders/):

```
       [ Auction Ends With Bids ]
                   │
                   ▼
               (Pending) ── User submits address ──► Address Saved
                   │
                   ▼ (Seller ships item)
               (Shipped) ── Sets Tracking Number & Carrier
                   │
                   ▼ (Buyer or Admin confirms delivery)
              (Delivered) ── Order Complete
                   │
                   ▼ (Alternative: Buyer/Seller cancels before shipment)
              (Cancelled)
```

### Authorization Rules:
- **Set Address:** Only the **Buyer** (`buyer_id == userID`).
- **Update Status to Shipped:** Only the **Seller** (`seller_id == userID`) or **Admin**.
- **Update Status to Delivered:** Only the **Buyer** or **Admin**.
- **Admin Force Override:** `PUT /api/admin/orders/:id/status` can set any valid status.

---

## 11. Redis OTP Lifecycle Cheat Sheet

Located in [`modules/auth/service.go`](file:///c:/Auction_Hub/modules/auth/service.go) and [`database/redis.go`](file:///c:/Auction_Hub/database/redis.go):

| Step | Action | Redis Key Created | Data Stored | TTL |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Register initiated (`/api/auth/register`) | `otp:<email>` | Random 6-digit numeric string (e.g. `"481920"`) | **5 Minutes** |
| **2** | Storing pending user details | `pending_user:<email>` | Serialized JSON of registration form (name, password hash, phone) | **5 Minutes** |
| **3** | Verifying OTP (`/api/auth/verify-otp`) | Reads & compares `otp:<email>`. Upon match, creates User in PostgreSQL, then deletes Redis keys. | *N/A (Keys Deleted)* | Immediate |
| **4** | Forgot Password OTP (`/api/auth/forgot-password`) | `otp:<email>` | Random 6-digit code | **5 Minutes** |
| **5** | Verify Reset OTP (`/api/auth/verify-reset-otp`) | `verified:<email>` | `"true"` (Proof of OTP validation) | **5 Minutes** |
| **6** | Reset Password (`/api/auth/reset-password`) | Checks `verified:<email> == "true"`. Updates password in Postgres and deletes key. | *N/A (Key Deleted)* | Immediate |

---

## 12. Notification Matrix

| Event / Trigger | Service Function | Recipient | Notification Title | Type |
| :--- | :--- | :--- | :--- | :--- |
| **Bid Placed** | `bids.Service.CreateBid` | Seller | `"New Bid Received"` | `bid` |
| **Bid Outbid** | `bids.Service.CreateBid` | Prior Highest Bidder | `"You've Been Outbid!"` | `bid` |
| **Auction Won** | `auctions.Repo.EvaluateExpiredAuctions` | Winner (Buyer) | `"Auction Won!"` | `auction` |
| **Auction Sold** | `auctions.Repo.EvaluateExpiredAuctions` | Seller | `"Auction Ended Successfully"` | `auction` |
| **Order Shipped** | `orders.Service.UpdateStatus` | Buyer | `"Order Shipped"` | `order` |
| **Order Delivered**| `orders.Service.UpdateStatus` | Seller | `"Order Delivered"` | `order` |
| **Chat Message** | `chat.Service.SendMessage` | Other Chat Participant | `"New Message"` | `chat` |

---

## 13. Top 15 Interview Traps & Technical Gotchas

### 1. Does Redis absence allow the server to boot?
**No.** [`database/redis.go`](file:///c:/Auction_Hub/database/redis.go#L24) calls `log.Fatalf("Failed to connect to Redis: %v", err)`. If Redis isn't running on `localhost:6379`, the Go server crashes immediately on startup.

### 2. Is there a background cron job running for auction expiration?
**No.** There is no background worker or ticker. Expiration is **lazy**—it is only evaluated inside `EvaluateExpiredAuctions()` whenever an auction read endpoint (`GET /api/auctions` or `GET /api/auctions/:id`) is hit.

### 3. How does the Bidding Service prevent race conditions?
It uses a **GORM ACID transaction** (`tx := db.Begin()`), but currently **lacks pessimistic locking** (`SELECT ... FOR UPDATE`). If two users submit identical bids at the exact millisecond, both might pass the in-memory `Amount > currentPrice` validation before the write occurs. (Great answer: *"In production, I would add `Clauses(clause.Locking{Strength: "UPDATE"})` to lock the auction row."*)

### 4. Why are the `sellers` and `categories` routes not active?
They exist in the folder tree as modular skeletons, but their `routes.go` files are empty and `main.go` does not mount them. The platform treats every standard user as an eligible seller and stores categories as simple strings on the `Product` entity.

### 5. Does Chat use WebSockets or Socket.io?
**No.** The backend uses pure REST HTTP endpoints (`POST /api/chat/messages`, `GET /api/chat/conversations/:id/messages`). The React frontend connects via an **HTTP interval polling every 3,000ms**.

### 6. Where is the JWT signing key stored?
In [`middleware/auth.go`](file:///c:/Auction_Hub/middleware/auth.go#L11) and [`utilis/jwt.go`](file:///c:/Auction_Hub/utilis/jwt.go#L9), `[]byte("auction-hub-secret-key")` is **hardcoded**. In production, it should be read via `os.Getenv("JWT_SECRET")`.

### 7. How are notifications serialized to JSON?
In [`modules/notifications/model.go`](file:///c:/Auction_Hub/modules/notifications/model.go), the fields lack `json:"..."` struct tags. Thus, Go's default JSON serializer outputs them in **PascalCase** (`ID`, `UserID`, `Title`, `IsRead`). The React frontend includes a helper `normalizeNotification()` to map them back to camelCase.

### 8. Can a seller bid on their own auction?
**No.** The Bids Service explicitly checks `if auction.SellerID == userID` and returns `errors.New("sellers cannot bid on their own auctions")`.

### 9. What is the difference between `c.Set` and `c.Get` in Gin?
`c.Set(key, value)` writes request-scoped metadata into Gin's internal key-value map during middleware execution (e.g., `c.Set("userID", claims.UserID)`). Downstream controllers use `c.Get(key)` to retrieve it without re-parsing the JWT.

### 10. How does file upload work for products?
[`modules/products/controller.go`](file:///c:/Auction_Hub/modules/products/controller.go) uses `form, err := c.MultipartForm()`, loops through `form.File["images"]`, generates unique filenames with `uuid.New().String()`, saves them to `./uploads/`, and creates `ProductImage` database records linked to the product ID.

### 11. Can an admin place bids or buy products?
Yes, but the system treats them as standard users when bidding. However, in [`middleware/role.go`](file:///c:/Auction_Hub/middleware/role.go), the `"admin"` role has elevated access to the `/api/admin/*` routes.

### 12. How does `gorm.Model` work?
It embeds four fields: `ID uint (PK)`, `CreatedAt time.Time`, `UpdatedAt time.Time`, and `DeletedAt gorm.DeletedAt (Index)`. Because `DeletedAt` is present, GORM automatically performs **soft deletes** (records are not deleted from disk; queries automatically append `WHERE deleted_at IS NULL`).

### 13. What happens if an auction expires with 0 bids?
`EvaluateExpiredAuctions()` updates `status = "ended"`, but leaves `winner_id = nil`. No order is created. The product remains unsold or can be re-listed.

### 14. What are the allowed Order status transitions?
`pending` &rarr; `shipped` &rarr; `delivered` (or `cancelled`). Only sellers/admins can set `shipped`. Only buyers/admins can set `delivered`.

### 15. How does Go handle password security?
Using `golang.org/x/crypto/bcrypt`. `bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)` hashes the password with a randomized salt. Verification is performed with `bcrypt.CompareHashAndPassword([]byte(hashed), []byte(plain))`.

---

## 14. Fast-Track API Routing Table

### Public & Auth Routes (No Token Required)
- `POST /api/auth/register` &rarr; Send 6-digit registration OTP to email
- `POST /api/auth/verify-otp` &rarr; Validate OTP and insert User into Postgres
- `POST /api/auth/login` &rarr; Validate credentials and return signed JWT token
- `POST /api/auth/forgot-password` &rarr; Send reset OTP to email
- `POST /api/auth/verify-reset-otp` &rarr; Validate reset code, set `verified:<email>` in Redis
- `POST /api/auth/reset-password` &rarr; Update password in DB
- `GET  /api/auctions/` &rarr; Browse active auctions (triggers lazy expiration)
- `GET  /api/auctions/:id` &rarr; View single auction details + bids
- `GET  /api/products/` &rarr; Browse catalog items

### Protected Routes (Requires `Authorization: Bearer <token>`)
- **Users:** `GET /api/users/profile`, `PUT /api/users/profile`, `POST /api/users/profile/avatar`, `PUT /api/users/profile/address`
- **Products:** `POST /api/products/` (Multipart images), `GET /api/products/my-products`
- **Auctions:** `POST /api/auctions/` (List item for auction), `GET /api/auctions/my-auctions`
- **Bids:** `POST /api/bids/` (Submit bid with ACID tx), `GET /api/bids/my-bids`
- **Orders:** `GET /api/orders/my-orders`, `GET /api/orders/:id`, `PUT /api/orders/:id/address`, `PUT /api/orders/:id/status`
- **Chat:** `GET /api/chat/conversations`, `POST /api/chat/conversations`, `GET /api/chat/conversations/:id/messages`, `POST /api/chat/messages`
- **Notifications:** `GET /api/notifications/`, `GET /api/notifications/unread-count`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`
- **Reports:** `POST /api/reports/` (Flag abuse/violation)

### Admin Only Routes (Requires `role == "admin"`)
- `GET /api/admin/stats` &rarr; Platform dashboard overview counts
- `GET /api/admin/users` &rarr; View all platform users
- `PUT /api/admin/users/:id/ban` &rarr; Toggle user banned status
- `GET /api/admin/orders` &rarr; View all marketplace orders
- `PUT /api/admin/orders/:id/status` &rarr; Force override order status
- `GET /api/admin/reports` &rarr; View user abuse flags
- `PUT /api/admin/reports/:id/resolve` &rarr; Resolve report

---

## 15. Key Go/Gin Code Snippets to Memorize

### Extracting UserID Safely from Gin Context:
```go
userIDVal, exists := c.Get("userID")
if !exists {
    c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
    return
}
userID, ok := userIDVal.(uint)
if !ok {
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
    return
}
```

### Performing an ACID Transaction in GORM:
```go
err := s.db.Transaction(func(tx *gorm.DB) error {
    // 1. Insert bid
    if err := tx.Create(&bid).Error; err != nil {
        return err // Automatically rolls back
    }
    // 2. Update auction current price
    if err := tx.Model(&Auction{}).Where("id = ?", auctionID).
        Updates(map[string]interface{}{
            "current_price": newAmount,
            "bid_count":     gorm.Expr("bid_count + ?", 1),
        }).Error; err != nil {
        return err // Automatically rolls back
    }
    return nil // Automatically commits
})
```
