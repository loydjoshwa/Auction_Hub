## 1. Home Page

### Purpose
Main page for users to discover auctions and categories.

### Actions
- Search auctions
- Browse categories
- View auction
- View ending-soon auctions
- Place bid
- Add to watchlist
- View notifications
- Navigate to seller section

### APIs
- GET /api/auctions
- GET /api/categories
- GET /api/auctions/:id
- POST /api/auctions/:id/bids
- POST /api/watchlist
- DELETE /api/watchlist/:auctionId
- GET /api/notifications

### Database
- users
- categories
- auctions
- auction_images
- bids
- watchlists
- notifications


********************************************************************************************


## 2. Browse Auctions

### Purpose
Browse, search, filter, and sort available auctions.

### Actions
- Search auctions
- Filter by category
- Filter by price
- Filter by status
- Sort auctions
- View auction
- Place bid
- Add/remove from watchlist
- Change page

### APIs
- GET /api/auctions
- GET /api/auctions/:id
- POST /api/auctions/:id/bids
- POST /api/watchlist
- DELETE /api/watchlist/:auctionId

### Database
- auctions
- auction_images
- categories
- bids
- watchlists

*********************************************************************


## 3. Search Results Page

### Purpose
Display auctions matching the user's search and filters.

### Actions
- Search auctions
- Filter by condition
- Filter by model
- Filter by storage
- Filter by price range
- Sort by ending soonest
- View auction
- Place bid
- Add/remove from watchlist
- Change page
- Save search

### APIs
- GET /api/auctions
- GET /api/auctions/:id
- POST /api/auctions/:id/bids
- POST /api/watchlist
- DELETE /api/watchlist/:auctionId

### Database
- auctions
- auction_images
- categories
- bids
- watchlists

*******************************************************************************

## 4. Auction Details Page

### Purpose
View complete auction information and allow the user to place a bid.

### Actions
- View auction details and images
- View seller information
- View current bid and bid count
- View time remaining
- View bid history
- Enter bid amount
- Place bid
- Add/remove from watchlist
- Share auction
- Report auction

### APIs
- GET /api/auctions/:id
- GET /api/auctions/:id/bids
- POST /api/auctions/:id/bids
- POST /api/watchlist
- DELETE /api/watchlist/:auctionId
- POST /api/reports

### Database
- auctions
- auction_images
- sellers
- users
- bids
- watchlists
- reports

**********************************************************************


## 5. My Bids Page

### Purpose
View and manage the user's active and past bids.

### Actions
- View active bids
- View won bids
- View lost bids
- Search bids
- View current highest bid
- View bid status
- Open auction
- Place another bid
- View bidding statistics

### APIs
- GET /api/users/my-bids
- GET /api/auctions/:id
- POST /api/auctions/:id/bids

### Database
- bids
- auctions
- auction_images

***********************************************************************


## 6. My Orders Page

### Purpose
View auctions won by the user and their order records.

### Actions
- View orders
- View order details
- View winning auction
- View order status

### APIs
- GET /api/orders
- GET /api/orders/:id
- GET /api/auctions/:id

### Database
- orders
- auctions
- auction_images

**************************************************************

## 7. Notifications Page

### Purpose
View auction and account notifications.

### Actions
- View notifications
- Filter notifications
- Mark notification as read
- Mark all as read
- Open related auction/order

### APIs
- GET /api/notifications
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all

### Database
- notifications
- auctions
- orders

******************************************************************


## 8. Profile Page

### Purpose
View and update the user's personal information.

### Actions
- View profile
- Edit name, email, phone number
- Change password
- Save profile changes
- View account statistics

### APIs
- GET /api/users/profile
- PUT /api/users/profile
- PUT /api/users/password

### Database
- users

******************************************************************


## 9. Seller Dashboard

### Purpose
Main control page for sellers to view auction activity and manage selling activities.

