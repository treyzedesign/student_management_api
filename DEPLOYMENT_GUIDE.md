# School Management System - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Installation and Startup](#installation-and-startup)
6. [Production Deployment](#production-deployment)
7. [Docker Deployment](#docker-deployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Operating System**: Windows, macOS, Linux
- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher (comes with Node.js)
- **MongoDB**: v4.0 or higher
- **Redis**: v5.0 or higher
- **RAM**: Minimum 2GB
- **Disk Space**: Minimum 5GB

### Required Tools
```bash
# Install Node.js and npm
# Download from: https://nodejs.org/

# Verify installation
node --version    # Should return v14.0.0 or higher
npm --version     # Should return v6.0.0 or higher
```

### Development Tools (Optional)
- Git for version control
- Postman or Insomnia for API testing
- MongoDB Compass for database visualization
- VS Code or preferred IDE

---

## Local Development Setup

### Step 1: Clone or Download Project

```bash
# If using git
git clone <repository-url>
cd axion

# If downloading as ZIP
unzip axion.zip
cd axion
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Verify installation
npm list
```

### Step 3: Install MongoDB Locally (if not already installed)

#### Windows
```
1. Download installer: https://www.mongodb.com/try/download/community
2. Run the installer
3. Complete the setup wizard
4. MongoDB will start automatically
5. Verify: mongosh --version
```

#### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu)
```bash
# Add MongoDB repository
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 4: Install Redis Locally (if not already installed)

#### Windows
```
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Extract and run redis-server.exe
3. Or use Windows Subsystem for Linux (WSL) for native Redis
```

#### macOS
```bash
# Using Homebrew
brew install redis
brew services start redis
```

#### Linux (Ubuntu)
```bash
# Install Redis
sudo apt-get update
sudo apt-get install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## Environment Configuration

### Step 1: Create .env File

```bash
# Copy the template (if provided)
cp .env.example .env

# Or create new .env file
touch .env
```

### Step 2: Configure Environment Variables

Edit `.env` file with the following required variables:

```env
# Service Configuration
SERVICE_NAME=axion
USER_PORT=30100
ADMIN_PORT=5222
ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/school_management

# Redis Configuration
REDIS_URI=redis://localhost:6379
CORTEX_REDIS=redis://localhost:6379
CORTEX_PREFIX=sms:cortex
CORTEX_TYPE=axion
OYSTER_REDIS=redis://localhost:6379
OYSTER_PREFIX=sms:oyster
CACHE_REDIS=redis://localhost:6379
CACHE_PREFIX=sms:cache

# JWT Secrets (Generate secure random strings)
LONG_TOKEN_SECRET=your_long_token_secret_here_min_64_chars
SHORT_TOKEN_SECRET=your_short_token_secret_here_min_64_chars
NACL_SECRET=your_nacl_secret_here_min_32_chars
```

### Step 3: Generate Secure Secrets

```bash
# Generate secure random strings for secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Replace the values in `.env` with generated secrets.

### Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| SERVICE_NAME | Service identifier | axion |
| USER_PORT | API server port | 30100 |
| ENV | Environment type | development, production |
| MONGO_URI | MongoDB connection | mongodb://localhost:27017/school_management |
| REDIS_URI | Redis connection | redis://localhost:6379 |
| LONG_TOKEN_SECRET | JWT long token secret | (64-char hex) |
| SHORT_TOKEN_SECRET | JWT short token secret | (64-char hex) |
| NACL_SECRET | Encryption secret | (32-char hex) |

---

## Database Setup

### Step 1: Verify MongoDB Connection

```bash
# Test connection to local MongoDB
mongosh --eval "db.version()"

# Should output MongoDB server version
```

### Step 2: Create Database

```bash
# Connect to MongoDB shell
mongosh

# Create database (if not exists)
use school_management

# Create initial collections
db.createCollection("users")
db.createCollection("schools")
db.createCollection("classrooms")
db.createCollection("students")

# Create indexes
db.users.createIndex({ username: 1 })
db.users.createIndex({ email: 1 })
db.users.createIndex({ schoolId: 1 })
db.schools.createIndex({ name: 1 })
db.schools.createIndex({ adminId: 1 })
db.classrooms.createIndex({ schoolId: 1 })
db.classrooms.createIndex({ "grade": 1, "section": 1 })
db.students.createIndex({ schoolId: 1, classroomId: 1 })
db.students.createIndex({ admissionNumber: 1 })

# Verify collections created
show collections

# Exit shell
exit
```

### Step 3: Verify Redis Connection

```bash
# Test Redis connection
redis-cli ping

# Should output: PONG
```

---

## Installation and Startup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd axion

# Install all dependencies
npm install

# Should complete without errors
```

### Step 2: Start Development Server

```bash
# Start the application
npm start
# or
node index.js

# You should see output like:
# 💾 Mongoose default connection open to mongodb://localhost:27017/school_management
# AXION is running on port: 30100
```

### Step 3: Verify Server is Running

```bash
# In another terminal, test the API
curl http://localhost:30100/

# Or test with a specific endpoint
curl -X POST http://localhost:30100/api/auth/registerSuperAdmin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@test.com","password":"Test12345","confirmPassword":"Test12345"}'
```

### Step 4: Create Superadmin Account

```bash
# Use Postman, Insomnia, or curl

curl -X POST http://localhost:30100/api/auth/registerSuperAdmin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "email": "admin@school.com",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!"
  }'
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured for production
- [ ] Database backed up
- [ ] Redis cache cleared
- [ ] SSL/TLS certificates obtained
- [ ] Firewall rules configured
- [ ] Database user with limited permissions created
- [ ] Monitoring and logging configured
- [ ] Security scan completed
- [ ] Load balancer configured (if using)

### Step 1: Update Environment Configuration

Create `.env.production` file:

```env
SERVICE_NAME=School-Management-API
USER_PORT=3000
ENV=production

# Production MongoDB (use managed database service)
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/school_management?retryWrites=true&w=majority

# Production Redis (use managed Redis service)
REDIS_URI=redis://:password@redis-server:6379

# Generate new secure secrets for production
LONG_TOKEN_SECRET=<GENERATE_NEW_SECURE_STRING>
SHORT_TOKEN_SECRET=<GENERATE_NEW_SECURE_STRING>
NACL_SECRET=<GENERATE_NEW_SECURE_STRING>
```

### Step 2: Production Database Setup

#### Using MongoDB Atlas (Cloud)

```
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a project and cluster
3. Create database user with strong password
4. Get connection string: 
   mongodb+srv://username:password@cluster.mongodb.net/school_management
5. Update MONGO_URI in .env.production
6. Create indexes same as local setup
```

#### Using Managed MongoDB Service

```
1. Use your cloud provider's database service:
   - AWS DocumentDB
   - Azure CosmosDB
   - Google Cloud MongoDB Atlas
2. Configure network access and firewall
3. Create database and collections
4. Update MONGO_URI accordingly
```

### Step 3: Production Redis Setup

#### Using Redis Cloud

```
1. Create account at https://redis.com/try-free/
2. Create a database
3. Get connection string with password
4. Update REDIS_URI in .env.production
```

#### Using Managed Service

```
1. AWS ElastiCache
2. Azure Redis Cache
3. Google Cloud Memorystore
```

### Step 4: Deploy to Server

#### Using Node.js with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
cp .env.production .env
pm2 start index.js --name "school-api" --env production

# View logs
pm2 logs school-api

# Monitor
pm2 monit

# Set to restart on reboot
pm2 startup
pm2 save
```

#### Using Docker (Recommended)

See [Docker Deployment](#docker-deployment) section below.

### Step 5: Configure Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/school-api

upstream school_api {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.school-system.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.school-system.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/api.school-system.com.crt;
    ssl_certificate_key /etc/ssl/private/api.school-system.com.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_req zone=api_limit burst=200 nodelay;

    # Compression
    gzip on;
    gzip_types text/plain application/json;
    gzip_min_length 1000;

    # Proxy settings
    location / {
        proxy_pass http://school_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /app/public/;
        expires 365d;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/school-api /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### Step 6: Set Up SSL/TLS

```bash
# Using Certbot (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx

sudo certbot certonly --nginx -d api.school-system.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Docker Deployment

### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', {timeout: 5000}, (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "index.js"]
```

### Step 2: Create Docker Compose File

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: school-mongodb
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password
    ports:
      - "27017:27017"
    networks:
      - school-network

  redis:
    image: redis:7-alpine
    container_name: school-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - school-network

  api:
    build: .
    container_name: school-api
    restart: unless-stopped
    depends_on:
      - mongodb
      - redis
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      CONNECTION_STRING: mongodb://admin:secure_password@mongodb:27017/school_management
      REDIS_URI: redis://redis:6379
      LONG_TOKEN_SECRET: ${LONG_TOKEN_SECRET}
      SHORT_TOKEN_SECRET: ${SHORT_TOKEN_SECRET}
      NACL_SECRET: ${NACL_SECRET}
    volumes:
      - ./logs:/app/logs
    networks:
      - school-network

volumes:
  mongodb_data:
  redis_data:

networks:
  school-network:
    driver: bridge
```

### Step 3: Deploy with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

---

## Monitoring and Maintenance

### Application Monitoring

```bash
# Using PM2 monitoring
pm2 monit

# Using PM2 web dashboard
pm2 web
# Access at http://localhost:9615

# View logs
pm2 logs school-api

# Kill all
pm2 kill
```

### Database Monitoring

```bash
# MongoDB monitoring
# Use MongoDB Compass GUI or:
mongosh
use admin
db.stats()

# Monitor ongoing operations
db.currentOp()
```

### Memory and CPU Usage

```bash
# Using system tools
docker stats          # For Docker containers
pm2 monit             # For Node.js processes

# Or use monitoring services:
# - New Relic
# - DataDog
# - Prometheus
```

### Backup Strategy

#### Automated Backups

```bash
# MongoDB backup script (backup.sh)
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mongodump --uri="mongodb://admin:password@localhost:27017/school_management" \
          --out=$BACKUP_DIR/backup_$TIMESTAMP

# Compress backup
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz $BACKUP_DIR/backup_$TIMESTAMP
rm -rf $BACKUP_DIR/backup_$TIMESTAMP

# Schedule with cron
# 0 2 * * * /path/to/backup.sh  # Daily at 2 AM
```

#### Restore from Backup

```bash
# Restore MongoDB
mongorestore --uri="mongodb://admin:password@localhost:27017" \
             --archive=backup_20240218.tar.gz --gzip

# Or restore directory
mongorestore --uri="mongodb://admin:password@localhost:27017" \
             backup_20240218_120000
```

### Logging

```javascript
// Configure logging
const fs = require('fs');
const logStream = fs.createWriteStream('logs/app.log', { flags: 'a' });

// Redirect console output
console.log = function(msg) {
    logStream.write(new Date().toISOString() + ' - LOG - ' + msg + '\n');
};

console.error = function(msg) {
    logStream.write(new Date().toISOString() + ' - ERROR - ' + msg + '\n');
};
```

---

## Troubleshooting

### Error: "ECONNREFUSED" - MongoDB Connection

```bash
# Check if MongoDB is running
mongosh --version
systemctl status mongod  # Linux/macOS

# If not running, start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Error: "Cannot find module"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify all packages installed
npm list
```

### Error: "Port already in use"

```bash
# Find process using port 3000
lsof -i :3000          # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>          # macOS/Linux
taskkill /pid <PID> /f  # Windows

# Or change port in .env
USER_PORT=3001
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# If not running, start Redis
brew services start redis  # macOS
sudo systemctl start redis-server  # Linux

# Test connection
redis-cli
```

### Slow API Response

```bash
# Check MongoDB indexes
db.students.getIndexes()

# Add missing indexes (see: Database Setup section)

# Monitor query performance
db.setProfilingLevel(1)  # Profile slow queries
db.system.profile.find().pretty()
```

### High Memory Usage

```bash
# Restart application
pm2 restart school-api

# Clear Redis cache
redis-cli FLUSHDB

# Check for memory leaks
pm2 attach school-api  # View real-time logs
```

---

## Performance Optimization

### Database Optimization

```javascript
// Use appropriate query methods
// Index commonly filtered fields
// Paginate large result sets
// Use projection to limit fields returned

// Example optimized query
db.students.find(
    { schoolId: "school_123", isActive: true },
    { firstName: 1, lastName: 1, rollNumber: 1 }
).limit(20).skip(0)
```

### Caching Strategy

- Cache school/classroom objects (1 hour)
- Cache user session data (24 hours)
- Cache validation schemas
- Implement Redis cache for frequent queries

### API Rate Limiting

Configure in Nginx:
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
```

---

## Security Checklist

- [ ] Update all dependencies to latest versions
- [ ] Use strong, unique passwords for all services
- [ ] Enable HTTPS/SSL for all endpoints
- [ ] Configure firewall to restrict access
- [ ] Use environment variables for sensitive data
- [ ] Implement request validation on all endpoints
- [ ] Set up CORS properly for production domain
- [ ] Enable MongoDB authentication
- [ ] Use Redis password authentication
- [ ] Regular security updates and patches
- [ ] Regular security audits and penetration testing

---

## Support

For deployment issues:
1. Check logs: `pm2 logs school-api`
2. Verify services: `mongosh` and `redis-cli ping`
3. Test connectivity: `curl http://localhost:3000`
4. Review environment variables: `echo $MONGO_URI`
5. Contact: support@school-management-system.com

---

**Documentation Version**: 1.0.0
**Last Updated**: February 18, 2024
