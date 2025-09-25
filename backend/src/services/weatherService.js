const axios = require('axios');
const WeatherParser = require('./weatherParser');

class WeatherService {
  constructor() {
    this.parser = new WeatherParser();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Mock data for development/demo purposes
    this.mockData = {
      // Normal conditions
      'KJFK': {
        metar: 'METAR KJFK 121251Z 28014G20KT 10SM FEW250 24/18 A3000 RMK AO2 SLP158 T02440183=',
        taf: 'TAF KJFK 121120Z 1212/1318 28015G25KT P6SM FEW250 FM121600 30012KT P6SM SCT250 FM130000 32008KT P6SM BKN250='
      },
      // Caution conditions
      'KLGA': {
        metar: 'METAR KLGA 121251Z 09022G28KT 4SM -RA BKN008 OVC015 18/16 A2992 RMK AO2 SLP132 P0001 T01830161=',
        taf: 'TAF KLGA 121120Z 1212/1318 09025G35KT 3SM -RA BKN008 OVC020 FM121800 12015KT 5SM BKN015 OVC030='
      },
      // Critical conditions
      'KORD': {
        metar: 'METAR KORD 121251Z 27035G45KT 1/2SM +TSRA BKN008 OVC020 CB 15/14 A2965 RMK AO2 TSB35 SLP043 P0015 T01500144=',
        taf: 'TAF KORD 121120Z 1212/1318 27040G50KT 1/4SM +TSRA BKN005 OVC015 CB TEMPO 1212/1216 1/8SM +TSRA FG BKN002='
      },
      // International airports
      'EGLL': {
        metar: 'METAR EGLL 121320Z AUTO 25012KT 9999 FEW035 SCT250 16/11 Q1016 NOSIG=',
        taf: 'TAF EGLL 121100Z 1212/1318 25015KT 9999 SCT035 BECMG 1216/1218 27018G30KT='
      },
      'LFPG': {
        metar: 'METAR LFPG 121330Z 27008KT CAVOK 19/12 Q1018 NOSIG=',
        taf: 'TAF LFPG 121100Z 1212/1318 27010KT CAVOK TEMPO 1218/1222 25015G25KT='
      }
    };
    
    // NOTAM mock data
    this.mockNotams = {
      'KJFK': [
        {
          id: 'NOTAM-001',
          type: 'runway',
          severity: 'caution',
          message: 'RWY 04L/22R CLSD FOR MAINTENANCE 1300-1700 DAILY',
          startTime: '2024-01-15T13:00:00Z',
          endTime: '2024-01-15T17:00:00Z',
          location: 'KJFK'
        }
      ],
      'KLGA': [
        {
          id: 'NOTAM-002',
          type: 'navaid',
          severity: 'normal',
          message: 'ILS RWY 04 GP U/S',
          startTime: '2024-01-15T08:00:00Z',
          endTime: '2024-01-16T20:00:00Z',
          location: 'KLGA'
        }
      ],
      'KORD': [
        {
          id: 'NOTAM-003',
          type: 'runway',
          severity: 'critical',
          message: 'RWY 10C/28C CLSD DUE TO SNOW REMOVAL OPS',
          startTime: '2024-01-15T06:00:00Z',
          endTime: '2024-01-15T18:00:00Z',
          location: 'KORD'
        },
        {
          id: 'NOTAM-004',
          type: 'facility',
          severity: 'caution',
          message: 'TWR FREQ 120.15 U/S USE 121.9',
          startTime: '2024-01-15T10:00:00Z',
          endTime: '2024-01-15T16:00:00Z',
          location: 'KORD'
        }
      ]
    };
  }

