import { useState } from 'react'
import { Cloud, Copy, Download } from 'lucide-react'
import weatherService from '../services/weatherService'
import WeatherCard from './WeatherCard'

const WeatherDecoder = () => {
  const [input, setInput] = useState('')
  const [type, setType] = useState('metar')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleDecode = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    try {
      const decoded = await weatherService.decodeWeather(input.trim(), type)
      setResult(decoded)
    } catch (error) {
      console.error('Failed to decode weather:', error)
      setResult({ 
        success: false, 
        error: error.message || 'Failed to decode weather data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result && result.success) {
      const textToCopy = result.decoded?.summary || 'No decoded text available'
      navigator.clipboard.writeText(textToCopy)
        .then(() => console.log('Copied to clipboard'))
        .catch(err => console.error('Failed to copy:', err))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Weather Decoder</h1>
        <p className="text-slate-600 mt-1">
          Decode raw METAR and TAF reports into plain English
        </p>
      </div>

      <div className="aviation-card p-6">
        <div className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Report Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="metar"
                  checked={type === 'metar'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                METAR
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="taf"
                  checked={type === 'taf'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                TAF
              </label>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Raw {type.toUpperCase()} Text
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aviation-500 focus:border-aviation-500 font-mono text-sm"
              placeholder={`Enter ${type.toUpperCase()} text here...`}
            />
          </div>

          <button
            onClick={handleDecode}
            disabled={loading || !input.trim()}
            className="bg-aviation-600 text-white px-6 py-2 rounded-lg hover:bg-aviation-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Decoding...' : 'Decode Weather'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {result.success ? (
            <>
              {/* Summary Card */}
              <div className="aviation-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                    <Cloud className="h-5 w-5 mr-2" />
                    Decoded {result.type?.toUpperCase() || type.toUpperCase()}
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                
                {result.parsed && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Plain English Summary</h3>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
                      {result.decoded?.summary || 'No summary available'}
                    </p>
                  </div>
                )}
                
                {result.severity && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Conditions Assessment</h3>
                    <div className={`p-4 rounded-lg border-2 ${
                      result.severity.level === 'critical' ? 'border-red-300 bg-red-50' :
                      result.severity.level === 'caution' ? 'border-yellow-300 bg-yellow-50' :
                      'border-green-300 bg-green-50'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{result.severity.emoji}</span>
                        <div>
                          <p className="font-semibold text-lg">{result.severity.description}</p>
                          {result.severity.reasons && result.severity.reasons.length > 0 && (
                            <p className="text-sm mt-1">
                              Concerns: {result.severity.reasons.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {result.raw && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Original Text</h3>
                    <div className="metar-text">
                      <code>{result.raw}</code>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Detailed Weather Card */}
              {result.parsed && (
                <WeatherCard 
                  data={result}
                  loading={false}
                />
              )}
            </>
          ) : (
            <div className="aviation-card p-6 border-red-200 bg-red-50">
              <div className="flex items-center space-x-2 text-red-700 mb-2">
                <Cloud className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Decoding Error</h2>
              </div>
              <p className="text-red-600">{result.error}</p>
              <div className="mt-4 text-sm text-red-600">
                <p>Please check that:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>The text is a valid {type.toUpperCase()} report</li>
                  <li>The ICAO airport code is correct</li>
                  <li>The format matches standard aviation weather reports</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default WeatherDecoder