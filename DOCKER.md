# Docker Setup for MongoDB

This project includes Docker Compose configuration to run MongoDB locally.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Docker Compose installed

## Quick Start

1. **Start MongoDB:**
   ```bash
   docker-compose up -d
   ```

2. **Check if MongoDB is running:**
   ```bash
   docker-compose ps
   ```

3. **View MongoDB logs:**
   ```bash
   docker-compose logs -f mongodb
   ```

4. **Stop MongoDB:**
   ```bash
   docker-compose down
   ```

5. **Stop and remove volumes (delete all data):**
   ```bash
   docker-compose down -v
   ```

## Services

### MongoDB
- **Port:** `27017`
- **Username:** `admin`
- **Password:** `password`
- **Database:** `ezpark`
- **Connection String:** `mongodb://admin:password@localhost:27017/ezpark?authSource=admin`

### Mongo Express (Web UI)
- **URL:** http://localhost:8081
- **Username:** `admin`
- **Password:** `admin`

## Environment Variables

Update your `.env` file with:

```env
MONGODB_URI=mongodb://admin:password@localhost:27017/ezpark?authSource=admin
DB_NAME=ezpark
```

## Accessing MongoDB

### Using MongoDB Shell (mongosh)
```bash
docker exec -it ezpark-mongodb mongosh -u admin -p password --authenticationDatabase admin
```

### Using Mongo Express
1. Open http://localhost:8081 in your browser
2. Login with username: `admin` and password: `admin`
3. Browse and manage your database through the web interface

### Using MongoDB Compass
Connect with:
- **Connection String:** `mongodb://admin:password@localhost:27017/?authSource=admin`
- Or use the connection string from your `.env` file

## Data Persistence

MongoDB data is persisted in Docker volumes:
- `mongodb_data` - Database files
- `mongodb_config` - Configuration files

Data will persist even if you stop the containers. To completely remove all data, use `docker-compose down -v`.

## Troubleshooting

### MongoDB won't start
```bash
# Check logs
docker-compose logs mongodb

# Restart the service
docker-compose restart mongodb
```

### Port already in use
If port 27017 is already in use, edit `docker-compose.yml` and change:
```yaml
ports:
  - "27018:27017"  # Use different external port
```

### Reset everything
```bash
# Stop and remove containers and volumes
docker-compose down -v

# Remove images (optional)
docker rmi mongo:7.0 mongo-express:latest

# Start fresh
docker-compose up -d
```

## Security Notes

⚠️ **For Development Only**: The default credentials (`admin/password`) are not secure. For production:
1. Change the passwords in `docker-compose.yml`
2. Update your `.env` file accordingly
3. Never commit `.env` files with real credentials to version control

