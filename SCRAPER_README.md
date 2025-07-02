# Stock Scraper Management System

## Overview
A real-time dashboard for managing and monitoring a Python stock scraper system with live status updates and ticker management capabilities.

## Features

### 🔄 Real-time Status Monitoring
- Live scraper status (Running/Idle/Ready)
- Next run countdown
- Last run timestamp
- Ticker update permissions

### 📊 Ticker Management
- Display 150+ current tickers in responsive grid
- Add new tickers via textarea (comma or line separated)
- Replace all tickers functionality
- Real-time ticker count display

### 🎨 Modern UI/UX
- Dark/Light mode toggle
- Responsive design (mobile-friendly)
- Loading skeletons
- Error handling with user-friendly messages
- Toast notifications for actions

### ⚡ Real-time Updates
- Auto-refresh every 30 seconds
- React Query for efficient data fetching
- Optimistic updates for better UX

## API Integration

**Base URL:** `http://162.248.101.184:5000`

### Endpoints Used:
- `GET /scraper-status` - Fetch current scraper status
- `GET /get-tickers` - Retrieve all tickers
- `POST /update-tickers` - Update ticker list

## Tech Stack
- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Query (@tanstack/react-query)
- **Icons:** Heroicons
- **Notifications:** React Hot Toast

## Components

### StatusCard
- Real-time scraper status display
- Color-coded status indicators
- Detailed status information

### TickerGrid
- Responsive grid layout for tickers
- Optimized for 150+ items
- Mobile-friendly display

### TickerManager
- Textarea for bulk ticker input
- Add to existing or replace all options
- Validation and error handling
- Disabled when scraper is running

### ThemeToggle
- System preference detection
- Persistent theme storage
- Smooth transitions

## Usage

1. **Monitor Status:** View real-time scraper status in the StatusCard
2. **View Tickers:** See all current tickers in the responsive grid
3. **Manage Tickers:** Use the TickerManager to add or replace tickers
4. **Toggle Theme:** Switch between light and dark modes
5. **Real-time Updates:** Data refreshes automatically every 30 seconds

## Access
Visit: `https://dan-dashboard-chi.vercel.app/dashboard/stocks/create`

## Notes
- Ticker updates are disabled when scraper is running
- All data updates in real-time
- Responsive design works on all devices
- Error states are handled gracefully