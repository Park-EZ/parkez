# Environment Variables Setup

This project uses environment variables for configuration. Follow these steps to set up your `.env` file.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   - Update MongoDB connection string
   - Set API URL if different from default
   - Configure other settings as needed

## Environment Variables

### Frontend Variables (Vite)

**VITE_PORT**
- Default: `5173`
- Description: Frontend development server port
- Example: `VITE_PORT=5173`
- ⚠️ **Important:** This must be different from the backend `PORT` (3000)

**VITE_API_URL**
- Default: `http://localhost:3000`
- Description: Backend API server URL
- Example: `VITE_API_URL=http://localhost:3000`

**VITE_USE_API**
- Default: `false`
- Description: Set to `true` to use the backend API instead of localStorage
- Example: `VITE_USE_API=true`

> **Note:** Vite only exposes environment variables prefixed with `VITE_` to the client-side code.

### Backend Variables (Node.js)

**MONGODB_URI**
- Default: `mongodb://localhost:27017`
- Description: MongoDB connection string
- Examples:
  - Docker: `mongodb://admin:password@localhost:27017/ezpark?authSource=admin`
  - Local: `mongodb://localhost:27017`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/ezpark`

**DB_NAME**
- Default: `ezpark`
- Description: MongoDB database name

**PORT**
- Default: `3000`
- Description: Backend server port

**HOST**
- Default: `0.0.0.0`
- Description: Backend server host

**CORS_ORIGINS**
- Default: (empty - allows all origins)
- Description: Comma-separated list of allowed CORS origins
- Example: `CORS_ORIGINS=http://localhost:5173,http://localhost:3000`

**JWT_SECRET**
- Default: `your-secret-key-here`
- Description: Secret key for JWT token signing (change in production!)

## Usage

### Development

1. Create `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Update values as needed

3. Frontend will automatically load `VITE_*` variables

4. Backend will automatically load all variables (via dotenv)

### Production

For production deployments:

1. Set environment variables in your hosting platform:
   - **Vercel/Netlify**: Use dashboard settings
   - **Docker**: Use `docker-compose.yml` or `.env` file
   - **Heroku**: Use `heroku config:set`

2. Never commit `.env` files to version control

3. Use secure values for:
   - `JWT_SECRET` - Use a strong random string
   - `MONGODB_URI` - Use proper authentication
   - `CORS_ORIGINS` - Restrict to your domain(s)

## Testing Environment Variables

### Frontend
```javascript
// In browser console or code:
console.log(import.meta.env.VITE_API_URL)
```

### Backend
```javascript
// In server code:
console.log(process.env.MONGODB_URI)
```

## Troubleshooting

**Frontend variables not working:**
- Ensure variable name starts with `VITE_`
- Restart Vite dev server after changing `.env`
- Check variable name spelling

**Backend variables not loading:**
- Ensure `.env` file is in project root (same level as `server/` folder)
- Restart Node.js server after changing `.env`
- Check that `dotenv` is installed and imported

**MongoDB connection issues:**
- Verify MongoDB is running
- Check connection string format
- Ensure authentication credentials are correct