### Actions
- View sales/auction statistics
- View active auctions
- View total bids
- View seller earnings/auction results
- View high-value active auctions
- Create auction
- View listings
- View orders
- View recent activity

### APIs
- GET /api/sellers/dashboard
- GET /api/auctions?my_listings=true
- POST /api/auctions
- GET /api/orders/seller

### Database
- sellers
- auctions
- bids
- orders


***************************************************


## 10. Preview Listing Page

### Purpose
Review an auction listing before publishing it.

### Actions
- Preview auction details
- Review uploaded images
- Check listing validation
- Review starting bid
- Edit listing
- Confirm and publish auction

### APIs
- GET /api/auctions/:id
- PUT /api/auctions/:id
- POST /api/auctions/:id/publish

### Database
- auctions
- auction_images
- sellers


***************************************************


## 11. Create Auction Page

### Purpose
Allow sellers to create and publish a new auction listing.

### Actions
- Upload auction images
- Enter title
- Select category
- Select condition
- Enter description
- Set starting bid
- Set reserve price
- Set start/end time
- Save draft
- Preview listing
- Publish auction

### APIs
- POST /api/auctions
- POST /api/auctions/:id/images
- PUT /api/auctions/:id
- POST /api/auctions/:id/publish
- GET /api/auctions/:id

### Database
- auctions
- auction_images
- categories
- sellers

*********************************************************************

## 12. Manage Auctions Page

### Purpose
Allow sellers to view and manage their auction listings.

### Actions
- View active auctions
- View drafts
- View scheduled auctions
- View sold/ended auctions
- Search auctions
- Filter auctions
- Create new auction
- Edit auction
- View auction details

### APIs
- GET /api/sellers/auctions
- GET /api/auctions/:id
- PUT /api/auctions/:id
- POST /api/auctions

### Database
- auctions
- auction_images
- bids
- categories
- sellers

******************************************************


## 13. Seller Orders Page

### Purpose
Allow sellers to view and manage orders from their completed auctions.

### Actions
- View seller orders
- Search orders
- Filter orders
- View order details
- View winning buyer and final bid amount
- View order status

### APIs
- GET /api/orders/seller
- GET /api/orders/:id
- PUT /api/orders/:id/status

### Database
- orders
- auctions
- bids
- users
- sellers


******************************************************************************

## 15. Seller Verification Page

### Purpose
Allow users to submit their information and identity documents for seller verification before they can start selling.

### Actions
- View verification status
- Enter personal information
- Enter business information
- Select document type
- Enter document number
- Upload verification document
- Save verification details
- Submit verification request
- View verification status

### APIs
- GET /api/sellers/verification
- POST /api/sellers/verification
- PUT /api/sellers/verification
- POST /api/sellers/verification/document

### Database
- users
- sellers
- seller_verifications

*******************************************************

## 16. Seller Profile Page

### Purpose
Allow sellers to view and manage their seller and store information.

### Actions
- View seller profile
- View seller information
- Edit name, email, and phone number
- View store information
- Edit store name
- Edit store description
- Upload store logo
- Upload store banner
- View seller verification status
- View store status
- View seller statistics
- Save profile changes

### APIs
- GET /api/sellers/profile
- PUT /api/sellers/profile
- POST /api/sellers/logo
- POST /api/sellers/banner
- GET /api/sellers/dashboard

### Database
- users
- sellers
- auctions
- bids

*************************************************


## 17. Messages Page

### Purpose
Allow buyers and sellers to communicate about auctions.

### Actions
- View conversations
- Search conversations
- Open a conversation
- View previous messages
- Send messages
- View unread messages
- View related auction
- View message timestamps

### APIs
- GET /api/chat/conversations
- GET /api/chat/conversations/:id/messages
- POST /api/chat/conversations/:id/messages
- PUT /api/chat/messages/:id/read

### Database
- conversations
- messages
- users
- sellers
- auctions

************************************