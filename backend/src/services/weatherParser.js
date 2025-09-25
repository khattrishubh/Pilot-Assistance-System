const { parseMetar, parseTAF } = require('metar-taf-parser');

/**
 * Weather severity classification system
 * 🟢 Normal → clear skies, good visibility
 * 🟡 Caution → gusty winds, moderate turbulence
 * 🔴 Critical → low visibility, icing, storms, closed runways
 */

class WeatherParser {
  constructor() {
    this.severityRules = {
      critical: {
        visibility: 3000, // meters or less
        ceilingFeet: 200, // feet or less
        windGustKnots: 35, // knots or more
        windSpeedKnots: 25, // knots or more
        thunderstorms: true,
        freezingConditions: true,
        heavyPrecipitation: true,
        severeTurbulence: true
      },
      caution: {
        visibility: 5000, // meters or less
        ceilingFeet: 1000, // feet or less
        windGustKnots: 25, // knots or more
        windSpeedKnots: 20, // knots or more
        moderatePrecipitation: true,
        lightIcing: true,
        moderateTurbulence: true
      }
    };
  }

  /**
   * Parse METAR data and classify severity
   */
  parseMetar(metarText) {
    try {
      const parsed = parseMetar(metarText);
      const decoded = this.decodeMetar(parsed);
      const severity = this.classifyMetarSeverity(parsed);
      
      return {
        success: true,
        raw: metarText,
        parsed,
        decoded,
        severity,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        raw: metarText
      };
    }
  }

  /**
   * Parse TAF data and classify severity
   */
  parseTaf(tafText) {
    try {
      const parsed = parseTAF(tafText);
      const decoded = this.decodeTaf(parsed);
      const severity = this.classifyTafSeverity(parsed);
      
      return {
        success: true,
        raw: tafText,
        parsed,
        decoded,
        severity,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        raw: tafText
      };
    }
  }

  /**
   * Convert parsed METAR to plain English
   */
  decodeMetar(parsed) {
    let description = [];
    
    // Airport and time
    if (parsed.station) {
      description.push(`Weather report for ${parsed.station} at ${this.formatTime(parsed.day, parsed.hour, parsed.minute)}`);
    } else {
      description.push(`Weather report at ${this.formatTime(parsed.day, parsed.hour, parsed.minute)}`);
    }
    
    // Wind conditions
    if (parsed.wind) {
      const windDesc = this.describeWind(parsed.wind);
      description.push(windDesc);
    }
    
    // Visibility
    if (parsed.visibility) {
      description.push(this.describeVisibility(parsed.visibility));
    }
    
    // Weather phenomena
    if (parsed.weatherConditions && parsed.weatherConditions.length > 0) {
      description.push(this.describeWeatherConditions(parsed.weatherConditions));
    }
    
    // Clouds
    if (parsed.clouds && parsed.clouds.length > 0) {
      description.push(this.describeClouds(parsed.clouds));
    }
    
    // Temperature and dew point
    if (parsed.temperature !== undefined && parsed.dewPoint !== undefined) {
      description.push(`Temperature ${parsed.temperature}°C, dew point ${parsed.dewPoint}°C`);
    }
    
    // Pressure
    if (parsed.altimeter) {
      description.push(`Altimeter setting ${parsed.altimeter.value} ${parsed.altimeter.unit}`);
    }
    
    return {
      summary: description.join('. '),
      details: {
        wind: parsed.wind ? this.describeWind(parsed.wind) : 'Wind information not available',
        visibility: parsed.visibility ? this.describeVisibility(parsed.visibility) : 'Visibility not reported',
        weather: parsed.weatherConditions ? this.describeWeatherConditions(parsed.weatherConditions) : 'No significant weather',
        clouds: parsed.clouds ? this.describeClouds(parsed.clouds) : 'Cloud information not available',
        temperature: parsed.temperature !== undefined ? `${parsed.temperature}°C` : 'Not reported',
        pressure: parsed.altimeter ? `${parsed.altimeter.value} ${parsed.altimeter.unit}` : 'Not reported'
      }
    };
  }

  /**
   * Convert parsed TAF to plain English
   */
  decodeTaf(parsed) {
    let description = [];
    
    description.push(`Terminal Aerodrome Forecast for ${parsed.icao}`);
    description.push(`Valid from ${this.formatTafTime(parsed.validity)}`);
    
    // Initial forecast
    if (parsed.initialConditions) {
      description.push('Initial conditions: ' + this.describeForecastConditions(parsed.initialConditions));
    }
    
    // Changes
    if (parsed.changes && parsed.changes.length > 0) {
      parsed.changes.forEach(change => {
        description.push(`${change.type} ${this.formatTafTime(change.validity)}: ${this.describeForecastConditions(change)}`);
      });
    }
    
    return {
      summary: description.join('. '),
      periods: this.extractTafPeriods(parsed)
    };
  }

