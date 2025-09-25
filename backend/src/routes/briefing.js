const express = require('express');
const WeatherService = require('../services/weatherService');

const router = express.Router();
const weatherService = new WeatherService();

/**
 * POST /api/briefing
 * Get comprehensive flight briefing for route
 */
router.post('/', async (req, res) => {
  try {
    const { origin, destination, alternates, route } = req.body;
    
    // Validate required fields
    if (!origin) {
      return res.status(400).json({
        error: 'Missing required field: origin',
        message: 'Origin airport ICAO code is required'
      });
    }

    if (!destination) {
      return res.status(400).json({
        error: 'Missing required field: destination',
        message: 'Destination airport ICAO code is required'
      });
    }

    // Validate ICAO codes
    const validateIcao = (icao, field) => {
      if (typeof icao !== 'string' || icao.length !== 4) {
        throw new Error(`Invalid ${field} ICAO code: must be 4 characters`);
      }
    };

    validateIcao(origin, 'origin');
    validateIcao(destination, 'destination');

    if (alternates) {
      if (!Array.isArray(alternates)) {
        return res.status(400).json({
          error: 'Invalid alternates',
          message: 'Alternates must be an array of ICAO codes'
        });
      }
      alternates.forEach((alt, index) => validateIcao(alt, `alternate ${index + 1}`));
    }

    // Create route object
    const flightRoute = {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      alternates: alternates ? alternates.map(alt => alt.toUpperCase()) : [],
      routeString: route || `${origin.toUpperCase()}-${destination.toUpperCase()}`,
      plannedDeparture: req.body.plannedDeparture,
      plannedArrival: req.body.plannedArrival,
      aircraft: req.body.aircraft,
      flightLevel: req.body.flightLevel
    };

    // Get comprehensive briefing
    const briefing = await weatherService.getFlightBriefing(flightRoute);

    // Add voice briefing text
    briefing.voiceBriefing = generateVoiceBriefing(briefing);

    res.json({
      success: true,
      ...briefing
    });

  } catch (error) {
    console.error('Briefing generation error:', error);
    res.status(500).json({
      error: 'Failed to generate flight briefing',
      message: error.message
    });
  }
});

/**
 * POST /api/briefing/quick
 * Get quick weather summary for airports
 */
router.post('/quick', async (req, res) => {
  try {
    const { airports } = req.body;
    
    if (!airports || !Array.isArray(airports)) {
      return res.status(400).json({
        error: 'Invalid airports',
        message: 'Airports must be an array of ICAO codes'
      });
    }

    if (airports.length > 5) {
      return res.status(400).json({
        error: 'Too many airports',
        message: 'Maximum 5 airports allowed for quick briefing'
      });
    }

    const quickBriefing = {
      airports: {},
      summary: {
        worstSeverity: 'normal',
        alerts: []
      },
      timestamp: new Date().toISOString()
    };

    // Get quick weather data for each airport
    for (const icao of airports) {
      const upperIcao = icao.toUpperCase();
      
      try {
        const metar = await weatherService.getMetar(upperIcao);
        
        quickBriefing.airports[upperIcao] = {
          conditions: metar.success ? metar.decoded.summary : 'Data unavailable',
          severity: metar.success ? metar.severity : { level: 'unknown', emoji: '⚪' },
          visibility: metar.success && metar.parsed.visibility ? 
            `${metar.parsed.visibility.value} ${metar.parsed.visibility.unit || 'meters'}` : 'Unknown',
          wind: metar.success && metar.parsed.wind ? 
            `${metar.parsed.wind.direction}° at ${metar.parsed.wind.speed} knots` : 'Unknown'
        };

        // Update worst severity
        if (metar.success && weatherService.parser.compareSeverity(metar.severity.level, quickBriefing.summary.worstSeverity) > 0) {
          quickBriefing.summary.worstSeverity = metar.severity.level;
        }

        // Add alerts for non-normal conditions
        if (metar.success && metar.severity.level !== 'normal') {
          quickBriefing.summary.alerts.push({
            airport: upperIcao,
            severity: metar.severity.level,
            message: metar.severity.reasons.join(', ')
          });
        }

      } catch (error) {
        quickBriefing.airports[upperIcao] = {
          error: error.message
        };
      }
    }

    res.json({
      success: true,
      ...quickBriefing
    });

  } catch (error) {
    console.error('Quick briefing error:', error);
    res.status(500).json({
      error: 'Failed to generate quick briefing',
      message: error.message
    });
  }
});

/**
 * GET /api/briefing/voice/:text
 * Convert briefing text to speech-ready format
 */
router.post('/voice', (req, res) => {
  try {
    const { text, type = 'full' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text',
        message: 'Text content is required for voice conversion'
      });
    }

    const voiceText = formatTextForSpeech(text, type);

    res.json({
      success: true,
      original: text,
      voiceText,
      duration: estimateSpeechDuration(voiceText),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Voice briefing error:', error);
    res.status(500).json({
      error: 'Failed to format voice briefing',
      message: error.message
    });
  }
});

