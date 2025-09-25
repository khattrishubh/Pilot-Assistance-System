# Weather Assistant System for Pilots

A comprehensive full-stack application that provides decoded weather information, NOTAMs, and flight briefings for pilots.

## Features

### Backend (Node.js + Express)
- METAR/TAF/NOTAM data parsing from aviation APIs
- Severity classification system (🟢 Normal, 🟡 Caution, 🔴 Critical)
- REST endpoints for weather decoding and flight briefings
- Aviation-specific weather parsing using metar-taf-parser

### Frontend (React + Tailwind)
- Pilot dashboard with route planning
- Interactive maps with flight path overlay
- Real-time weather alerts and severity indicators
- Weather trend charts and visualizations
- Text-to-Speech voice briefings

## Project Structure

```
/
├── backend/          # Node.js API server
├── frontend/         # React application
├── docs/            # Documentation
└── README.md        # This file
```

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `POST /api/decode` - Decode METAR/TAF text to plain English
- `POST /api/briefing` - Get complete flight briefing for route

## Tech Stack

**Backend:**
- Node.js + Express
- metar-taf-parser for aviation weather parsing
- Axios for API calls
- CORS for cross-origin requests

**Frontend:**
- React with Vite
- Tailwind CSS for styling
- Leaflet for interactive maps
- Recharts for weather visualizations
- Speech Synthesis API for TTS

## Development

This project follows modern web development practices with separate frontend and backend services that can be deployed independently.