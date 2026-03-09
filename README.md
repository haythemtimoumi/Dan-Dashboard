# Dan Stock Analysis System

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green)](https://expressjs.com/)
[![Python](https://img.shields.io/badge/Python-3.6+-yellow)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue)](https://www.postgresql.org/)

## 🎯 Overview

**Automated multi-guru stock analysis and portfolio tracking platform**

Full-stack investment platform that automatically scrapes multiple financial sources to identify high-potential stocks and track investment guru portfolios in real-time.

---

## 📸 Screenshots

### Login Page
![Login Page](screenshots/login.png)

### Portfolio Dashboard
![Portfolio Dashboard](screenshots/alllist.png)

### Stock Details & Analysis
![Stock Details](screenshots/details.png)

### Light Mode Interface
![Light Mode](screenshots/lightmode.png)

### Analytics & Tracking
![Tracking Dashboard](screenshots/trackinglast.png)

### Chart Integration
![TradingView Charts](screenshots/tradingviewchart.png)

### Scraper Management
![Scraper Management](screenshots/scrapermangment.png)

---

## ✨ Key Features

- **Automated Multi-Source Scraping**: Collects data from Rule1Toolbox, StockScores, GuruFocus, and Yahoo Finance
- **Smart Stock Scoring**: Combines sentiment scores (0-100), technical signals, and Rule1 investment metrics
- **Multi-Guru Portfolio Tracking**: Tracks and compares portfolios from different investment experts
- **Real-time Analytics**: Daily change tracking with automated highlighting of high-potential stocks
- **Interactive Dashboard**: Responsive UI with advanced filtering, charts, and color-coded organization
- **Automated Alerts**: Highlights stocks with sentiment > 60 & signal > 80
- **Role-Based Access Control**: Admin and user permissions with JWT authentication

---

## 🏗️ System Architecture

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

**Data Flow**: Multi-Source Scraping → Data Processing → PostgreSQL → REST API → Dashboard

---

## 💻 Tech Stack

### Frontend (Dan-Dashboard)
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI, Heroicons
- **State Management**: React Query (TanStack Query)
- **Charts**: Chart.js, react-chartjs-2
- **Authentication**: NextAuth.js with JWT

### Backend (Dan-API)
- **Framework**: Express.js, TypeScript
- **Database**: PostgreSQL with pg driver
- **Authentication**: JWT, bcryptjs
- **Validation**: express-validator, Zod
- **Security**: CORS, RBAC middleware

### Scraper (dan_scraper)
- **Language**: Python 3.6+
- **Automation**: Selenium, undetected-chromedriver
- **Database**: psycopg2-binary
- **Data Processing**: pandas
- **Cloud Storage**: AWS S3 (boto3)
- **Notifications**: Firebase Admin SDK

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥18.17.0
- Python 3.6+
- PostgreSQL ≥12.0
- Chrome/Chromium browser

### 1. Database Setup
```bash
createdb stocklist
createuser -P haystockuser
```

### 2. Backend API
```bash
cd Dan-API
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run build
npm start
# API runs on http://localhost:3000
```

### 3. Frontend Dashboard
```bash
cd Dan-Dashboard
npm install
cp .env.example .env.local
# Edit .env.local with API URL
npm run dev
# Dashboard runs on http://localhost:3001
```

### 4. Scraper
```bash
cd dan_scraper
pip install -r requirements.txt
cp .env.example .env
# Edit .env with credentials
python run_all_in_one.py
```

---

## 📊 Data Sources

### 1. Rule1Toolbox
- Investment scoring (Rule1, Moat, Management scores)
- Valuation metrics (Sticker Price, Buy Price)
- Ticker discovery from filtered scans

### 2. StockScores
- Technical analysis (Signal Score, Sentiment Score)
- Chart screenshots for visual analysis
- Real-time technical indicators

### 3. GuruFocus
- Portfolio tracking for multiple gurus
- Per-portfolio percentages
- Last action tracking (buy/sell/hold)

### 4. Yahoo Finance
- Real-time stock prices
- Price updates for all tracked tickers

---

## 🎯 Key Metrics Tracked

- **Sentiment Score** (0-100): Market sentiment analysis
- **Signal Score** (0-100): Technical trading signals
- **Rule1 Score** (0-100): Investment quality score
- **Moat Score** (0-100): Competitive advantage rating
- **Management Score** (0-100): Management quality rating
- **Sticker Price**: Calculated fair value
- **Percentage Upside**: Potential gain percentage

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin and user permissions
- **Password Hashing**: Bcrypt for secure password storage
- **Input Validation**: express-validator and Zod schemas
- **SQL Injection Prevention**: Parameterized queries
- **Anti-Bot Detection**: undetected-chromedriver for scraping
- **2FA Support**: Automated email verification handling

---

## 🔄 Automated Features

- **Daily Scraping**: Automated data collection via systemd services
- **Hourly Updates**: Real-time price updates for active stocks
- **Smart Resume**: Continues from interruption point
- **Email 2FA**: Automatic verification code handling
- **S3 Backups**: Daily CSV backups to AWS S3
- **Firebase Notifications**: Push alerts on completion

---

## � Project Structure

```
dan-dashboard/
├── Dan-Dashboard/          # Frontend (Next.js)
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API routes (proxy layer)
│   │   ├── dashboard/    # Dashboard pages
│   │   ├── contexts/     # React contexts
│   │   └── ui/           # UI components
│   ├── screenshots/       # UI Screenshots
│   └── package.json
├── Dan-API/               # Backend (Express.js)
│   ├── src/
│   │   ├── controllers/  # Business logic
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   └── middleware/   # Auth, RBAC, logging
│   └── package.json
├── dan_scraper/           # Scraper (Python)
│   ├── scrapers/         # Scraping modules
│   ├── utils/            # Database, S3, email utils
│   ├── core/             # Browser automation
│   └── requirements.txt
└── README.md              # This file
```

---

## �️ Development

### Run Tests
```bash
# Backend
cd Dan-API && npm test

# Frontend
cd Dan-Dashboard && npm test

# Scraper
cd dan_scraper && python test_*.py
```

### Build for Production
```bash
# Backend
cd Dan-API && npm run build

# Frontend
cd Dan-Dashboard && npm run build
```

---

## 📈 Performance

- **React Query Caching**: Optimized data fetching with 1-minute stale time
- **Database Indexing**: Indexed queries on ticker, date, and scores
- **Connection Pooling**: PostgreSQL connection pool for efficiency
- **Code Splitting**: Automatic route-based splitting in Next.js
- **Image Optimization**: Next.js automatic image optimization

---

## 🐛 Troubleshooting

### Dashboard can't connect to API
```bash
# Check API is running
curl http://localhost:3000/health

# Verify environment variables
cat Dan-Dashboard/.env.local | grep API_URL
```

### Scraper fails to save data
```bash
# Test database connection
cd dan_scraper && python test_db_connection.py

# Check credentials
cat .env | grep DB_
```

### Authentication fails
```bash
# Verify user exists
psql -d stocklist -c "SELECT * FROM users;"

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admindan","password":"Stockscreener99#"}'
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

---

## 📄 License

ISC License

---

## 👥 Support

For issues and questions:
- Check component-specific README files
- Review system architecture
- Test each component independently

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Components**: Dan-Dashboard v1.0.0 · Dan-API v1.0.0 · dan_scraper v1.0.0
