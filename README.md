# Park-EZ: Campus Parking Spot Availability App

Park-EZ is a campus parking app that shows live deck, level, and spot availability for students, faculty, and staff.  
It was built by the Scrum & Coke team as a university project to make finding parking faster and less stressful.

This repo now contains a full stack implementation:

- React + Vite frontend (with Tailwind + shadcn-style UI)
- Fastify + MongoDB backend API
- MongoDB database (local via Docker, local install, or MongoDB Atlas)

You can run it in two modes:

- API mode (recommended) - real backend and MongoDB
- Mock mode - frontend only, using localStorage (no backend required)

---

## Features

- View all parking decks and their free/occupied counts
- Drill down deck -> level -> individual spots
- Spot types: Standard, EV, ADA
- Live-style availability: updates as you interact
- QR-like check in: type a spot label to reserve / release
- Incorrect status reporting (user can flag bad spot data)
- Authentication screens (login/register) wired to the backend API
- Theming and dark/light mode

---

## Tech Stack

| Layer      | Tech                                               | Purpose                         |
|-----------|----------------------------------------------------|---------------------------------|
| Frontend  | React 18, Vite, React Router, React Query          | SPA UI and data fetching        |
| Styling   | Tailwind CSS, shadcn-style UI components, Radix UI | Modern responsive styling       |
| Backend   | Fastify, @fastify/cors, dotenv                     | REST API server                 |
| Database  | MongoDB (Docker, local, or Atlas)                  | Persistent data storage         |
| Auth      | JWT, bcryptjs                                      | Simple email/password auth      |
| Tooling   | Vite, ESLint, Tailwind, concurrently               | DX and dev workflows            |

---

## Project Structure

High-level layout:

```bash
parkez/
├─ src/                 # Frontend (React + Vite)
│  ├─ App.jsx
│  ├─ main.jsx
│  ├─ index.css
│  ├─ api.js           # Frontend data layer (API or mock/localStorage)
│  ├─ mockData.js      # Frontend seed data for mock mode
│  ├─ components/
│  │   ├─ layout/      # Header, MainLayout, etc
│  │   ├─ ui/          # Button, Card, Tabs, Toast, Tooltip, etc
│  │   ├─ DeckList.jsx
│  │   ├─ LevelView.jsx
│  │   └─ SpotGrid.jsx
│  ├─ pages/           # Login, Register, Dashboard, DeckSelection, etc
│  └─ contexts/        # AuthContext, ThemeContext
├─ server/              # Backend (Fastify + MongoDB)
│  ├─ index.js         # Server entry
│  ├─ config/
│  │   └─ database.js  # MongoDB connection helper
│  └─ routes/
│      ├─ auth.js
│      ├─ decks.js
│      ├─ levels.js
│      ├─ spots.js
│      └─ reports.js
├─ mockData/            # JSON seed data for MongoDB
│  ├─ decks.json
│  ├─ levels.json
│  ├─ spots.json
│  └─ export-mock-json.mjs
├─ scripts/
│  ├─ kill-port.js
│  └─ kill-port.sh
├─ docker-compose.yml   # Optional local MongoDB + mongo-express
├─ .env.example         # Example env vars (frontend + backend)
├─ ENV_SETUP.md         # Detailed env var docs
├─ DOCKER.md            # Docker-based MongoDB setup
├─ vite.config.js
├─ package.json
└─ README.md
````

---

## Prerequisites

* Node.js 20+
* npm
* Optional: Conda env if you do not control system Node
* One of:

  * Local MongoDB
  * Local MongoDB via Docker (docker-compose)
  * MongoDB Atlas cluster (hosted)

---

## 1. Clone the repo

```bash
git clone https://github.com/Park-EZ/parkez.git
cd parkez
```

---

## 2. Node environment

Using Conda (no sudo, recommended on shared machines):

```bash
conda create -n parkez nodejs=20 -c conda-forge -y
conda activate parkez
```

Or plain Node:

```bash
node -v && npm -v   # check versions
# Install Node LTS (v20+) if missing
```

---

## 3. Environment variables

Create a local env file from the example:

```bash
cp .env.example .env
```

Then open `.env` and adjust values to match your setup. The important ones are:

```env
# Frontend
VITE_PORT=5173
VITE_API_URL=http://localhost:3000
VITE_USE_API=true        # true = use backend API, false = pure mock/localStorage

# Backend
MONGODB_URI=...          # set to Docker/local/Atlas connection string
DB_NAME=ezpark

PORT=3000                # backend port
HOST=localhost           # or 0.0.0.0 if needed

