# Dan Stock Analysis System - Complete Overview

## 🎯 System Overview

The Dan Stock Analysis System is a comprehensive, full-stack stock analysis platform consisting of three integrated components that work together to collect, process, and visualize stock market data from multiple sources.

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM                          │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   Frontend   │◄────►│   Backend    │◄────►│ Scraper  │ │
│  │  Dashboard   │      │     API      │      │  Engine  │ │
│  │  (Next.js)   │      │  (Express)   │      │ (Python) │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│         │                      │                     │      │
│         │                      │                     │      │
│         └──────────────────────┴─────────────────────┘      │
│                                │                            │
│                                ▼                            │
│                      ┌──────────────────┐                   │
│                      │   PostgreSQL     │                   │
│                      │    Database      │                   │
│                      └──────────────────┘                   │
│                                │                            │
│                                ▼                            │
│                      ┌──────────────────┐                   │
│                      │    AWS S3        │                   │
│                      │   (Backups)      │                   │
│                      └──────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 System Components

### 1. Dan-Dashboard (Frontend)
**Technology**: Next.js 14, React 18, TypeScript, Tailwind CSS

**Purpose**: User interface for stock analysis and portfolio management

**Key Features**:
- Real-time stock data visualization
- Interactive charts and analytics
- Portfolio management across multiple gurus
- Advanced filtering and search
- Comment system with color coding
- Responsive design for all devices

**Location**: `./Dan-Dashboard/`

**Documentation**: `Dan-Dashboard/COMPREHENSIVE_README.md`

---

### 2. Dan-API (Backend)
**Technology**: Express.js, TypeScript, PostgreSQL

**Purpose**: RESTful API server for data management and business logic

**Key Features**:
- CRUD operations for stock data
- User authentication and authorization
- Role-based access control (RBAC)
- Analytics and reporting endpoints
- Scraper task coordination
- Comment and guru management

**Location**: `./Dan-API/`

**Documentation**: `Dan-API/COMPREHENSIVE_README.md`

---

### 3. dan_scraper (Data Collection)
**Technology**: Python, Selenium, undetected-chromedriver

**Purpose**: Automated web scraping from multiple financial data sources

**Key Features**:
- Multi-source data collection (Rule1, StockScores, GuruFocus, Yahoo)
- Automated pipeline with retry logic
- Email 2FA verification
- Smart resume capability
- Database integration
- AWS S3 backups

**Location**: `./dan_scraper/`

**Documentation**: `dan_scraper/COMPREHENSIVE_README.md`

---

## 🔄 Data Flow

### Complete System Data Flow

```
1. DATA COLLECTION (Scraper)
   ┌─────────────────────────────────────┐
   │  Python Scraper (dan_scraper)       │
   │  ├─ Rule1Toolbox                    │
   │  ├─ StockScores                     │
   │  ├─ GuruFocus                       │
   │  └─ Yahoo Finance                   │
   └────────────┬────────────────────────┘
                │ CSV Files
                ▼
   ┌─────────────────────────────────────┐
   │  Data Processing & Validation       │
   │  (merge_and_save.py)                │
   └────────────┬────────────────────────┘
                │ Cleaned Data
                ▼
2. DATA STORAGE (Database)
   ┌─────────────────────────────────────┐
   │  PostgreSQL Database                │
   │  ├─ stock_analysis                  │
   │  ├─ scraper_tasks                   │
   │  ├─ guru                            │
   │  ├─ guru_ticker_map                 │
   │  ├─ comment                         │
   │  └─ users                           │
   └────────────┬────────────────────────┘
                │ SQL Queries
                ▼
3. DATA ACCESS (Backend API)
   ┌─────────────────────────────────────┐
   │  Express.js API (Dan-API)           │
   │  ├─ Controllers                     │
   │  ├─ Models                          │
   │  ├─ Middleware (Auth, RBAC)         │
   │  └─ Routes                          │
   └────────────┬────────────────────────┘
                │ REST API (JSON)
                ▼
4. DATA PRESENTATION (Frontend)
   ┌─────────────────────────────────────┐
   │  Next.js Dashboard (Dan-Dashboard)  │
   │  ├─ React Components                │
   │  ├─ React Query (State)             │
   │  ├─ Charts & Visualizations         │
   │  └─ User Interface                  │
   └─────────────────────────────────────┘
                │
                ▼
           End User
```

---

## 🗄️ Shared Database Schema

All three components interact with the same PostgreSQL database:

### Core Tables

#### `stock_analysis`
Primary table for stock data
- Stores all scraped stock metrics
- Links to tickers and gurus
- Contains scores, prices, and analysis data

#### `scraper_tasks`
Manages scraping operations
- Tracks which tickers to scrape
- Monitors scraping status
- Coordinates between scraper and API

#### `guru`
Investment guru information
- Stores guru names and IDs
- Used for portfolio attribution

