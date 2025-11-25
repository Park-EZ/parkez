# EZpark - Campus Parking Management System

A modern web application for real-time campus parking availability at UNC Charlotte. Built with React, Node.js, and MongoDB.

---

## Quick Start - Running Locally

### Prerequisites
- **Node.js** 18+ (with npm)
- **MongoDB** 4.4+
- **Git**

### 1. Clone and Install

```bash
# Clone repository
git clone <your-repo-url>
cd parkez

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew install mongodb-community
brew services start mongodb-community

# Or install MongoDB (Ubuntu/Linux)
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Option B: Docker MongoDB**
```bash
# Start MongoDB with Docker Compose
docker-compose up -d
```

### 3. Configure Environment

Create `.env` file in project root:
```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:3000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017
DB_NAME=ezpark

# OR for Docker:
# MONGODB_URI=mongodb://admin:password@localhost:27017/ezpark?authSource=admin

# JWT Secret (change in production)
JWT_SECRET=your-secret-key-change-in-production
```

### 4. Seed Database

```bash
# Import parking data
cd server
npm run import
cd ..
```

### 5. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev

# Backend: http://localhost:3000
# Frontend: http://localhost:5173
```

### 6. Access Application

Open browser to: **http://localhost:5173**

Default test account:
- Email: `test@uncc.edu`
- Password: `password123`

Or register a new account.

---

## Production Deployment

### Using Docker

```bash
# Build and run production containers
docker-compose -f docker-compose.prod.yml up -d

# Application will be available on port 3000
```

### Manual Deployment

```bash
# Build frontend
npm run build

# Frontend build output: dist/
# Serve dist/ folder with any static file server

# Backend
cd server
NODE_ENV=production npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=<your-production-mongodb-uri>
DB_NAME=ezpark
JWT_SECRET=<strong-secret-key>
PORT=3000
```

---

## Project Structure

```
parkez/
├── src/                      # Frontend React application
│   ├── api.js               # API client functions
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # React entry point
│   ├── components/          
│   │   ├── CampusMap.jsx    # Interactive 3D campus map
│   │   ├── SpotGrid.jsx     # Parking spot visualization
│   │   ├── layout/          # Layout components (Header, Nav, etc)
│   │   └── ui/              # Reusable UI components
│   ├── contexts/            # React contexts (Auth, Theme, Preferences)
│   ├── pages/               # Route pages
│   │   ├── Dashboard.jsx    # Main dashboard with map & current spot
│   │   ├── DeckSelection.jsx    # List of parking decks
│   │   ├── LevelsView.jsx       # Levels within a deck
│   │   ├── SpotAvailability.jsx # Individual parking spots
│   │   ├── QRScanner.jsx        # QR code scanner
│   │   ├── Login.jsx & Register.jsx
│   │   ├── Profile.jsx
│   │   └── ReportStatus.jsx
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Utility functions
│
├── server/                   # Backend Node.js API
│   ├── index.js             # Server entry point
│   ├── config/
│   │   └── database.js      # MongoDB connection & schema
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── routes/              # API endpoints
│   │   ├── auth.js          # Login/register/logout
│   │   ├── decks.js         # Parking decks
│   │   ├── levels.js        # Deck levels
│   │   ├── spots.js         # Parking spots & sessions
│   │   ├── reports.js       # Issue reporting
│   │   └── users.js         # User management
│   └── utils/               # Helper functions
│
├── mockData/                 # Initial parking data (JSON)
├── public/                   # Static assets
│   ├── images/              # Campus and deck images
│   └── qrcodes/             # QR codes for spots
├── scripts/                  # Utility scripts
└── docker-compose.yml        # Docker configuration
```

---

## Key Components Explained

### Frontend Components

#### **CampusMap.jsx**
Interactive 3D map showing all parking decks on campus.
- Uses **Maplibre GL** for 3D rendering
- Clickable markers for each parking deck
- **Navigate to Deck** button opens device's maps app (Apple Maps on iOS, Google Maps on Android/Desktop)
- Navigates to deck levels when clicked
- Real GPS coordinates for accuracy

#### **SpotGrid.jsx**
Displays parking spots in realistic deck layout.
- Vertical columns with central driving lane
- Color-coded spots:
  - **Green** = Available
  - **Blue** = Your occupied spot
  - **Red** = Occupied by others
- Real-time updates every second
- Click to check-in/check-out

#### **Dashboard.jsx**
Main dashboard showing:
- Currently occupied spot (if any)
- Interactive campus map
- Quick navigation to all features

#### **QRScanner.jsx**
QR code scanner for quick check-in/check-out.
- Camera-based scanning
- Handles spot conflicts
- Works on mobile devices

### Backend API

#### **Spots API** (`routes/spots.js`)
Core functionality for parking spot management:
- **GET `/api/spots/my-spot`** - Get current user's spot
- **POST `/api/spots/:id/check-in`** - Check in to a spot
- **POST `/api/spots/:id/check-out`** - Check out of a spot
- **POST `/api/spots/:id/toggle`** - Toggle spot status
- **Atomic operations** prevent race conditions
- Tracks spot sessions and history

#### **Auth API** (`routes/auth.js`)
User authentication:
- **POST `/api/auth/register`** - Create new account
- **POST `/api/auth/login`** - Login with JWT
- **POST `/api/auth/logout`** - Logout
- **GET `/api/auth/me`** - Get current user
- Uses **bcrypt** for password hashing
- **JWT tokens** for session management

