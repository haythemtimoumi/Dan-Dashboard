# Dan Stock Dashboard - Comprehensive Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [Screenshots](#screenshots)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Security](#security)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Pages & Routes](#pages--routes)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [UI Components](#ui-components)

---

## 🎯 Overview

The Dan Stock Dashboard is a modern, responsive web application built with Next.js 14 and React 18. It provides a comprehensive interface for stock analysis, portfolio management, and investment decision-making. The dashboard integrates with the Dan Stock Analysis API to display real-time stock data, analytics, and insights from multiple investment gurus.

---

## 📸 Screenshots

### Login Page
![Login Page](./screenshots/login.png)

### Portfolio Dashboard - All Stocks List
![All Stocks List](./screenshots/alllist.png)

### Stock Details View
![Stock Details](./screenshots/details.png)

### Light Mode Interface
![Light Mode](./screenshots/lightmode.png)
![Light Mode Alternative](./screenshots/lightmode2.png)

### Tracking & Analytics
![Tracking Last](./screenshots/trackinglast.png)

### TradingView Chart Integration
![TradingView Chart](./screenshots/tradingviewchart.png)

### Scraper Management
![Scraper Management](./screenshots/scrapermangment.png)

### Key Capabilities
- **Real-time Stock Analysis**: View and analyze stocks with sentiment scores, technical signals, and Rule1 metrics
- **Portfolio Management**: Track multiple guru portfolios and investment strategies
- **Interactive Charts**: Visualize stock performance with Chart.js
- **Comment System**: Add notes and color-code stocks for organization
- **Advanced Filtering**: Filter stocks by multiple criteria (sentiment, moat, Rule1 scores)
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Authentication**: Secure login with role-based access
- **Real-time Updates**: React Query for efficient data fetching and caching

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────┐
│         Browser (Client)             │
│  ┌────────────────────────────────┐  │
│  │      Next.js Frontend          │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │   React Components       │  │  │
│  │  │   (Pages, UI, Contexts)  │  │  │
│  │  └──────────┬───────────────┘  │  │
│  │             │                   │  │
│  │  ┌──────────▼───────────────┐  │  │
│  │  │   React Query            │  │  │
│  │  │   (State Management)     │  │  │
│  │  └──────────┬───────────────┘  │  │
│  └─────────────┼──────────────────┘  │
└────────────────┼─────────────────────┘
                 │ HTTPS/REST
                 ▼
┌────────────────────────────────────────┐
│      Next.js API Routes (Proxy)        │
│  /app/api/proxy/*                      │
│  /app/api/auth/*                       │
│  /app/api/analytics/*                  │
└────────────────┬───────────────────────┘
                 │ HTTPS
                 ▼
┌────────────────────────────────────────┐
│      Dan Stock Analysis API            │
│      (Express.js Backend)              │
└────────────────┬───────────────────────┘
                 │ PostgreSQL
                 ▼
┌────────────────────────────────────────┐
│         PostgreSQL Database            │
└────────────────────────────────────────┘
```

### Data Flow
1. User interacts with React components
2. React Query manages data fetching and caching
3. Requests go through Next.js API routes (proxy layer)
4. Proxy forwards requests to Express.js backend
5. Backend queries PostgreSQL database
6. Data flows back through the layers
7. React Query updates UI automatically

---

## 💻 Technology Stack

### Core Framework
- **Next.js**: 14.0.2 (App Router, Server Components)
- **React**: 18.2.0
- **TypeScript**: 5.2.2
- **Node.js**: ≥18.17.0

### UI & Styling
- **Tailwind CSS**: 3.3.3 - Utility-first CSS framework
- **@tailwindcss/forms**: 0.5.7 - Form styling
- **@headlessui/react**: 2.2.4 - Unstyled, accessible UI components
- **@heroicons/react**: 2.0.18 - Beautiful hand-crafted SVG icons
- **clsx**: 2.0.0 - Utility for constructing className strings

### Data Visualization
- **Chart.js**: 4.5.0 - Flexible JavaScript charting
- **react-chartjs-2**: 5.3.0 - React wrapper for Chart.js
- **chartjs-plugin-datalabels**: 2.2.0 - Display labels on data

### State Management & Data Fetching
- **@tanstack/react-query**: 5.81.5 - Powerful data synchronization
- **@tanstack/react-query-devtools**: 5.81.5 - DevTools for React Query

### Forms & Validation
- **react-datepicker**: 4.25.0 - Date picker component
- **zod**: 3.22.2 - TypeScript-first schema validation
- **use-debounce**: 10.0.0 - Debounce hook for React

### Authentication
- **next-auth**: 5.0.0-beta.3 - Authentication for Next.js
- **bcryptjs**: 3.0.2 - Password hashing

### Database
- **@vercel/postgres**: 0.5.1 - Postgres client for Vercel
- **pg**: 8.16.3 - PostgreSQL client for Node.js

### Utilities
- **date-fns**: 4.1.0 - Modern JavaScript date utility library
- **react-hot-toast**: 2.5.2 - Toast notifications
- **react-markdown**: 10.1.0 - Markdown component for React

### Development Tools
- **ESLint**: 8.52.0 - Linting
- **Prettier**: 3.0.3 - Code formatting
- **Jest**: 29.7.0 - Testing framework
- **TypeScript**: Type checking

---

## ✨ Features

### 1. Dashboard Overview
- **Portfolio Summary**: View all stocks across multiple guru portfolios
- **Quick Stats**: Total stocks, highlighted stocks, new additions
- **Recent Activity**: Latest stock additions and removals
- **Performance Metrics**: Sentiment scores, signal scores, Rule1 metrics

### 2. Stock Analysis
- **Multi-Metric Display**: 
  - Sentiment Score (0-100)
  - Signal Score (0-100)
  - Rule1 Score (0-100)
  - Moat Score (0-100)
  - Management Score (0-100)
- **Price Information**: Current price, buy price, sticker price, upside potential
- **Chart Screenshots**: Visual technical analysis from StockScores
- **Guru Attribution**: See which gurus are tracking each stock

### 3. Advanced Filtering
- **Score Filters**: Filter by sentiment, signal, Rule1, moat, management scores
- **Date Range**: View stocks from specific time periods
- **Guru Filter**: Filter by specific investment guru
- **List Type**: Filter by watchlist, portfolio, etc.
- **Status Filter**: Active, inactive, target stocks
- **Color Coding**: Filter by user-assigned colors

### 4. Portfolio Management
- **Multiple Gurus**: Track portfolios from different investment experts
- **Portfolio Metrics**: 
  - Per-portfolio percentage
  - Last action (buy/sell/hold)
  - Growth rates (long-term, composite)
  - Payback time
- **Ticker Grouping**: View all gurus tracking a specific ticker
- **Target Stocks**: Mark and filter target investment opportunities

### 5. Analytics & Insights
- **Daily Changes**: Track new, removed, and existing stocks
- **Ticker Comparison**: Compare metrics between two dates
- **Trend Analysis**: Visualize score changes over time
- **Missing Analysis**: Identify tickers without complete data

### 6. Comment System
- **Stock Notes**: Add personal notes to any stock
- **Color Coding**: Assign colors (green, yellow, red) for quick visual reference
- **User Attribution**: Track who made each comment
- **Batch Operations**: Add comments to multiple stocks at once

### 7. Interactive Charts
- **Performance Charts**: Visualize stock performance over time
- **Score Distribution**: See distribution of sentiment and signal scores
- **Guru Comparison**: Compare different guru portfolios
- **Custom Date Ranges**: Analyze specific time periods

### 8. Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Adaptive layout for tablets
- **Desktop Experience**: Full-featured desktop interface
- **Touch-Friendly**: Large touch targets for mobile users

### 9. Real-time Updates
- **Auto-Refresh**: Automatic data updates with React Query
- **Optimistic Updates**: Instant UI feedback for user actions
- **Background Sync**: Keep data fresh without page reloads
- **Cache Management**: Intelligent caching for performance

---

## 🔒 Security

### Authentication
- **Next-Auth Integration**: Secure authentication with JWT
- **Session Management**: Server-side session handling
- **Password Hashing**: Bcrypt for secure password storage
- **Token Validation**: Automatic token refresh and validation

### Authorization
- **Role-Based Access**: Admin and user roles
- **Protected Routes**: Middleware guards for authenticated pages
- **API Security**: Proxy layer validates all backend requests

### Data Security
- **Environment Variables**: Sensitive data in .env files
- **HTTPS Only**: Enforced secure connections
- **XSS Protection**: React's built-in XSS prevention
- **CSRF Protection**: Next.js CSRF token handling
- **SQL Injection Prevention**: Parameterized queries

### Client-Side Security
- **Input Validation**: Zod schema validation
- **Sanitization**: Clean user inputs before display
- **Content Security Policy**: Restrict resource loading
- **Secure Headers**: Next.js security headers

---

## 📁 Project Structure

```
Dan-Dashboard/
├── app/
│   ├── api/                      # API routes (proxy layer)
│   │   ├── analytics/            # Analytics endpoints
│   │   ├── auth/                 # Authentication
│   │   │   └── login/
│   │   ├── chat/                 # Chat functionality
│   │   ├── comments/             # Comment management
│   │   ├── gurus/                # Guru data
│   │   ├── gurus-with-tickers/   # Guru-ticker relationships
│   │   ├── oldstock/             # Historical stock data
│   │   └── proxy/                # Backend API proxy
│   │       ├── comments/         # Comment proxies
│   │       ├── scraper-tasks/    # Scraper task proxies
│   │       ├── sources/          # Data source proxies
│   │       └── stocks/           # Stock data proxies
│   ├── contexts/                 # React contexts
│   │   ├── auth-context.tsx      # Authentication state
│   │   └── settings-context.tsx  # App settings
│   ├── dashboard/                # Dashboard pages
│   │   ├── portfolio/            # Portfolio view
│   │   ├── analytics/            # Analytics view
│   │   └── settings/             # Settings page
│   ├── lib/                      # Utility functions
│   │   ├── api.ts                # API client
│   │   ├── utils.ts              # Helper functions
│   │   └── validations.ts        # Validation schemas
│   ├── login/                    # Login page
│   ├── providers/                # Context providers
│   │   └── query-provider.tsx    # React Query provider
│   ├── ui/                       # UI components
│   │   ├── components/           # Reusable components
│   │   ├── fonts.ts              # Font configurations
│   │   └── global.css            # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page (redirects)
├── public/                       # Static assets
│   └── favicon.ico
├── .env.example                  # Environment variables template
├── .eslintrc.json                # ESLint configuration
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js ≥18.17.0
- npm ≥6.0.0
- Git
- Running Dan Stock Analysis API

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd Dan-Dashboard
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create `.env.local` file in root directory:
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://www.mytickerlist.com/api
NEXT_PUBLIC_BASE_URL=https://www.mytickerlist.com/

# Database (if using direct connection)
POSTGRES_URL=postgresql://user:password@host:5432/database
POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/database
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/database

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### Step 4: Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

### Step 5: Build for Production
```bash
npm run build
npm start
```

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | - | Backend API URL |
| `NEXT_PUBLIC_BASE_URL` | Yes | - | Frontend base URL |
| `POSTGRES_URL` | No | - | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | - | Secret for NextAuth.js |
| `NEXTAUTH_URL` | Yes | - | NextAuth callback URL |
| `NODE_ENV` | No | development | Environment mode |

---

## 🛣️ Pages & Routes

### Public Routes
```
/login                  # Login page
```

### Protected Routes (Require Authentication)
```
/                       # Redirects to /dashboard/portfolio
/dashboard/portfolio    # Main portfolio view
/dashboard/analytics    # Analytics and insights
/dashboard/settings     # User settings
/dashboard/gurus        # Guru management
/dashboard/comments     # Comment management
```

### API Routes (Internal)
```
/api/auth/login         # Authentication endpoint
/api/proxy/*            # Backend API proxy
/api/analytics/*        # Analytics endpoints
/api/comments/*         # Comment endpoints
/api/gurus/*            # Guru endpoints
```

---

## 🔌 API Integration

### React Query Setup
```typescript
// app/providers/query-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

### API Client Example
```typescript
// Fetch stocks with React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['stocks', filters],
  queryFn: async () => {
    const response = await fetch('/api/proxy/stocks/companies-with-analysis');
    if (!response.ok) throw new Error('Failed to fetch stocks');
    return response.json();
  },
});
```

### Proxy Pattern
All backend requests go through Next.js API routes:
```typescript
// app/api/proxy/stocks/companies-with-analysis/route.ts
export async function GET(request: NextRequest) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/stocks/companies-with-analysis`
  );
  return NextResponse.json(await response.json());
}
```

---

## 🎨 UI Components

### Component Library
- **Headless UI**: Accessible, unstyled components
- **Heroicons**: Beautiful SVG icons
- **Custom Components**: Built with Tailwind CSS

### Key Components
```
ui/
├── components/
│   ├── StockCard.tsx           # Stock display card
│   ├── FilterPanel.tsx         # Advanced filtering
│   ├── ChartComponent.tsx      # Chart.js wrapper
│   ├── CommentForm.tsx         # Add comments
│   ├── GuruBadge.tsx           # Guru indicator
│   ├── ScoreIndicator.tsx      # Score visualization
│   ├── DateRangePicker.tsx     # Date selection
│   └── LoadingSpinner.tsx      # Loading state
```

### Styling Approach
- **Tailwind CSS**: Utility-first styling
- **Component Composition**: Reusable, composable components
- **Responsive Design**: Mobile-first breakpoints
- **Dark Mode Ready**: Color scheme support

---

## 📊 State Management

### React Query
- **Server State**: All API data managed by React Query
- **Automatic Caching**: Intelligent cache management
- **Background Updates**: Keep data fresh
- **Optimistic Updates**: Instant UI feedback

### React Context
- **AuthContext**: User authentication state
- **SettingsContext**: Application settings
- **Global State**: Shared across components

### Local State
- **useState**: Component-level state
- **useReducer**: Complex state logic
- **Form State**: Controlled inputs

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm test -- --coverage
```

### E2E Testing
```bash
# Add E2E tests with Playwright or Cypress
npm run test:e2e
```

---

## 🎯 Performance Optimization

### Next.js Features
- **Server Components**: Reduce client-side JavaScript
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based splitting
- **Static Generation**: Pre-render pages at build time

### React Query
- **Caching**: Reduce unnecessary API calls
- **Prefetching**: Load data before needed
- **Background Updates**: Keep data fresh without blocking UI

### Tailwind CSS
- **PurgeCSS**: Remove unused styles in production
- **JIT Mode**: Just-in-time compilation
- **Minimal Bundle**: Only include used utilities

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
npx kill-port 3001
```

### API Connection Issues
```bash
# Check API is running
curl http://localhost:3000/health

# Verify environment variables
cat .env.local
```

### Build Errors
```bash
# Clean build
rm -rf .next/
npm run build
```

---

## 📝 Development Guidelines

### Code Style
- Follow ESLint rules
- Use Prettier for formatting
- TypeScript strict mode
- Meaningful variable names

### Component Guidelines
- One component per file
- Props interface at top
- Use TypeScript types
- Document complex logic

### Git Workflow
- Feature branches
- Meaningful commit messages
- Pull request reviews
- Keep commits atomic

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build image
docker build -t dan-dashboard .

# Run container
docker run -p 3001:3001 dan-dashboard
```

### Manual Deployment
```bash
# Build
npm run build

# Start
npm start
```

---

## 📄 License

ISC License

---

## 👥 Support

For issues and questions:
- Check documentation
- Review example code
- Test with development tools

---

**Last Updated**: 2024
**Version**: 1.0.0