#### `guru_ticker_map`
Many-to-many relationships
- Links gurus to their tracked tickers
- Enables multi-guru portfolio tracking

#### `comment`
User comments and annotations
- User notes on stocks
- Color coding for organization
- Linked to users and tickers

#### `users`
User accounts
- Authentication credentials
- Role-based permissions (admin/user)

---

## 🚀 Complete System Setup

### Prerequisites
- Node.js ≥18.17.0
- Python 3.6+
- PostgreSQL ≥12.0
- Chrome/Chromium browser
- AWS account (optional, for S3)
- Gmail account (for scraper 2FA)

### Step 1: Database Setup
```bash
# Create PostgreSQL database
createdb stocklist

# Create user
createuser -P haystockuser

# Grant permissions
psql -d stocklist -c "GRANT ALL PRIVILEGES ON DATABASE stocklist TO haystockuser;"
```

### Step 2: Backend API Setup
```bash
cd Dan-API

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Build TypeScript
npm run build

# Start server
npm start
# API runs on http://localhost:3000
```

### Step 3: Frontend Dashboard Setup
```bash
cd Dan-Dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with API URL

# Start development server
npm run dev
# Dashboard runs on http://localhost:3001
```

### Step 4: Scraper Setup
```bash
cd dan_scraper

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with credentials

# Test installation
python test_browser.py
python test_db_connection.py

# Run scraper
python run_all_in_one.py
```

---

## 🔐 System Security

### Authentication Flow
```
1. User logs in via Dashboard
   └─ POST /api/auth/login

2. Backend validates credentials
   └─ Checks users table
   └─ Verifies bcrypt password

3. Backend generates JWT token
   └─ Signs with JWT_SECRET

4. Dashboard stores token
   └─ Includes in Authorization header

5. Backend validates token on requests
   └─ authenticateToken middleware
   └─ Checks role for permissions
```

### Security Layers

#### Frontend Security
- HTTPS only
- XSS protection (React)
- CSRF tokens
- Input validation (Zod)
- Secure session storage

#### Backend Security
- JWT authentication
- Role-based access control
- Input validation (express-validator)
- SQL injection prevention (parameterized queries)
- Rate limiting (recommended)
- CORS configuration

#### Scraper Security
- Environment variables for credentials
- undetected-chromedriver for anti-bot
- Encrypted database connections
- Secure email IMAP (SSL)
- No credential logging

#### Database Security
- Encrypted connections
- User permissions
- Password hashing (bcrypt)
- Backup encryption
- Access logging

---

## 📊 System Monitoring

### Health Checks

#### Backend API
```bash
curl http://localhost:3000/health
# Response: {"status":"ok","timestamp":"..."}
```

#### Frontend Dashboard
```bash
curl http://localhost:3001
# Should return HTML
```

#### Database
```bash
psql -h localhost -U haystockuser -d stocklist -c "SELECT COUNT(*) FROM stock_analysis;"
```

#### Scraper
```bash
# Check scraper status
python -c "from utils.db_utils import get_db_connection; print('OK' if get_db_connection() else 'FAIL')"
```

### Logging

#### Backend Logs
```bash
# Development
npm run dev
# Logs to console

# Production
npm start > api.log 2>&1
```

#### Frontend Logs
```bash
# Development
npm run dev
# Logs to console

# Production
npm start > dashboard.log 2>&1
```

#### Scraper Logs
```bash
# Console output
python run_all_in_one.py

# Systemd logs
sudo journalctl -u main-scraper.service -f
```

---

## 🔄 Typical Workflow

### Daily Operations

#### 1. Morning: Automated Scraping
```bash
# Runs via systemd timer at 6 AM
# Or manually:
cd dan_scraper
python daily_scraper.py
```

#### 2. Data Processing
```bash
# Automatic after scraping
# Merges data to database
# Uploads to S3
```

#### 3. User Access
```bash
# Users access dashboard
# View updated stock data
# Add comments and analysis
```

#### 4. Hourly Updates
```bash
# Runs every hour via systemd
# Updates prices for active stocks
cd dan_scraper
python hourly_scraping.py
```

### Manual Operations

#### Add New Ticker
```bash
# Via Dashboard
1. Login as admin
2. Navigate to Tickers
3. Click "Add Ticker"
4. Enter symbol and details
5. Save

# Via API
curl -X POST http://localhost:3000/api/tickers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","scrape_type":"daily","active":true}'

# Via Scraper
cd dan_scraper
python custom_ticker_scraper.py AAPL
```

#### Update Stock Data
```bash
# Via Dashboard
1. Find stock
2. Click edit
3. Update fields
4. Save

# Via API
curl -X PUT http://localhost:3000/api/stocks/123 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sentiment_score":85}'
```

#### Add Comment
```bash
# Via Dashboard
1. Click on stock
2. Add comment
3. Select color
4. Save

# Via API
curl -X POST http://localhost:3000/api/comments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ticker_symbol":"AAPL","comment":"Strong buy","color":"green"}'
```