CORS_ORIGINS=            # e.g. http://localhost:5173
JWT_SECRET=some-secret   # change for real deployments
```

See `ENV_SETUP.md` for more explanation of each variable and production notes. 

---

## 4. MongoDB options

You can run MongoDB in three different ways.

### 4a. Docker (local MongoDB with mongo-express UI)

This is the fastest way to stand up a dev database.

```bash
docker-compose up -d
docker-compose ps
```

This gives you:

* MongoDB at `mongodb://admin:password@localhost:27017/ezpark?authSource=admin`
* Mongo Express at [http://localhost:8081](http://localhost:8081) (login admin / admin)

Then set in `.env`:

```env
MONGODB_URI=mongodb://admin:password@localhost:27017/ezpark?authSource=admin
DB_NAME=ezpark
```

More details and troubleshooting are in `DOCKER.md`. 

---

### 4b. Local MongoDB install

If you installed MongoDB yourself:

1. Start MongoDB (service or `mongod`)
2. In `.env`, point to it:

```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=ezpark
```

You can use MongoDB Compass to connect and inspect the database.

---

### 4c. MongoDB Atlas (cloud)

If you have a hosted Atlas cluster:

1. Create a database user with read/write access
2. Add your IP (or `0.0.0.0/0` for testing only) to the Network Access list
3. Copy the connection string from Atlas, then in `.env`:

```env
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/ezpark?retryWrites=true&w=majority
DB_NAME=ezpark
```

---

## 5. Seed the database with mock data

You have three JSON seed files under `mockData/`:

* `decks.json`
* `levels.json`
* `spots.json`

There are two common ways to import:

### Option A - Use MongoDB Compass

1. Connect to your MongoDB
2. Create or select database `ezpark`
3. Create collections `decks`, `levels`, `spots`
4. For each collection:

   * Click "Add Data" -> "Import JSON"
   * Pick the matching file in `mockData/`

### Option B - Use a Node script (importAll)

If you created `scripts/importAll.mjs` during setup, you can point it at your MongoDB URI and run:

```bash
node scripts/importAll.mjs
```

This will insert the contents of `mockData/decks.json`, `mockData/levels.json`, and `mockData/spots.json` into the `ezpark` database, recreating the collections each time.

---

## 6. Install dependencies

From the project root:

```bash
npm install
cd server
npm install
cd ..
```

This installs frontend dependencies and backend dependencies. 

---

## 7. Run the app in development

There is a combined dev script that runs backend and frontend together.

From the project root:

```bash
npm run dev
```

This will:

* Start the backend Fastify server (from `server/`) on port 3000
* Start the Vite dev server on port 5173

By default the frontend talks to the backend because `.env.example` sets `VITE_API_URL=http://localhost:3000` and `VITE_USE_API=true`. 

Then open in your browser:

```text
http://localhost:5173/
```

or, if you are on a remote machine, replace `localhost` with your server IP.

You should see the Park-EZ dashboard and be able to:

* Register / log in
* Choose a deck and level
* View spots and their statuses
* Report incorrect spot information

---

### Running only the frontend (mock/localStorage mode)

If you want to ignore the backend completely:

1. In `.env`, set:

   ```env
   VITE_USE_API=false
   ```

2. Restart the dev server:

   ```bash
   npm run dev
   ```

In this mode:

* No backend or MongoDB is required
* Data is stored in localStorage through `src/api.js` and `src/mockData.js`

---

### Run only one side (if needed)

Frontend only:

```bash
npm run dev:client
```

Backend only:

```bash
npm run dev:server
```

---

## 8. Build for production

To create an optimized frontend build:

```bash
npm run build
```

This writes the static frontend to `dist/`.

You can preview the production build locally:

```bash
npm run preview
```

Or serve `dist/` with your own static file server.

For a production deployment you would:

* Run the backend (`node server/index.js` or a process manager)
* Serve the built frontend from `dist/` behind a web server or static host
* Point `VITE_API_URL` to the reachable backend URL

---

## Useful scripts

From `package.json`:

| Command              | Description                       |
| -------------------- | --------------------------------- |
| `npm run dev`        | Run backend and frontend together |
| `npm run dev:client` | Frontend only (Vite)              |
| `npm run dev:server` | Backend only (Fastify)            |
| `npm run build`      | Build frontend for production     |
| `npm run preview`    | Preview built frontend            |
| `npm run lint`       | Run ESLint                        |
| `npm run kill:3000`  | Kill anything on port 3000        |
| `npm run kill:5173`  | Kill anything on port 5173        |

---

## Notes for deployment and security

* Change `JWT_SECRET` to a strong random value before any real use
* Use a secure MongoDB URI with proper credentials
* Lock down `CORS_ORIGINS` to your real frontend domains
* Never commit `.env` with real secrets to git
* For Docker-based MongoDB, change default admin/password if you expose it outside your machine

---

## License

This project is open-source for educational use.
You are welcome to fork, adapt, and extend it with attribution.
