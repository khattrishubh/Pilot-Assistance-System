import { useState } from 'react'
import { Plane, MapPin, AlertTriangle, Download } from 'lucide-react'
import weatherService from '../services/weatherService'
import WeatherCard from './WeatherCard'
import FlightMap from './FlightMap'
import AlertsPanel from './AlertsPanel'
import TTSControls from './TTSControls'
const FlightBriefing = () => {
  const [briefingData, setBriefingData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [route, setRoute] = useState({
    origin: '',
    destination: '',
    alternates: ['']
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const briefing = await weatherService.getFlightBriefing(route)
      setBriefingData(briefing)
    } catch (error) {
      console.error('Failed to generate briefing:', error)
      // Show error to user
      setBriefingData({
        error: error.message || 'Failed to generate flight briefing'
      })
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'caution': return 'text-yellow-600 bg-yellow-50'
      case 'normal': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Flight Briefing</h1>
        <p className="text-slate-600 mt-1">
          Get comprehensive weather briefing for your flight route
        </p>
      </div>

      {/* Route Input Form */}
      <div className="aviation-card p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Flight Route</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Origin Airport (ICAO)
              </label>
              <input
                type="text"
                value={route.origin}
                onChange={(e) => setRoute({...route, origin: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500"
                placeholder="KJFK"
                maxLength={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Destination Airport (ICAO)
              </label>
              <input
                type="text"
                value={route.destination}
                onChange={(e) => setRoute({...route, destination: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500"
                placeholder="KLAX"
                maxLength={4}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Alternate Airports (ICAO)
            </label>
            <input
              type="text"
              value={route.alternates[0]}
              onChange={(e) => setRoute({...route, alternates: [e.target.value.toUpperCase()]})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500"
              placeholder="KORD (optional)"
              maxLength={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !route.origin || !route.destination}
            className="w-full bg-aviation-600 text-white px-6 py-3 rounded-lg hover:bg-aviation-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Generating Briefing...' : 'Get Flight Briefing'}
          </button>
        </form>
      </div>

      {/* Briefing Results */}
      {briefingData && (
        <div className="space-y-6">
          {briefingData.error ? (
            <div className="aviation-card p-6 border-red-200 bg-red-50">
              <div className="flex items-center space-x-2 text-red-700 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Error Loading Briefing</h2>
              </div>
              <p className="text-red-600">{briefingData.error}</p>
            </div>
          ) : (
            <>
              {/* Briefing Summary */}
              <div className="aviation-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                    <Plane className="h-5 w-5 mr-2" />
                    Flight Briefing Summary
                  </h2>
                  <div className="flex items-center space-x-2">
                    <TTSControls 
                      briefingData={briefingData}
                      size="large"
                      className="relative"
                    />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(briefingData.summary?.worstSeverity)}`}>
                      {briefingData.summary?.worstSeverity?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Route Information</h3>
                        <p className="text-slate-700">
                          <span className="font-medium">From:</span> {briefingData.route?.origin} 
                          <span className="mx-2">→</span>
                          <span className="font-medium">To:</span> {briefingData.route?.destination}
                        </p>
                        {briefingData.route?.alternates && briefingData.route.alternates.length > 0 && (
                          <p className="text-slate-600 text-sm mt-1">
                            <span className="font-medium">Alternates:</span> {briefingData.route.alternates.join(', ')}
                          </p>
                        )}
                      </div>
                      
                      {briefingData.summary?.recommendations && briefingData.summary.recommendations.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-2">Recommendations</h3>
                          <ul className="space-y-1">
                            {briefingData.summary.recommendations.map((rec, index) => (
                              <li key={index} className="text-slate-700 text-sm flex items-start">
                                <span className="text-aviation-600 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {briefingData.voiceBriefing && (
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-2">Voice Briefing Summary</h3>
                          <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700">
                            <p><strong>Duration:</strong> ~{briefingData.voiceBriefing.duration} seconds</p>
                            <details className="mt-2">
                              <summary className="cursor-pointer text-aviation-600 hover:text-aviation-700">Show briefing text</summary>
                              <div className="mt-2 text-xs bg-white p-2 rounded border">
                                {briefingData.voiceBriefing.text}
                              </div>
                            </details>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <AlertsPanel 
                      alerts={briefingData.summary?.criticalAlerts || []}
                    />
                  </div>
                </div>
              </div>
              
              {/* Airport Weather Details */}
              {briefingData.airports && Object.keys(briefingData.airports).length > 0 && (
                <div className="aviation-card p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Airport Weather Details
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(briefingData.airports).map(([icao, data]) => (
                      <div key={icao}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          {icao}
                          <span className="ml-2 text-sm px-2 py-1 bg-slate-100 text-slate-600 rounded">
                            {data.role}
                          </span>
                        </h3>
                        {data.metar && (
                          <WeatherCard 
                            data={data.metar}
                            loading={false}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Flight Map */}
              <FlightMap 
                route={briefingData.route}
                airports={Object.entries(briefingData.airports || {}).map(([icao, data]) => ({
                  icao,
                  severity: data.metar?.severity || { level: 'unknown' },
                  conditions: data.metar?.decoded?.summary || 'No data'
                }))}
                height="500px"
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default FlightBriefing