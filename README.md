# Park-EZ — Campus Parking Spot Availability App

**Park-EZ** is a lightweight web application that shows live campus parking availability for students, professors, and staff.  
It was built by **Scrum & Coke** as part of a university project to make finding parking faster and less stressful.

This version is a fully functional **React + Vite** demo using mock data (no backend required).  
The app simulates real-time updates, deck/level navigation, and QR check-ins/out, ready to connect to real sensors or APIs later.

---

## Features

- **View all parking decks** and their free/occupied spots.  
- **Drill down** by deck → level → individual spots.  
- **Spot types:** Standard, EV, ADA.  
- **Realtime simulation** of occupancy changes (mock “live” feed).  
- **QR check-in simulator:** type a spot label to reserve/release.  
- **Local persistence:** uses `localStorage` to keep state after refresh.  
- Modular architecture: UI components + mock API layer.

---

## Tech Stack

| Layer | Tech | Purpose |
|-------|------|----------|
| Frontend | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) | Fast SPA UI |
| Styling | Plain CSS | Lightweight styling |
| Mock Data | LocalStorage | Stand-in for real DB |
| Simulation | `setInterval()` + state updates | Mimics backend feed |

---

## Installation

### 1. Clone the repo
```bash
git clone https://github.com/Park-EZ/parkez.git
cd parkez
```

### 2. Create or activate your Node environment

If you’re using **Conda (no sudo)**:
```bash
conda create -n parkez nodejs=20 -c conda-forge -y
conda activate parkez
```

Or plain Node:
```bash
# Check if node/npm exist
node -v && npm -v
# If not, install Node LTS (v20+)
```
### 3. Ensure MongoDB is running on machine
```bash
Install MongoDB if not already on machine at https://www.mongodb.com/try/download/community
Ensure that MongoDB Compass is installed and open it
Create a new connection at mongodb://localhost:27017
```

### 4. Install dependencies
```bash
npm install
(also for good measure)
cd server
npm install
cd ..
```

### 5. Copy .env.example as .env
```bash
Copy .env.example into root project directory (/parkez/) as .env
```
---

## 6. Run the app (Development)

Start the Vite dev server:
```bash
npm run dev
```

If you’re running on a **remote Linux server**, make it visible to your network:
```bash
npx vite --host 0.0.0.0 --port 5173
```

Then open:
```
http://YOUR_SERVER_IP:5173/
```

You’ll see the **Park-EZ** dashboard with decks, levels, and spots.

---

## Build for Production

Generate an optimized build:
```bash
npm run build
```

This creates static files in the `dist/` directory.

You can serve them with any static web server, e.g.:
```bash
python -m http.server 8080 --directory dist
```

Then visit:
```
http://YOUR_SERVER_IP:8080/
```

---

## Project Structure

```
parkez/
├─ src/
│  ├─ components/        # Reusable UI pieces
│  │   ├─ Header.jsx
│  │   ├─ DeckList.jsx
│  │   ├─ LevelView.jsx
│  │   └─ SpotGrid.jsx
│  ├─ api.js             # Mock backend logic (CRUD + live simulation)
│  ├─ mockData.js        # Seed data for decks, levels, spots
│  ├─ App.jsx            # Root component
│  ├─ main.jsx           # Vite entry point
│  └─ styles.css         # Base styling
├─ index.html
├─ package.json
├─ vite.config.js
└─ README.md
```

---

## Scripts

| Command | Description |
|----------|--------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |
| `npm install` | Install dependencies |

---

## Environment & Deployment Notes

- Works entirely client-side (no backend needed).  
- Data is stored in `localStorage`, every browser session is persistent.  
- The `api.js` layer can be swapped out for real API calls to a **Fastify** backend or a REST service.  
- To deploy, simply upload the `/dist` folder to any static host (GitHub Pages, Netlify, S3, etc).

---

## Future Enhancements

-  Replace mock data with real IoT sensor or camera feeds.  
-  Add authentication for staff/student roles.  
-  Integrate real QR code scanning using `getUserMedia` + `jsQR`.  
-  Add backend with **Fastify + MongoDB** for real sessions & analytics.  
-  Show deck-level congestion and estimated time to find parking.
- 
---

## License
This project is open-source for educational use.  
Feel free to fork, adapt, and extend with attribution.

---
