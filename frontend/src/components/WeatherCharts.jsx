import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Thermometer, Wind, Eye, Gauge } from 'lucide-react'

const WeatherCharts = ({ weatherData = [], timeframe = '24h' }) => {
  // Sample historical weather data
  const sampleData = [
    { time: '00:00', temperature: 18, windSpeed: 12, visibility: 10000, pressure: 1013 },
    { time: '03:00', temperature: 16, windSpeed: 15, visibility: 8000, pressure: 1012 },
    { time: '06:00', temperature: 14, windSpeed: 18, visibility: 6000, pressure: 1011 },
    { time: '09:00', temperature: 20, windSpeed: 16, visibility: 9000, pressure: 1013 },
    { time: '12:00', temperature: 24, windSpeed: 14, visibility: 10000, pressure: 1015 },
    { time: '15:00', temperature: 26, windSpeed: 12, visibility: 10000, pressure: 1016 },
    { time: '18:00', temperature: 22, windSpeed: 10, visibility: 10000, pressure: 1014 },
    { time: '21:00', temperature: 20, windSpeed: 8, visibility: 10000, pressure: 1013 },
  ]

  // Severity distribution data
  const severityData = [
    { name: 'Normal', value: 65, color: '#10b981' },
    { name: 'Caution', value: 25, color: '#f59e0b' },
    { name: 'Critical', value: 10, color: '#ef4444' },
  ]

  // Wind direction data
  const windDirectionData = [
    { direction: 'N', frequency: 8 },
    { direction: 'NE', frequency: 12 },
    { direction: 'E', frequency: 6 },
    { direction: 'SE', frequency: 4 },
    { direction: 'S', frequency: 10 },
    { direction: 'SW', frequency: 15 },
    { direction: 'W', frequency: 20 },
    { direction: 'NW', frequency: 25 },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-900 mb-1">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}${getUnit(entry.dataKey)}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const getUnit = (dataKey) => {
    switch (dataKey) {
      case 'temperature': return '°C'
      case 'windSpeed': return ' kt'
      case 'visibility': return ' m'
      case 'pressure': return ' hPa'
      default: return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Weather Trends
        </h2>
        <div className="flex items-center space-x-2">
          <select 
            className="text-sm border border-slate-300 rounded px-3 py-1 bg-white"
            defaultValue={timeframe}
          >
            <option value="6h">Last 6 Hours</option>
            <option value="12h">Last 12 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="48h">Last 48 Hours</option>
          </select>
        </div>
      </div>

      {/* Temperature and Wind Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <div className="aviation-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Thermometer className="h-4 w-4 mr-2 text-red-500" />
            Temperature Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                stroke="#64748b"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                label={{ value: '°C', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Wind Speed Chart */}
        <div className="aviation-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Wind className="h-4 w-4 mr-2 text-blue-500" />
            Wind Speed Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                stroke="#64748b"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                label={{ value: 'knots', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="windSpeed" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="aviation-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Condition Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={severityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Wind Direction Frequency */}
        <div className="aviation-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Wind Direction Frequency</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={windDirectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="direction" 
                tick={{ fontSize: 12 }}
                stroke="#64748b"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#64748b"
                label={{ value: '%', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Frequency']}
                labelFormatter={(label) => `Direction: ${label}`}
              />
              <Bar 
                dataKey="frequency" 
                fill="#0ea5e9"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Footer */}
      <div className="text-center text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">
        <p>Charts show historical weather trends and patterns. Data is updated every hour.</p>
        <p className="mt-1">Use these trends to identify patterns and make informed flight planning decisions.</p>
      </div>
    </div>
  )
}

export default WeatherCharts