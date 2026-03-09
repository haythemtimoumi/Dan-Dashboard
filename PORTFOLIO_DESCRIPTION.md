# Dan Stock Analysis System

## Multi-Guru Stock Analysis & Portfolio Tracking Platform

Full-stack investment analysis platform that automatically scrapes, analyzes, and visualizes stock data from multiple financial sources to track investment guru portfolios and identify high-potential opportunities.

### Key Features
- **Automated Multi-Source Scraping**: Collects data from Rule1Toolbox, StockScores, GuruFocus, and Yahoo Finance
- **Smart Stock Scoring**: Combines sentiment scores, technical signals, and Rule1 investment metrics (Moat, Management, Rule1 scores)
- **Multi-Guru Portfolio Tracking**: Tracks and compares portfolios from different investment gurus
- **Real-time Analytics**: Daily change tracking, trend analysis, and automated highlighting of high-potential stocks (sentiment > 60 & signal > 80)
- **Interactive Dashboard**: Responsive UI with advanced filtering, charts, and color-coded stock organization

### Tech Stack
**Frontend**: Next.js 14 · React 18 · TypeScript · Tailwind CSS · React Query · Chart.js  
**Backend**: Express.js · TypeScript · PostgreSQL · JWT Auth · RBAC  
**Scraper**: Python · Selenium · undetected-chromedriver · AWS S3 · Firebase

### Architecture Flow
```
Web Scraping (Python) → Data Processing → PostgreSQL Database → REST API (Express) → Dashboard (Next.js)
```

**Flow**: Multi-Source Scraping → Data Validation & Merging → Database Storage → API Layer → Real-time Visualization

### Highlights
- Bypasses anti-bot detection with undetected-chromedriver
- Handles 2FA email verification automatically
- Smart resume capability for interrupted scraping
- Role-based access control with admin/user permissions
- Automated daily/hourly scraping with systemd services
- AWS S3 backup integration for data redundancy
- React Query for optimized data fetching and caching

---

## Alternative Shorter Version

# Dan Stock Analysis System

**Multi-Guru Stock Analysis & Portfolio Tracking Platform**

Full-stack platform that automatically scrapes and analyzes stock data from multiple financial sources to identify high-potential investment opportunities.

- **Automated Data Collection**: Scrapes Rule1Toolbox, StockScores, GuruFocus, and Yahoo Finance
- **Smart Stock Scoring**: Combines sentiment, technical signals, and investment metrics
- **Multi-Guru Tracking**: Tracks and compares portfolios from different investment experts
- **Real-time Dashboard**: Interactive UI with advanced filtering, charts, and analytics
- **Automated Alerts**: Highlights stocks with sentiment > 60 & signal > 80

**Stack**: Next.js · React · TypeScript · Express.js · PostgreSQL · Python · Selenium · AWS S3  
**Flow**: Multi-Source Scraping → Data Processing → Database → REST API → Real-time Dashboard

---

## Ultra-Compact Version (For Portfolio Card)

# Dan Stock Analysis System

Automated stock analysis platform that scrapes multiple financial sources to track investment guru portfolios and identify high-potential opportunities.

- Scrapes Rule1Toolbox, StockScores, GuruFocus, Yahoo Finance
- AI-powered scoring (sentiment, technical signals, Rule1 metrics)
- Multi-guru portfolio tracking and comparison
- Real-time dashboard with advanced filtering and charts
- Automated daily/hourly updates with smart resume

**Stack**: Next.js · TypeScript · Express.js · PostgreSQL · Python · Selenium · AWS S3  
**Flow**: Web Scraping → Data Processing → Database → REST API → Interactive Dashboard