/**
 * GET /api/briefing/demo
 * Get demo briefing with sample data
 */
router.get('/demo', async (req, res) => {
  try {
    // Demo route: KJFK -> KLAX with KORD alternate
    const demoRoute = {
      origin: 'KJFK',
      destination: 'KLAX',
      alternates: ['KORD'],
      routeString: 'KJFK-KLAX',
      plannedDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      aircraft: 'B737-800',
      flightLevel: 'FL350'
    };

    const briefing = await weatherService.getFlightBriefing(demoRoute);
    briefing.voiceBriefing = generateVoiceBriefing(briefing);

    res.json({
      success: true,
      demo: true,
      ...briefing
    });

  } catch (error) {
    console.error('Demo briefing error:', error);
    res.status(500).json({
      error: 'Failed to generate demo briefing',
      message: error.message
    });
  }
});

/**
 * Generate voice briefing text from briefing data
 */
function generateVoiceBriefing(briefing) {
  const voiceParts = [];
  
  // Introduction
  voiceParts.push(`Flight briefing for route ${briefing.route.origin} to ${briefing.route.destination}.`);
  
  // Overall conditions
  const severityText = {
    normal: 'Conditions are good for flight.',
    caution: 'Caution advised due to weather conditions.',
    critical: 'Critical weather conditions present. Consider alternatives.'
  };
  
  voiceParts.push(severityText[briefing.summary.worstSeverity] || 'Weather status unknown.');
  
  // Critical alerts
  if (briefing.summary.criticalAlerts.length > 0) {
    voiceParts.push(`${briefing.summary.criticalAlerts.length} critical alert${briefing.summary.criticalAlerts.length > 1 ? 's' : ''}.`);
    briefing.summary.criticalAlerts.slice(0, 3).forEach(alert => {
      voiceParts.push(`${alert.airport}: ${alert.message}`);
    });
  }
  
  // Origin weather
  const originData = briefing.airports[briefing.route.origin];
  if (originData && originData.metar.success) {
    voiceParts.push(`Origin ${briefing.route.origin}: ${simplifyForSpeech(originData.metar.decoded.summary)}`);
  }
  
  // Destination weather
  const destData = briefing.airports[briefing.route.destination];
  if (destData && destData.metar.success) {
    voiceParts.push(`Destination ${briefing.route.destination}: ${simplifyForSpeech(destData.metar.decoded.summary)}`);
  }
  
  // Recommendations
  if (briefing.summary.recommendations.length > 0) {
    voiceParts.push('Recommendations:');
    briefing.summary.recommendations.slice(0, 2).forEach(rec => {
      voiceParts.push(rec);
    });
  }
  
  voiceParts.push('End of briefing.');
  
  return {
    text: voiceParts.join(' '),
    duration: estimateSpeechDuration(voiceParts.join(' ')),
    segments: voiceParts
  };
}

/**
 * Simplify text for speech synthesis
 */
function simplifyForSpeech(text) {
  return text
    .replace(/°/g, ' degrees ')
    .replace(/(\d+)Z/g, '$1 zulu')
    .replace(/(\d+)\/(\d+)/g, '$1 over $2')
    .replace(/\b(\d+)\s*knots?\b/gi, '$1 knots')
    .replace(/\b(\d+)\s*feet?\b/gi, '$1 feet')
    .replace(/\b(\d+)\s*meters?\b/gi, '$1 meters')
    .replace(/\bRMK\b.*$/i, '') // Remove remarks section
    .trim();
}

/**
 * Format text for speech with appropriate pauses and pronunciation
 */
function formatTextForSpeech(text, type) {
  let formatted = text;
  
  // Add pauses after sentences
  formatted = formatted.replace(/\. /g, '. <break time="500ms"/> ');
  
  // Add pauses after colons
  formatted = formatted.replace(/: /g, ': <break time="300ms"/> ');
  
  // Spell out ICAO codes
  formatted = formatted.replace(/\b([A-Z]{4})\b/g, (match) => {
    return match.split('').join(' ');
  });
  
  // Handle numbers for better pronunciation
  formatted = formatted.replace(/(\d+)°/g, '$1 degrees');
  formatted = formatted.replace(/(\d+)Z/g, '$1 zulu');
  
  if (type === 'summary') {
    // For summary, truncate to essential information
    const sentences = formatted.split('. ');
    formatted = sentences.slice(0, 5).join('. ');
  }
  
  return formatted;
}

/**
 * Estimate speech duration in seconds
 */
function estimateSpeechDuration(text) {
  // Average speaking rate: ~150 words per minute for aviation briefings
  const wordsPerMinute = 150;
  const words = text.split(/\s+/).length;
  return Math.ceil((words / wordsPerMinute) * 60);
}

module.exports = router;