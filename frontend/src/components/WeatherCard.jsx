import { useState } from 'react'
import { Cloud, Wind, Eye, Thermometer, Gauge, RefreshCw } from 'lucide-react'

const WeatherCard = ({ data, loading = false, onRefresh }) => {
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    return (
      <div className="aviation-card p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-slate-200 rounded w-full"></div>
          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!data || !data.success) {
    return (
      <div className="aviation-card p-6 border-red-200 bg-red-50">
        <div className="flex items-center space-x-2 text-red-700">
          <Cloud className="h-5 w-5" />
          <span className="font-medium">Weather data unavailable</span>
        </div>
        <p className="text-sm text-red-600 mt-2">
          {data?.error || 'Unable to fetch weather information'}
        </p>
      </div>
    )
  }

  const { parsed, decoded, severity } = data
  const getSeverityColor = (level) => {
    switch (level) {
      case 'critical': return 'border-red-300 bg-red-50'
      case 'caution': return 'border-yellow-300 bg-yellow-50'
      case 'normal': return 'border-green-300 bg-green-50'
      default: return 'border-slate-300 bg-slate-50'
    }
  }

  return (
    <div className={`aviation-card border-2 ${getSeverityColor(severity.level)}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{severity.emoji}</span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {parsed.station || 'Unknown Airport'}
              </h3>
              <p className="text-sm text-slate-600">{severity.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">
              {new Date(data.timestamp).toLocaleTimeString()}
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title="Refresh weather data"
              >
                <RefreshCw className="h-4 w-4 text-slate-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4">
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          {decoded.summary}
        </p>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Wind */}
          <div className="flex items-center space-x-2">
            <Wind className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Wind</p>
              <p className="text-sm font-medium text-slate-900">
                {decoded.details.wind}
              </p>
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Visibility</p>
              <p className="text-sm font-medium text-slate-900">
                {decoded.details.visibility}
              </p>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex items-center space-x-2">
            <Thermometer className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Temperature</p>
              <p className="text-sm font-medium text-slate-900">
                {decoded.details.temperature}
              </p>
            </div>
          </div>

          {/* Pressure */}
          <div className="flex items-center space-x-2">
            <Gauge className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Pressure</p>
              <p className="text-sm font-medium text-slate-900">
                {decoded.details.pressure}
              </p>
            </div>
          </div>
        </div>

        {/* Weather Phenomena */}
        {decoded.details.weather !== 'No significant weather' && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1">Weather</p>
            <p className="text-sm font-medium text-slate-900">
              {decoded.details.weather}
            </p>
          </div>
        )}

        {/* Clouds */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-1">Clouds</p>
          <p className="text-sm font-medium text-slate-900">
            {decoded.details.clouds}
          </p>
        </div>

        {/* Severity Reasons */}
        {severity.reasons && severity.reasons.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Conditions of concern:</p>
            <div className="flex flex-wrap gap-1">
              {severity.reasons.map((reason, index) => (
                <span
                  key={index}
                  className={`text-xs px-2 py-1 rounded ${
                    severity.level === 'critical' 
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Toggle Raw Data */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          {expanded ? 'Hide' : 'Show'} raw METAR
        </button>

        {expanded && (
          <div className="mt-3 metar-text">
            <code className="text-xs">{data.raw}</code>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeatherCard