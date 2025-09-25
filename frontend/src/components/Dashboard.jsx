import { useState, useEffect } from 'react'
import { Plane, CloudRain, AlertTriangle, Clock, MapPin, Wind } from 'lucide-react'
import WeatherCard from './WeatherCard'
import FlightMap from './FlightMap'
import AlertsPanel from './AlertsPanel'
import TTSControls from './TTSControls'
import weatherService from '../services/weatherService'

const Dashboard = () => {
  const [recentFlights, setRecentFlights] = useState([])
  const [quickWeather, setQuickWeather] = useState([])
  const [loading, setLoading] = useState(true)

  // Sample data for demonstration
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Check API health first
        await weatherService.checkHealth()
        
        // Load demo briefing data
        const demoBriefing = await weatherService.getDemoBriefing()
        
        setRecentFlights([
          { id: 1, origin: 'KJFK', destination: 'KLAX', time: '2 hours ago', status: 'completed' },
          { id: 2, origin: 'KORD', destination: 'KDEN', time: '5 hours ago', status: 'completed' },
          { id: 3, origin: 'KBOS', destination: 'KSEA', time: '1 day ago', status: 'completed' },
        ])
        
        // Load quick weather for major airports
        const airports = ['KJFK', 'KLGA', 'KORD']
        const weatherPromises = airports.map(async (icao) => {
          try {
            const metar = await weatherService.getMetar(icao)
            return {
              icao,
              conditions: metar.success ? metar.decoded.summary : 'Data unavailable',
              severity: metar.success ? metar.severity : { level: 'unknown', emoji: '⚪' },
              updated: metar.success ? 'Just now' : 'Unknown'
            }
          } catch (error) {
            console.error(`Failed to load weather for ${icao}:`, error)
            return {
              icao,
              conditions: 'Unable to load weather data',
              severity: { level: 'unknown', emoji: '⚪' },
              updated: 'Error'
            }
          }
        })
        
        const weatherData = await Promise.all(weatherPromises)
        setQuickWeather(weatherData)
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        // Fallback to mock data
        setRecentFlights([
          { id: 1, origin: 'KJFK', destination: 'KLAX', time: '2 hours ago', status: 'completed' },
          { id: 2, origin: 'KORD', destination: 'KDEN', time: '5 hours ago', status: 'completed' },
          { id: 3, origin: 'KBOS', destination: 'KSEA', time: '1 day ago', status: 'completed' },
        ])
        
        setQuickWeather([
          { 
            icao: 'KJFK', 
            conditions: 'API unavailable - using sample data',
            severity: { level: 'normal', emoji: '🟢' },
            updated: '5 min ago'
          },
          { 
            icao: 'KLGA', 
            conditions: 'API unavailable - using sample data',
            severity: { level: 'caution', emoji: '🟡' },
            updated: '3 min ago'
          },
          { 
            icao: 'KORD', 
            conditions: 'API unavailable - using sample data',
            severity: { level: 'critical', emoji: '🔴' },
            updated: '1 min ago'
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getSeverityColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'caution': return 'text-yellow-600 bg-yellow-50'
      case 'normal': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-slate-600">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pilot Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Weather conditions and flight planning tools
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">Last updated</div>
          <div className="text-lg font-semibold text-slate-900">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="aviation-card p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-aviation-100 rounded-lg">
              <Plane className="h-6 w-6 text-aviation-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Recent Flights</p>
              <p className="text-2xl font-bold text-slate-900">{recentFlights.length}</p>
            </div>
          </div>
        </div>

        <div className="aviation-card p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CloudRain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Monitored Airports</p>
              <p className="text-2xl font-bold text-slate-900">{quickWeather.length}</p>
            </div>
          </div>
        </div>

        <div className="aviation-card p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Alerts</p>
              <p className="text-2xl font-bold text-slate-900">
                {quickWeather.filter(w => w.severity.level !== 'normal').length}
              </p>
            </div>
          </div>
        </div>

        <div className="aviation-card p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">System Status</p>
              <p className="text-lg font-semibold text-green-600">Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Conditions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aviation-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
              <Wind className="h-5 w-5 mr-2 text-slate-600" />
              Current Weather Conditions
            </h2>
            <div className="space-y-4">
              {quickWeather.map((weather) => (
                <div 
                  key={weather.icao}
                  className={`p-4 rounded-lg border ${getSeverityColor(weather.severity.level)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{weather.severity.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{weather.icao}</h3>
                        <p className="text-sm opacity-90">{weather.conditions}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TTSControls 
                        text={`${weather.icao}: ${weather.conditions}`}
                        size="small"
                        className="relative"
                      />
                      <div className="text-right text-xs opacity-70">
                        Updated {weather.updated}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Flights */}
          <div className="aviation-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-slate-600" />
              Recent Flight Plans
            </h2>
            <div className="space-y-3">
              {recentFlights.map((flight) => (
                <div key={flight.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Plane className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">{flight.origin} → {flight.destination}</span>
                  </div>
                  <div className="text-sm text-slate-500">{flight.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="space-y-6">
          <AlertsPanel 
            alerts={quickWeather.filter(w => w.severity.level !== 'normal')}
          />
          
          {/* Flight Map */}
          <FlightMap 
            airports={quickWeather}
            height="300px"
          />
          
          {/* Quick Actions */}
          <div className="aviation-card p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-aviation-600 text-white px-4 py-3 rounded-lg hover:bg-aviation-700 transition-colors font-medium">
                New Flight Briefing
              </button>
              <button className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                Decode METAR/TAF
              </button>
              <button className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                Weather Trends
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard