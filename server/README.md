# EZpark Backend Server

Fastify + MongoDB backend API server for the EZpark application.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure MongoDB connection:**
   
   Create a `.env` file in the server directory (or root directory):
   ```env
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ezpark?retryWrites=true&w=majority
   
   # Database Name
   DB_NAME=ezpark
   
   # Server Configuration
   PORT=3000
   HOST=0.0.0.0
   ```

3. **Start MongoDB:**
   
   Make sure MongoDB is running locally, or use MongoDB Atlas:
   - Local: `mongod` (or start MongoDB service)
   - Atlas: Get connection string from MongoDB Atlas dashboard

4. **Run the server:**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

## MongoDB Connection Settings

The database connection is configured in `server/config/database.js`:

- **MONGODB_URI**: Your MongoDB connection string
  - Local: `mongodb://localhost:27017`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/ezpark`
- **DB_NAME**: Database name (default: `ezpark`)

You can set these via environment variables:
- `MONGODB_URI` - MongoDB connection string
- `DB_NAME` - Database name

## API Routes

- `GET /api/decks` - Get all parking decks
- `GET /api/decks/:id` - Get deck by ID
- `GET /api/decks/:id/levels` - Get levels for a deck
- `GET /api/levels/:id/spots` - Get spots for a level
- `POST /api/spots/:id/check-in` - Check in to a spot
- `POST /api/spots/:id/check-out` - Check out of a spot
- `POST /api/spots/:id/toggle` - Toggle spot status
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/reports/spots/:id` - Report incorrect spot status

## Database Collections

- `decks` - Parking deck information
- `levels` - Parking level/floor information
- `spots` - Individual parking spots
- `spotSessions` - Active parking sessions
- `spotStateHistory` - History of spot state changes
- `spotReports` - User reports of incorrect statuses
- `users` - User accounts