  /**
   * Classify METAR severity based on conditions
   */
  classifyMetarSeverity(parsed) {
    let severity = 'normal';
    let reasons = [];

    // Check critical conditions
    if (this.isCriticalCondition(parsed)) {
      severity = 'critical';
      reasons = this.getCriticalReasons(parsed);
    } else if (this.isCautionCondition(parsed)) {
      severity = 'caution';
      reasons = this.getCautionReasons(parsed);
    }

    return {
      level: severity,
      emoji: this.getSeverityEmoji(severity),
      reasons,
      description: this.getSeverityDescription(severity)
    };
  }

  /**
   * Classify TAF severity (worst case from all periods)
   */
  classifyTafSeverity(parsed) {
    let worstSeverity = 'normal';
    let allReasons = [];

    // Check initial conditions
    if (parsed.initialConditions) {
      const initialSeverity = this.classifyMetarSeverity(parsed.initialConditions);
      if (this.compareSeverity(initialSeverity.level, worstSeverity) > 0) {
        worstSeverity = initialSeverity.level;
        allReasons.push(...initialSeverity.reasons);
      }
    }

    // Check all change periods
    if (parsed.changes) {
      parsed.changes.forEach(change => {
        const changeSeverity = this.classifyMetarSeverity(change);
        if (this.compareSeverity(changeSeverity.level, worstSeverity) > 0) {
          worstSeverity = changeSeverity.level;
          allReasons.push(...changeSeverity.reasons);
        }
      });
    }

    return {
      level: worstSeverity,
      emoji: this.getSeverityEmoji(worstSeverity),
      reasons: [...new Set(allReasons)], // Remove duplicates
      description: this.getSeverityDescription(worstSeverity)
    };
  }

  // Helper methods for condition checking
  isCriticalCondition(conditions) {
    const rules = this.severityRules.critical;
    
    // Low visibility (check if visibility is in statute miles)
    if (conditions.visibility) {
      const visibilityInMeters = conditions.visibility.unit === 'SM' ? 
        conditions.visibility.value * 1609.34 : conditions.visibility.value;
      if (visibilityInMeters <= rules.visibility) return true;
    }
    
    // Low ceiling
    if (this.getLowestCeiling(conditions.clouds) <= rules.ceilingFeet) return true;
    
    // High winds
    if (conditions.wind) {
      if (conditions.wind.gust && conditions.wind.gust >= rules.windGustKnots) return true;
      if (conditions.wind.speed >= rules.windSpeedKnots) return true;
    }
    
    // Thunderstorms
    if (this.hasThunderstorms(conditions.weatherConditions)) return true;
    
    // Freezing conditions
    if (this.hasFreezingConditions(conditions)) return true;
    
    // Heavy precipitation
    if (this.hasHeavyPrecipitation(conditions.weatherConditions)) return true;
    
    return false;
  }

  isCautionCondition(conditions) {
    const rules = this.severityRules.caution;
    
    // Reduced visibility (check if visibility is in statute miles)
    if (conditions.visibility) {
      const visibilityInMeters = conditions.visibility.unit === 'SM' ? 
        conditions.visibility.value * 1609.34 : conditions.visibility.value;
      if (visibilityInMeters <= rules.visibility) return true;
    }
    
    // Low ceiling
    if (this.getLowestCeiling(conditions.clouds) <= rules.ceilingFeet) return true;
    
    // Gusty winds
    if (conditions.wind) {
      if (conditions.wind.gust && conditions.wind.gust >= rules.windGustKnots) return true;
      if (conditions.wind.speed >= rules.windSpeedKnots) return true;
    }
    
    // Moderate precipitation
    if (this.hasModeratePrecipitation(conditions.weatherConditions)) return true;
    
    return false;
  }

  getCriticalReasons(conditions) {
    const reasons = [];
    
    if (conditions.visibility) {
      const visibilityInMeters = conditions.visibility.unit === 'SM' ? 
        conditions.visibility.value * 1609.34 : conditions.visibility.value;
      if (visibilityInMeters <= 3000) {
        reasons.push('Very low visibility');
      }
    }
    if (this.getLowestCeiling(conditions.clouds) <= 200) {
      reasons.push('Very low ceiling');
    }
    if (conditions.wind?.gust >= 35) {
      reasons.push('Severe wind gusts');
    }
    if (this.hasThunderstorms(conditions.weatherConditions)) {
      reasons.push('Thunderstorms');
    }
    if (this.hasFreezingConditions(conditions)) {
      reasons.push('Icing conditions');
    }
    
    return reasons;
  }

  getCautionReasons(conditions) {
    const reasons = [];
    
    if (conditions.visibility) {
      const visibilityInMeters = conditions.visibility.unit === 'SM' ? 
        conditions.visibility.value * 1609.34 : conditions.visibility.value;
      if (visibilityInMeters <= 5000) {
        reasons.push('Reduced visibility');
      }
    }
    if (this.getLowestCeiling(conditions.clouds) <= 1000) {
      reasons.push('Low ceiling');
    }
    if (conditions.wind?.gust >= 25) {
      reasons.push('Gusty winds');
    }
    if (this.hasModeratePrecipitation(conditions.weatherConditions)) {
      reasons.push('Precipitation');
    }
    
    return reasons;
  }

