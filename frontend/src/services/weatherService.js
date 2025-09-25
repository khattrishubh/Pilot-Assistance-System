import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

class WeatherService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('❌ API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        console.error('❌ API Response Error:', error.response?.data || error.message)
        return Promise.reject(this.handleApiError(error))
      }
    )
  }

  handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'Server error occurred',
        status: error.response.status,
        data: error.response.data
      }
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Unable to connect to weather service. Please check your connection.',
        status: 0,
        data: null
      }
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1,
        data: null
      }
    }
  }

  /**
   * Decode raw METAR or TAF text
   */
  async decodeWeather(text, type = 'metar') {
    try {
      const response = await this.client.post('/weather/decode', {
        text: text.trim(),
        type: type.toLowerCase()
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Get METAR data for specific airport
   */
  async getMetar(icaoCode) {
    try {
      const response = await this.client.get(`/weather/metar/${icaoCode.toUpperCase()}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Get TAF data for specific airport
   */
  async getTaf(icaoCode) {
    try {
      const response = await this.client.get(`/weather/taf/${icaoCode.toUpperCase()}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Get NOTAMs for specific airport
   */
  async getNotams(icaoCode) {
    try {
      const response = await this.client.get(`/weather/notams/${icaoCode.toUpperCase()}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Get weather data for multiple airports
   */
  async getMultipleWeather(airports, types = ['metar', 'taf', 'notams']) {
    try {
      const response = await this.client.post('/weather/multiple', {
        airports: airports.map(icao => icao.toUpperCase()),
        types
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Get comprehensive flight briefing
   */
  async getFlightBriefing(route) {
    try {
      const response = await this.client.post('/briefing', {
        origin: route.origin.toUpperCase(),
        destination: route.destination.toUpperCase(),
        alternates: route.alternates?.filter(alt => alt).map(alt => alt.toUpperCase()) || [],
        plannedDeparture: route.plannedDeparture,
        plannedArrival: route.plannedArrival,
        aircraft: route.aircraft,
        flightLevel: route.flightLevel
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Get quick weather briefing for airports
   */
  async getQuickBriefing(airports) {
    try {
      const response = await this.client.post('/briefing/quick', {
        airports: airports.map(icao => icao.toUpperCase())
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Get demo flight briefing
   */
  async getDemoBriefing() {
    try {
      const response = await this.client.get('/briefing/demo')
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Convert text to speech-ready format
   */
  async getVoiceBriefing(text, type = 'full') {
    try {
      const response = await this.client.post('/briefing/voice', {
        text,
        type
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`)
      return response.data
    } catch (error) {
      throw this.handleApiError(error)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const response = await this.client.get('/weather/cache/stats')
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Clear weather data cache
   */
  async clearCache() {
    try {
      const response = await this.client.delete('/weather/cache')
      return response.data
    } catch (error) {
      throw error
    }
  }
}

// Create singleton instance
const weatherService = new WeatherService()

export default weatherService

// Named exports for specific functions
export const { 
  decodeWeather, 
  getMetar, 
  getTaf, 
  getNotams, 
  getMultipleWeather, 
  getFlightBriefing, 
  getQuickBriefing, 
  getDemoBriefing, 
  getVoiceBriefing,
  checkHealth,
  getCacheStats,
  clearCache
} = weatherService