  /**
   * Get METAR data for airport
   */
  async getMetar(icaoCode) {
    const cacheKey = `metar_${icaoCode}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      let metarText;
      
      // Try to fetch from real API first, fallback to mock
      try {
        metarText = await this.fetchMetarFromAPI(icaoCode);
      } catch (error) {
        console.log(`Using mock METAR data for ${icaoCode}:`, error.message);
        metarText = this.getMockMetar(icaoCode);
      }

      const result = this.parser.parseMetar(metarText);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get METAR for ${icaoCode}: ${error.message}`);
    }
  }

  /**
   * Get TAF data for airport
   */
  async getTaf(icaoCode) {
    const cacheKey = `taf_${icaoCode}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      let tafText;
      
      // Try to fetch from real API first, fallback to mock
      try {
        tafText = await this.fetchTafFromAPI(icaoCode);
      } catch (error) {
        console.log(`Using mock TAF data for ${icaoCode}:`, error.message);
        tafText = this.getMockTaf(icaoCode);
      }

      const result = this.parser.parseTaf(tafText);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get TAF for ${icaoCode}: ${error.message}`);
    }
  }

  /**
   * Get NOTAMs for airport
   */
  async getNotams(icaoCode) {
    const cacheKey = `notams_${icaoCode}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      let notams;
      
      // Try to fetch from real API first, fallback to mock
      try {
        notams = await this.fetchNotamsFromAPI(icaoCode);
      } catch (error) {
        console.log(`Using mock NOTAM data for ${icaoCode}:`, error.message);
        notams = this.getMockNotams(icaoCode);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: notams,
        timestamp: Date.now()
      });
      
      return notams;
    } catch (error) {
      throw new Error(`Failed to get NOTAMs for ${icaoCode}: ${error.message}`);
    }
  }

  /**
   * Get comprehensive weather briefing for flight route
   */
  async getFlightBriefing(route) {
    const { origin, destination, alternates = [] } = route;
    const airports = [origin, destination, ...alternates];
    
    try {
      const briefing = {
        route,
        airports: {},
        summary: {
          worstSeverity: 'normal',
          criticalAlerts: [],
          recommendations: []
        },
        timestamp: new Date().toISOString()
      };

      // Fetch weather data for all airports in parallel
      const weatherPromises = airports.map(async (icao) => {
        const [metar, taf, notams] = await Promise.all([
          this.getMetar(icao),
          this.getTaf(icao),
          this.getNotams(icao)
        ]);

        return {
          icao,
          metar,
          taf,
          notams
        };
      });

      const airportData = await Promise.all(weatherPromises);

      // Process each airport's data
      airportData.forEach(({ icao, metar, taf, notams }) => {
        briefing.airports[icao] = {
          metar,
          taf,
          notams,
          role: this.getAirportRole(icao, route)
        };

        // Update worst severity
        if (metar.success && this.parser.compareSeverity(metar.severity.level, briefing.summary.worstSeverity) > 0) {
          briefing.summary.worstSeverity = metar.severity.level;
        }

        // Collect critical alerts
        if (metar.success && metar.severity.level === 'critical') {
          briefing.summary.criticalAlerts.push({
            airport: icao,
            type: 'weather',
            message: `Critical weather conditions at ${icao}: ${metar.severity.reasons.join(', ')}`
          });
        }

        // Add critical NOTAMs
        const criticalNotams = notams.filter(notam => notam.severity === 'critical');
        criticalNotams.forEach(notam => {
          briefing.summary.criticalAlerts.push({
            airport: icao,
            type: 'notam',
            message: notam.message
          });
        });
      });

      // Generate recommendations
      briefing.summary.recommendations = this.generateRecommendations(briefing);

      return briefing;
    } catch (error) {
      throw new Error(`Failed to generate flight briefing: ${error.message}`);
    }
  }

  /**
   * Fetch METAR from aviation API (placeholder for real implementation)
   */
  async fetchMetarFromAPI(icaoCode) {
    // This would integrate with real APIs like:
    // - NOAA Aviation Weather Center
    // - AVWX.rest
    // - CheckWX
    // For now, throw error to use mock data
    throw new Error('Real API integration not implemented yet');
  }

  /**
   * Fetch TAF from aviation API (placeholder for real implementation)
   */
  async fetchTafFromAPI(icaoCode) {
    // This would integrate with real APIs
    throw new Error('Real API integration not implemented yet');
  }

  /**
   * Fetch NOTAMs from aviation API (placeholder for real implementation)
   */
  async fetchNotamsFromAPI(icaoCode) {
    // This would integrate with real APIs like FAA NOTAM API
    throw new Error('Real API integration not implemented yet');
  }

  /**
   * Get mock METAR data
   */
  getMockMetar(icaoCode) {
    const mock = this.mockData[icaoCode];
    if (mock) {
      return mock.metar;
    }
    
    // Default mock METAR for unknown airports
    return `METAR ${icaoCode} 121251Z 27012KT 10SM FEW035 SCT100 22/16 A3012 RMK AO2 SLP201=`;
  }

  /**
   * Get mock TAF data
   */
  getMockTaf(icaoCode) {
    const mock = this.mockData[icaoCode];
    if (mock) {
      return mock.taf;
    }
    
    // Default mock TAF for unknown airports
    return `TAF ${icaoCode} 121120Z 1212/1318 27015KT P6SM SCT035 BKN100=`;
  }

  /**
   * Get mock NOTAM data
   */
  getMockNotams(icaoCode) {
    return this.mockNotams[icaoCode] || [];
  }

  /**
   * Determine airport role in flight route
   */
  getAirportRole(icao, route) {
    if (icao === route.origin) return 'origin';
    if (icao === route.destination) return 'destination';
    if (route.alternates && route.alternates.includes(icao)) return 'alternate';
    return 'unknown';
  }

  /**
   * Generate flight recommendations based on weather briefing
   */
  generateRecommendations(briefing) {
    const recommendations = [];
    
    if (briefing.summary.worstSeverity === 'critical') {
      recommendations.push('Consider delaying departure due to critical weather conditions');
      recommendations.push('Review alternate airports and ensure adequate fuel reserves');
    } else if (briefing.summary.worstSeverity === 'caution') {
      recommendations.push('Monitor weather conditions closely during flight');
      recommendations.push('Consider filing for a higher altitude if icing is a concern');
    }

    if (briefing.summary.criticalAlerts.length > 0) {
      recommendations.push('Review all critical alerts before departure');
    }

    if (recommendations.length === 0) {
      recommendations.push('Weather conditions are favorable for flight');
    }

    return recommendations;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

module.exports = WeatherService;