#### **Database** (`config/database.js`)
MongoDB connection and schema:
- Auto-creates 7 collections (decks, levels, spots, users, sessions, history, reports)
- Optimized indexes for fast queries
- Connection pooling for performance

---

## Important Features

### Real-Time Updates
- Spots page refreshes every 1 second
- Dashboard refreshes every 30 seconds
- Prevents race conditions with atomic DB operations

### Race Condition Handling
- **Atomic `findOneAndUpdate`** prevents double-booking
- Pre-check validation before check-in
- Clear error messages when spot is taken

### Mobile Optimization
- Responsive design for all screen sizes
- Fixed viewport prevents page zoom
- Safe area insets for notched devices
- Bottom nav bar always visible
- Touch-optimized interactions

### Navigation Integration
- **One-click navigation** to parking decks from map
- Automatically detects device platform (iOS/Android/Desktop)
- Opens native maps app with turn-by-turn directions
- iOS: Opens Apple Maps
- Android: Opens Google Maps via geo URI
- Desktop: Opens Google Maps in browser

### Security
- JWT authentication on protected routes
- Password hashing with bcrypt
- User can only free their own spots
- Input validation on all endpoints

---

## Database Schema

### Collections

**decks** - Parking deck buildings
- `building-code`, `building-name`, `total-spaces`
- `latitude`, `longitude` for map display
- `aliases`, `contacts`, `address` info

**levels** - Levels within each deck
- `_id`, `deckId`, `index`, `name`

**spots** - Individual parking spaces
- `id`, `levelId`, `label`, `handicap`
- `user_id` (null = free, userId = occupied)
- `available`, `occupiedAt`

**users** - App users
- `email` (unique), `name`, `password` (hashed)

**spotSessions** - Check-in/out sessions
- `spotId`, `userId`, `startedAt`, `endedAt`

**spotStateHistory** - Audit log of spot changes

**spotReports** - User-reported issues

---

## Available Scripts

```bash
# Development
npm run dev              # Start frontend + backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Production
npm run build            # Build frontend for production
npm run preview          # Preview production build

# Utilities
npm run kill:3000        # Kill process on port 3000
npm run kill:5173        # Kill process on port 5173
npm run kill:all         # Kill both ports

# Backend
cd server
npm run dev              # Start backend with auto-reload
npm run start            # Start backend (production)
npm run import           # Import parking data to MongoDB
```

---

## Tech Stack

### Frontend
- **React 19** - UI library
- **React Router 7** - Client-side routing
- **TanStack Query** - Data fetching & caching
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible components
- **Maplibre GL** - 3D mapping
- **ZXing** - QR code scanning
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Fastify** - Web framework
- **MongoDB** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Parking Data
- `GET /api/decks` - List all decks
- `GET /api/decks/:id/levels` - Get levels in a deck
- `GET /api/decks/:id/availability` - Get deck availability
- `GET /api/levels/:id/spots` - Get spots in a level
- `GET /api/levels/:id/availability` - Get level availability

### Spot Management
- `GET /api/spots/my-spot` - Get user's current spot
- `POST /api/spots/:id/check-in` - Check in to spot
- `POST /api/spots/:id/check-out` - Check out of spot
- `POST /api/spots/:id/toggle` - Toggle spot status

### Reporting
- `POST /api/spots/:id/report` - Report incorrect status
- `GET /api/reports` - Get user's reports

---

## Authentication Flow

1. User registers with email/password
2. Password is hashed with bcrypt (10 rounds)
3. Login returns JWT token
4. Token stored in localStorage
5. Token sent in Authorization header: `Bearer <token>`
6. Backend middleware validates token on protected routes

---

## Mobile Features

- **Viewport locked** - No accidental page zoom
- **Safe area support** - Works with notched devices
- **Touch optimized** - Large tap targets
- **Responsive layout** - Adapts to all screen sizes
- **Bottom navigation** - Always visible, never clipped

---

## User Workflows

### Finding a Parking Spot
1. Login to dashboard
2. View interactive 3D campus map
3. Click on a parking deck marker
4. **Optional:** Click "Navigate to Deck" to open directions in your maps app
5. Click "View Levels & Spots" to see deck details
6. Select a level
7. View available spots (green)
8. Click spot to check-in

### Using QR Scanner
1. Go to parking spot
2. Tap "Scan" in bottom nav
3. Scan QR code on parking sign
4. Auto check-in/check-out

### Freeing Your Spot
1. View dashboard
2. Click "Free This Spot" on occupied spot card
3. Confirm action
4. Spot becomes available to others

---

## Testing

### Create Test Data
```bash
# Import mock data
cd server
npm run import
```

### Test Accounts
Register through the app or use:
- Email: `test@uncc.edu`
- Password: `password123`

---

## Notes

- Spots auto-refresh every second for real-time availability
- Map uses free OpenStreetMap tiles (no API key needed)
- Race conditions prevented with atomic DB operations
- All times displayed in user's local timezone
- Mobile-first responsive design

---

## Contributing

Built by **Scrum & Coke** team for ITCS-8112 SSDI course project at UNC Charlotte.

---

## License

ISC