---

## 🐛 System Troubleshooting

### Issue: Dashboard Can't Connect to API

**Symptoms**: Dashboard shows "Failed to fetch" errors

**Diagnosis**:
```bash
# Check API is running
curl http://localhost:3000/health

# Check API logs
cd Dan-API
npm run dev

# Check environment variables
cat Dan-Dashboard/.env.local | grep API_URL
```

**Solution**:
1. Ensure API is running on correct port
2. Verify NEXT_PUBLIC_API_URL in .env.local
3. Check CORS settings in API
4. Restart both services

### Issue: Scraper Can't Save to Database

**Symptoms**: Scraper completes but no data in database

**Diagnosis**:
```bash
# Test database connection
cd dan_scraper
python test_db_connection.py

# Check database credentials
cat .env | grep DB_

# Check database
psql -h localhost -U haystockuser -d stocklist
```

**Solution**:
1. Verify database credentials in .env
2. Ensure database is running
3. Check network connectivity
4. Verify table schema exists

### Issue: Authentication Fails

**Symptoms**: Login returns 401 Unauthorized

**Diagnosis**:
```bash
# Check user exists
psql -h localhost -U haystockuser -d stocklist \
  -c "SELECT * FROM users WHERE username='admindan';"

# Check JWT_SECRET is set
cd Dan-API
cat .env | grep JWT_SECRET

# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admindan","password":"Stockscreener99#"}'
```

**Solution**:
1. Verify user exists in database
2. Check password is correct
3. Ensure JWT_SECRET is set
4. Restart API server

---

## 📈 Performance Optimization

### Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_stock_ticker ON stock_analysis(ticker);
CREATE INDEX idx_stock_date ON stock_analysis(date);
CREATE INDEX idx_stock_sentiment ON stock_analysis(sentiment_score);
CREATE INDEX idx_scraper_symbol ON scraper_tasks(symbol);
CREATE INDEX idx_scraper_active ON scraper_tasks(active);
```

### API Optimization
- Enable connection pooling (already configured)
- Add Redis caching for frequently accessed data
- Implement pagination for large result sets
- Use database views for complex queries
- Enable gzip compression

### Frontend Optimization
- React Query caching (already configured)
- Image optimization (Next.js automatic)
- Code splitting (Next.js automatic)
- Lazy loading for heavy components
- Service worker for offline support

### Scraper Optimization
- Run during off-peak hours
- Use headless mode for speed
- Parallel scraping for multiple tickers
- Incremental updates instead of full scrapes
- Cache frequently accessed data

---

## 🔧 Configuration Management

### Environment Variables

#### Backend (.env)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stocklist
DB_USER=haystockuser
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3001
```

#### Scraper (.env)
```env
# Credentials for all scraping sources
RULE1_EMAIL=your_email
RULE1_PASSWORD=your_password
STOCKSCORES_EMAIL=your_email
STOCKSCORES_PASSWORD=your_password
GURU_EMAIL=your_email
GURU_PASSWORD=your_password

# Email for 2FA
EMAIL_ADDRESS=your_email
EMAIL_PASSWORD=your_app_password

# Database
DB_HOST=localhost
DB_NAME=stocklist
DB_USER=haystockuser
DB_PASSWORD=your_password

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your-bucket
```

---

## 📚 Additional Resources

### Documentation
- Backend API: `Dan-API/COMPREHENSIVE_README.md`
- Frontend Dashboard: `Dan-Dashboard/COMPREHENSIVE_README.md`
- Scraper: `dan_scraper/COMPREHENSIVE_README.md`
- API Documentation: `Dan-API/API_DOCUMENTATION.md`
- Postman Guide: `Dan-API/POSTMAN_README.md`

### Testing
- Backend tests: `cd Dan-API && npm test`
- Frontend tests: `cd Dan-Dashboard && npm test`
- Scraper tests: `cd dan_scraper && python test_*.py`

### Deployment
- Backend: Can deploy to any Node.js hosting (Heroku, AWS, DigitalOcean)
- Frontend: Optimized for Vercel, also works on Netlify, AWS
- Scraper: Best on VPS with cron/systemd (DigitalOcean, AWS EC2)

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Test locally
4. Update documentation
5. Submit pull request

### Code Standards
- Backend: TypeScript, ESLint, Prettier
- Frontend: TypeScript, ESLint, Prettier, Tailwind
- Scraper: Python PEP 8, type hints

---

## 📄 License

ISC License

---

## 👥 Support

For system-wide issues:
1. Check component-specific documentation
2. Review logs from all three components
3. Verify database connectivity
4. Test each component independently

---

**System Version**: 1.0.0
**Last Updated**: 2024
**Components**: Dan-Dashboard v1.0.0, Dan-API v1.0.0, dan_scraper v1.0.0
