# Stock Dashboard API Documentation

This document outlines the API endpoints implemented for the Stock Dashboard application.

## Base URL

All API endpoints are relative to: `http://localhost:3000/api`

## Available Endpoints

### Get All Stocks
- **URL**: `/stocks`
- **Method**: `GET`
- **Description**: Returns all stocks in the database
- **Response**: Array of stock objects

### Get Highlighted Stocks
- **URL**: `/stocks/highlighted`
- **Method**: `GET`
- **Description**: Returns only stocks marked as highlighted
- **Response**: Array of highlighted stock objects

### Get Stocks by Source
- **URL**: `/stocks/source/:source`
- **Method**: `GET`
- **Parameters**:
  - `source`: Either 'Rule 1' or 'Magic Formula'
- **Description**: Returns stocks filtered by the specified investment source
- **Response**: Array of stock objects matching the source

### Get Sorted Stocks
- **URL**: `/stocks/sorted`
- **Method**: `GET`
- **Description**: Returns all stocks sorted by sentiment score in descending order
- **Response**: Array of sorted stock objects

### Get Daily Changes
- **URL**: `/stocks/daily-changes`
- **Method**: `GET`
- **Description**: Returns information about current stocks, newly added stocks, and removed stocks
- **Response**: Object with current, new, and removed stock arrays

### Get Stock by ID
- **URL**: `/stocks/:id`
- **Method**: `GET`
- **Parameters**:
  - `id`: Stock ID
- **Description**: Returns a specific stock by its ID
- **Response**: Single stock object

### Get Stock History
- **URL**: `/stocks/:id/history`
- **Method**: `GET`
- **Parameters**:
  - `id`: Stock ID (numeric)
- **Query Parameters**:
  - `from` (optional): Start date for filtering history (YYYY-MM-DD)
  - `to` (optional): End date for filtering history (YYYY-MM-DD)
- **Description**: Returns historical data for a specific stock
- **Response**: Array of stock history objects
- **Success Response**: `200 OK`
- **Error Responses**:
  - `400 Bad Request`: Invalid ID format
  - `404 Not Found`: Stock not found or no history available
  - `500 Internal Server Error`: Server error
- **Notes**: The endpoint returns historical data for a stock by finding all stocks with the same ticker, source, and guru (if present). Results are ordered by date in ascending order.

### Get Stocks by Ticker
- **URL**: `/stocks/ticker/:ticker`
- **Method**: `GET`
- **Parameters**:
  - `ticker`: Stock ticker symbol (e.g., AAPL)
- **Description**: Returns stocks matching the specified ticker symbol
- **Response**: Array of stock objects matching the ticker

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a JSON object with an error message:
```json
{
  "message": "Error message description"
}
```

## Data Models

### Stock Object
```typescript
{
  id: string;
  ticker: string;
  sentiment_score: number;
  signal_score: number;
  pe: number;
  buy_price: number;
  guru: string;
  source: 'Rule 1' | 'Magic Formula';
  highlight: boolean;
  created_at: string;
  updated_at: string;
  screenshot?: string;
}
```

### Stock History Object
```typescript
{
  id: string | number;
  date: string;
  ticker: string;
  source: string;
  pe: number;
  dividend: string | null;
  cash_per_share: string;
  current_ratio: number;
  signal_score: number;
  sentiment_score: number;
  screenshot: string;
  guru: string;
  rule1_score: number | null;
  moat_score: number | null;
  management_score: number | null;
  buy_price: string;
}
```