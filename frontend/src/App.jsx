import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

// Components
import Dashboard from './components/Dashboard'
import FlightBriefing from './components/FlightBriefing'
import WeatherDecoder from './components/WeatherDecoder'
import WeatherCharts from './components/WeatherCharts'
import Navigation from './components/Navigation'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/briefing" element={<FlightBriefing />} />
            <Route path="/decoder" element={<WeatherDecoder />} />
            <Route path="/charts" element={<WeatherCharts />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
