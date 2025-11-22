# Park‑EZ User Manual

This manual will explain how to install/deploy our application (Park‑EZ), its main features, and provide step‑by‑step walkthroughs for common scenarios, including screenshots.

## 1. Introduction
- Park‑EZ is a web application used to monitor parking availability, check into spots using QR scans, and report incorrect statuses.
- Audience: Parking facility staff, admins, and student registered drivers/commuters.
- Architecture Overview: React/Vite frontend, Fastify (Node.js) backend, MongoDB database.

## 2. System Requirements
- Backend:
  - Node.js v18+ and npm v9+
  - MongoDB v6+ reachable via `MONGODB_URI` (default `mongodb+srv://ali_db_user:TD2hx3ccIOF5GU4H@cluster0.bxgaj5f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=ezpark`)
  - Optional env vars: `PORT` (default 3000), `HOST` (default 0.0.0.0), `DB_NAME` (default ezpark), `CORS_ORIGINS` (e.g., http://localhost:5173)
- Frontend:
  - Modern browser (Chrome/Edge/Firefox/Safari – latest two versions)
  - Network access to backend API URL (default `http://localhost:3000`)

## 3. Installation & Deployment
### 3.1. Clone and Install
```bash
# Clone repository
git clone https://github.com/Park-EZ/parkez.git
cd parkez

# Install frontend deps (root)
npm install

# Install backend deps
cd server
npm install
cd ..
```

### 3.2. Configure Environment
Create a `.env` file if not already create(loaded by the backend) at the project root (parent of `server/` index) with the following settings:
```

VITE_PORT=5173
VITE_API_URL=http://localhost:3000
VITE_USE_API=true

MONGODB_URI=mongodb+srv://ali_db_user:TD2hx3ccIOF5GU4H@cluster0.bxgaj5f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=ezpark

PORT=3000
CORS_ORIGINS=http://localhost:5173
```

### 3.3. Start Services
```bash
# From project root /parkez/
npm run dev
```
- Backend health: `GET http://localhost:3000/health` → `{ status: "ok", timestamp: ... }`
- Frontend dev server: `http://localhost:5173`
- If the backend fails to run, it may be due to a firewall/network issue. Please try using a different internet connection such as a hotspot.
- If still not working, the option to run and import local data may be necessary

### 3.4. Initial Data
- This step is unecessary if you were able ot connect to the above Atlas cluster
- Mock data lives under `mockData/`.
- If you add a seed endpoint, run it once to populate `decks`, `levels`, and `spots`.
- Alternatively, import JSON into MongoDB manually using your preferred tooling.

## 4. Main Features
- Deck and Level Browsing: Choose a deck, then navigate levels.
- Real‑Time Availability: Color‑coded tiles (Green = Free, Red = Occupied).
- Search and Filters: Find specific spot labels, filter by type (Standard, EV, ADA).
- QR Check‑In/Out: Record sessions when a user occupies/leaves a spot.
- Reporting: Submit reports for incorrect spot statuses.
- Account Basics: Registration/Login foundation (extendable to full auth flows).
- Theming: Light/Dark mode selection.
- Feedback: Toast notifications confirm actions.

## 5. Data Model (Simplified)
- Deck: `{ _id, name, address }`
- Level: `{ _id, deckId, name, index }`
- Spot: `{ _id, levelId, label, type, status }`
- Spot Session: `{ spotId, userEmail, startedAt, endedAt, source }`
- User: `{ _id, email, name, password }` (password stored as bcrypt hash)
- State History: `{ _id or spotId, at, state, reason }`
- Report: `{ _id, spotId, reportType, notes, createdAt }`

## 6. Main Scenario Walkthrough: View Availability

1) Login or Register
- Go to `/login` and enter credentials. New users can register at `/register`.

Login Page:
![Login page](img/loginpage.png)

Register Page:
![Register page](img/registerpage.png)

Once you have created a new user account (or have an existing account), please login using the login page and the Log In button.

2) Navigate to Deck Selection
Main Screen:
![Main page](img/mainpage.png)

- Choose a deck to view details and availability.

3) View Spot Availability for Deck
- Open `/decks/:deckId/availability`.
- Each deck has a summary that shows overview information
Deck Selection Page:
![DS page](img/deck2.png)

4) Select Level
- Choose the level that you would like to view spot availibility for, showing total and available spots
Level Selection Page:
![LS page](img/level2.png)

5) Spot Availability
- Green tile = Free; Red tile = Occupied.
- This is how to view availbility in a chosen deck. The check-in to a spot scenario will be outlined in the next section.
Spot Viewing Page
![Spots page](img/spots.png)


## 7. Additional Scenario 1: QR Check‑In
Purpose: Record when a driver occupies a spot and when they leave.

1) Store User Email (simple flow)
- After login, persist email in browser storage (e.g., `localStorage.setItem('userEmail', email)`).
- Navigate to the QR Code Scanner Page
Main Page:
![Main page](img/mainmobile.png)

QR Code Scanner Page:
![QR page](img/QRscan.png)

2) Check‑In
- Scan a QR code linked to a specific `spotId`.
- Frontend sends `POST /api/spots/:spotId/check-in` with `{ email }`.
- Backend updates the spot to `status: "occupied"` and inserts a session document.

4) Visual Confirmation
- The Availability view updates (occupied by you → blue, occupied → red, free → green).
Spots page:
![QR page](img/checkinmobile.png)
![QR page](img/mainaftercheckin.png)

## 8. Additional Scenario 2: Reporting Incorrect Status
Purpose: Let users flag discrepancies (e.g., app shows occupied but physically free).

1) Open Report Interface
- Navigate to `/report` or open a report action near a spot.
![Main page](img/mainmobile.png)

2) Submit Report
- Enter the spot label (for example: L1-001)
- Choose `reportType` (e.g., Incorrect occupancy, Blocked, Etc.).
- Add notes (optional) and submit; frontend POSTs to `/api/spots/:spotId/report`.
![Report page](img/reportmobile.png)

3) Admin Review
- Admins can review reports and resolve by manual toggling or further checks (within MongoDB).
![Mongo page](img/mongoreport.png)

## 9. Troubleshooting
- App shows Occupied but DB says Free:
  - Check UI queries at `GET /api/levels/:levelId/spots`.
  - Verify that check‑in sessions or manual toggles haven’t reset the status.
- API 404/Network errors:
  - Ensure backend is running at `PORT` and `HOST` expected by `VITE_API_URL`.
- CORS problems:
  - Use `CORS_ORIGINS` to allow frontend origin in development.
- User context missing:
  - Add/enable auth middleware (e.g., JWT) to populate `request.user`.
- Sessions not ending:
  - Ensure checkout finds the active session (`spotId` + `endedAt: null`) and updates `endedAt`.

## 10. Security & Extensions
- Passwords hashed using `bcryptjs`.
- Add JWT authentication and role‑based access control for admin actions.
- Future enhancements: analytics dashboards, notifications, EV usage limits.

## 11. Maintenance & Integrity
- Prune old sessions (by checking `endedAt`).
- Limit report submissions to reduce spam.
- Regular MongoDB backups.
- Use structured logs in production.

## 12. Glossary
- Spot: Individual parking location.
- Level: Floor/segment within a deck.
- Deck: Collection of levels.
- Session: Time‑boxed record of a spot being occupied.
- Report: User‑submitted correction/issue.