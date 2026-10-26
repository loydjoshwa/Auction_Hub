# Auction Hub - Frontend Quick Revision & Interview Cheat Sheet

> **Purpose:** High-yield, rapid-fire revision guide designed for quick review before a college project presentation, code defense, or technical interview.

---

## 1. One-Minute Elevator Pitch of the Frontend

> "Auction Hub is a real-time online auction marketplace Single-Page Application (SPA) built using **React 19** and **Vite 8**. It provides three distinct user experiences: public guests, authenticated marketplace participants (acting as both buyers and sellers), and system administrators.
>
> On the client side, routing is handled by **React Router v7** with custom route guards for guest-only, protected, and admin-only pages. State management uses the **React Context API** for global authentication and real-time notifications, paired with local component hooks. The styling is built with **custom Vanilla CSS** featuring modern glassmorphism design tokens, avoiding bulky UI libraries. The application communicates with our Go Gin backend through a centralized **native fetch API service** with JWT Bearer authentication, image uploads via `FormData`, and order fulfillment chat powered by efficient polling."

---

## 2. Tech Stack At-a-Glance

| Layer | Actual Technology Used | Code Verification Location |
| :--- | :--- | :--- |
| **Framework & Core** | **React 19** (`^19.2.8`) & `react-dom` (`^19.2.8`) | [`package.json`](file:///c:/Auction_Hub/frontend/package.json) |
| **Build & Dev Tool** | **Vite 8** (`^8.2.2`) with `@vitejs/plugin-react` | [`vite.config.js`](file:///c:/Auction_Hub/frontend/vite.config.js) |
| **Client Routing** | **React Router v7** (`^7.18.3`) | [`src/routes/AppRoute.jsx`](file:///c:/Auction_Hub/frontend/src/routes/AppRoute.jsx) |
| **Styling** | Custom **Vanilla CSS** with CSS Variables & Glassmorphism | [`src/index.css`](file:///c:/Auction_Hub/frontend/src/index.css) |
| **HTTP Client** | **Native browser `fetch`** (Axios is NOT used) | [`src/services/api.js`](file:///c:/Auction_Hub/frontend/src/services/api.js) |
| **State Management** | **React Context API** (`AuthContext`, `NotificationContext`) | [`src/context/`](file:///c:/Auction_Hub/frontend/src/context/) |
| **Font** | *Plus Jakarta Sans* (Google Fonts) | [`src/index.css`](file:///c:/Auction_Hub/frontend/src/index.css#L1) |

---

## 3. The 3 Route Guard Rules (Memorize for Interview)

Located in [`src/routes/AppRoute.jsx`](file:///c:/Auction_Hub/frontend/src/routes/AppRoute.jsx):

```javascript
// 1. ProtectedRoute: For logged-in buyers and sellers
if (!isLoggedIn) return <Navigate to="/login" replace />;

// 2. AdminRoute: For platform administrators only
if (!isLoggedIn) return <Navigate to="/login" replace />;
if (user?.role !== "admin") return <Navigate to="/" replace />;

// 3. GuestRoute: For login, register, OTP verification
if (isLoggedIn) {
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/" replace />;
}
```

---

## 4. Complete Route Mapping (23 Pages)

### Auth Routes (Guest Only)
1. `/login` &rarr; `Login.jsx` (Email + password authentication)
2. `/register` &rarr; `Register.jsx` (Step 1: submit details & send OTP)
3. `/verify-otp` &rarr; `VerifyOTP.jsx` (Step 2: enter 6-digit code & complete account creation)
4. `/forgot-password` &rarr; `ForgotPassword.jsx` (Two-step reset via email OTP)

### Public Route
5. `/` &rarr; `Home.jsx` (Landing marketplace hero page)

### Buyer & Seller Routes (Protected)
6. `/auctions` &rarr; `Auctions.jsx` (Active auctions grid with live countdown timers)
7. `/auctions/:id` &rarr; `AuctionDetails.jsx` (Live bidding, bid history, report modal)
8. `/products` &rarr; `MyProducts.jsx` (Seller inventory: CRUD & place in auction)
9. `/my-auctions` &rarr; `MyAuctions.jsx` (Seller's auctions with early end action)
10. `/my-bids` &rarr; `MyBids.jsx` (Bidding history: Highest Bid, Outbid, Won, Lost)
11. `/won-auctions` &rarr; `WonAuctions.jsx` (Won items shortcut)
12. `/my-orders` &rarr; `MyOrders.jsx` (Dual-tab: buyer orders & seller orders)
13. `/orders/:id` &rarr; `OrderDetails.jsx` (Fulfillment steps, address entry, and order chat)
14. `/my-reports` &rarr; `MyReports.jsx` (Track submitted abuse reports)
15. `/profile` &rarr; `Profile.jsx` (User profile details & name update)

### Admin Routes (Admin Only)
16. `/admin` &rarr; `Dashboard.jsx` (Platform metrics & analytics cards)
17. `/admin/users` &rarr; `ManageUsers.jsx` (Block & Unblock user accounts)
18. `/admin/products` &rarr; `ManageProducts.jsx` (Product inventory & forced delete with reason)
19. `/admin/auctions` &rarr; `ManageAuctions.jsx` (Cancel, Pause, and Resume auctions)
20. `/admin/bids` &rarr; `ManageBids.jsx` (Global bid audit feed)
21. `/admin/orders` &rarr; `ManageOrders.jsx` (Platform order fulfillment oversight)
22. `/admin/reports` &rarr; `ManageReports.jsx` (Review abuse reports & action auctions)
23. `/admin/profile` &rarr; `AdminProfile.jsx` (Administrator profile & name update)

---

## 5. State Management Quick Summary

```
                      +-------------------+
                      |      App.jsx      |
                      +---------+---------+
                                |
             +------------------+------------------+
             |                                     |
    +--------v--------+                   +--------v--------+
    |   AuthProvider  |                   | NotificationProv|
    +--------+--------+                   +--------+--------+
             |                                     |
    - token (JWT in localStorage)         - notifications (Array)
    - user (Object in localStorage)       - unreadCount (Number badge)
    - isLoggedIn (Boolean)                - isLoading, isMarkingAll
    - login(), logout(), updateUser()     - markAsRead(), markAllAsRead()
```

- **Authentication:** `AuthContext.jsx` verifies JWT expiration via Base64 payload decoding (`atob(parts[1])`) on startup.
- **Notifications:** `NotificationContext.jsx` normalizes Go backend casing inconsistencies (PascalCase vs camelCase) using `normalizeNotification()`.
- **Local State:** Component-level `useState` handles forms, search inputs, modal visibility, and timers.

---

## 6. How Chat & Notifications Actually Work

| Feature | Protocol / Mechanism | Details |
| :--- | :--- | :--- |
| **Notification Badge** | HTTP GET | Calls `/api/notifications/unread-count` upon login. Displays count or `99+`. |
| **Notification Drawer** | HTTP GET & PATCH | Fetches `/api/notifications` on bell click. Clicking an item marks it read via `PATCH /api/notifications/:id/read`. |
| **Order Chat** | **HTTP Polling (Every 3s)** | Hosted in `OrderDetails.jsx`. When open, `setInterval(fetchChat, 3000)` polls `/api/chat/conversation/:id/messages`. |
| **Live Timers** | Client `setInterval` | In `Auctions.jsx` & `AuctionDetails.jsx`, updates `now` state every 1 second to recalculate remaining time. |

> [!IMPORTANT]
> If asked in an interview: *"Does your frontend use WebSockets?"*  
> **Accurate Answer:** *"No, the frontend currently uses HTTP polling every 3 seconds for chat messages and client-side countdown intervals for auction timers. WebSockets are a planned future upgrade for true real-time push events."*

---

## 7. Key Form & API Flows

### 1. Bid Submission (`AuctionDetails.jsx`)
1. User enters bid amount.
2. Client checks: `numericBid > auction.currentPrice` and `numericBid >= auction.startingPrice`.
3. Dispatches `apiService.placeBid(token, { auctionId, amount })` via `POST /api/bids`.
4. Updates `auction.currentPrice` and `bidCount` in React state immediately.
5. Re-fetches bid history via `GET /api/bids/auction/:id`.

### 2. Product Image Upload (`AddEditProductModal.jsx`)
1. User selects image file.
2. Client validates format (`jpeg, jpg, png, webp`) and size (`<= 5MB`).
3. Generates preview with `URL.createObjectURL(file)`.
4. Appends to `FormData`: `formData.append("image", file)`.
5. `request()` in `api.js` detects `FormData` and lets the browser set the boundary header automatically.
6. Posts to `POST /api/products` or `PUT /api/products/:id`.

### 3. Password Reset (`ForgotPassword.jsx`)
- **Step 1:** Enter email &rarr; calls `POST /api/auth/forgot-password` &rarr; advances to Step 2.
- **Step 2:** Enter 6-digit OTP + new password + confirm password &rarr; calls `POST /api/auth/reset-password` &rarr; redirects to `/login`.

---

## 8. Top 10 React Interview Traps & Explanations

#### 1. Why is `Content-Type` omitted for `FormData` in `api.js`?
Because the browser must generate the `multipart/form-data; boundary=----WebKitFormBoundary...` header itself. Setting it manually strips the boundary, causing backend file parsing to fail.

#### 2. How do you prevent memory leaks with `setInterval` in React?
Always return a cleanup function from `useEffect`:
```javascript
useEffect(() => {
  const timer = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(timer); // Cleanup on unmount!
}, []);
```

#### 3. Why are search queries debounced in Admin tables?
In `ManageUsers.jsx` and `ManageProducts.jsx`, search inputs use a 300ms `setTimeout` inside `useEffect`. This waits until the user pauses typing before firing an API request, preventing server overload.

#### 4. How does `NotificationBell` close when clicking outside?
It uses a `useRef` on the container element and attaches a `mousedown` event listener to `document`. If `!containerRef.current.contains(event.target)`, it sets `isOpen(false)`.

#### 5. Why is `useCallback` used in `AuthContext` and `NotificationContext`?
Functions like `login`, `logout`, and `fetchNotifications` are passed to context consumers. Wrapping them in `useCallback` ensures their function references remain stable across re-renders, preventing infinite loops in consumer `useEffect` hooks.

#### 6. Why is `useMemo` used in `NotificationBell`?
To filter notifications into All, Unread, and Read lists without recalculating the array on every unrelated render.

#### 7. How does the frontend handle token expiration without third-party libraries?
By parsing the Base64 JWT payload with `JSON.parse(atob(token.split('.')[1]))` and comparing `payload.exp * 1000 < Date.now()`.

#### 8. What is the difference between `sessionStorage` and `localStorage` in Auction Hub?
- `localStorage` persists the login JWT token and user profile indefinitely across browser restarts.
- `sessionStorage` temporarily holds registration data (`name`, `email`, `password`) between Step 1 (`Register.jsx`) and Step 2 (`VerifyOTP.jsx`) and is cleared as soon as registration finishes or the tab closes.

#### 9. Why does CloudFront need a custom error page for SPA deployments?
In an SPA, routes like `/auctions/5` do not exist as physical files on S3. Without a custom error response redirecting 404s to `/index.html`, refreshing on any sub-path returns an S3 404 error.

#### 10. How does the UI handle relative image URLs from the backend?
The `getImageSrc(url)` helper checks if the URL starts with `http`. If not, it prepends the backend host (`http://localhost:8080`), ensuring images render correctly whether stored locally or hosted externally.

---

## 9. Recommended Reading Order for Full Review

1. **Architecture & Startup:** Read Part 1 & Part 3 in [`Auction_Hub_Frontend_Documentation.md`](file:///c:/Auction_Hub/docs/project-documentation/frontend/Auction_Hub_Frontend_Documentation.md).
2. **Routing & Guards:** Read Part 6 in [`Auction_Hub_Frontend_Documentation.md`](file:///c:/Auction_Hub/docs/project-documentation/frontend/Auction_Hub_Frontend_Documentation.md).
3. **Core Pages & Features:** Read Part 4 (Buyer & Seller workflows).
4. **API & Authentication:** Read Part 7 & Part 8.
5. **Interview Preparation:** Review the 35+ Q&A in Part 14 and keep this Quick Revision sheet handy.

---
*End of Frontend Quick Revision Guide.*