  // Utility methods
  getSeverityEmoji(severity) {
    const emojis = {
      normal: '🟢',
      caution: '🟡',
      critical: '🔴'
    };
    return emojis[severity] || '⚪';
  }

  getSeverityDescription(severity) {
    const descriptions = {
      normal: 'Good flying conditions',
      caution: 'Use caution - monitor conditions',
      critical: 'Poor conditions - consider alternatives'
    };
    return descriptions[severity] || 'Unknown conditions';
  }

  compareSeverity(severity1, severity2) {
    const levels = { normal: 0, caution: 1, critical: 2 };
    return levels[severity1] - levels[severity2];
  }

  describeWind(wind) {
    if (!wind) return 'Wind information not available';
    
    let windDesc = '';
    if (wind.direction === 'VRB') {
      windDesc = 'Variable wind';
    } else {
      windDesc = `Wind from ${wind.direction}°`;
    }
    
    windDesc += ` at ${wind.speed} knots`;
    
    if (wind.gust) {
      windDesc += `, gusting to ${wind.gust} knots`;
    }
    
    return windDesc;
  }

  describeVisibility(visibility) {
    if (!visibility) return 'Visibility not reported';
    
    if (visibility.value >= 9999) {
      return 'Visibility greater than 10 kilometers';
    }
    
    return `Visibility ${visibility.value} ${visibility.unit || 'meters'}`;
  }

  describeWeatherConditions(conditions) {
    if (!conditions || conditions.length === 0) return 'No significant weather';
    
    return conditions.map(condition => {
      let desc = '';
      if (condition.intensity) desc += condition.intensity + ' ';
      if (condition.description) desc += condition.description + ' ';
      if (condition.phenomena) desc += condition.phenomena.join(', ');
      return desc.trim();
    }).join(', ');
  }

  describeClouds(clouds) {
    if (!clouds || clouds.length === 0) return 'Clear skies';
    
    return clouds.map(cloud => {
      let desc = cloud.quantity || '';
      if (cloud.height) desc += ` at ${cloud.height} feet`;
      if (cloud.type) desc += ` (${cloud.type})`;
      return desc;
    }).join(', ');
  }

  describeForecastConditions(conditions) {
    let parts = [];
    
    if (conditions.wind) parts.push(this.describeWind(conditions.wind));
    if (conditions.visibility) parts.push(this.describeVisibility(conditions.visibility));
    if (conditions.weatherConditions) parts.push(this.describeWeatherConditions(conditions.weatherConditions));
    if (conditions.clouds) parts.push(this.describeClouds(conditions.clouds));
    
    return parts.join(', ') || 'No significant conditions';
  }

  getLowestCeiling(clouds) {
    if (!clouds || clouds.length === 0) return 9999;
    
    const ceilingClouds = clouds.filter(cloud => 
      cloud.quantity === 'BKN' || cloud.quantity === 'OVC'
    );
    
    if (ceilingClouds.length === 0) return 9999;
    
    return Math.min(...ceilingClouds.map(cloud => cloud.height || 9999));
  }

  hasThunderstorms(conditions) {
    if (!conditions) return false;
    return conditions.some(condition => 
      condition.phenomena && condition.phenomena.includes('TS')
    );
  }

  hasFreezingConditions(conditions) {
    if (conditions.temperature !== undefined && conditions.temperature <= 0) return true;
    if (!conditions.weatherConditions) return false;
    return conditions.weatherConditions.some(condition =>
      condition.phenomena && (
        condition.phenomena.includes('FZ') ||
        condition.phenomena.includes('IC')
      )
    );
  }

  hasHeavyPrecipitation(conditions) {
    if (!conditions) return false;
    return conditions.some(condition => condition.intensity === '+');
  }

  hasModeratePrecipitation(conditions) {
    if (!conditions) return false;
    return conditions.some(condition => 
      condition.intensity === '' || condition.intensity === '-'
    );
  }

  formatTime(day, hour, minute) {
    return `${day.toString().padStart(2, '0')}${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}Z`;
  }

  formatTafTime(validity) {
    if (!validity) return 'Time not specified';
    return `${validity.startDay}${validity.startHour}${validity.startMinute}Z to ${validity.endDay}${validity.endHour}${validity.endMinute}Z`;
  }

  extractTafPeriods(parsed) {
    const periods = [];
    
    if (parsed.initialConditions) {
      periods.push({
        type: 'Initial',
        validity: parsed.validity,
        conditions: this.describeForecastConditions(parsed.initialConditions),
        severity: this.classifyMetarSeverity(parsed.initialConditions)
      });
    }
    
    if (parsed.changes) {
      parsed.changes.forEach(change => {
        periods.push({
          type: change.type || 'Change',
          validity: change.validity,
          conditions: this.describeForecastConditions(change),
          severity: this.classifyMetarSeverity(change)
        });
      });
    }
    
    return periods;
  }
}

module.exports = WeatherParser;