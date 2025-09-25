import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Webpack
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

const FlightMap = ({ route, airports = [], height = '400px' }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  // Airport coordinates (sample data - in real app this would come from database)
  const airportCoordinates = {
    'KJFK': [40.6413, -73.7781],
    'KLAX': [33.9425, -118.4081],
    'KORD': [41.9796, -87.9045],
    'KLGA': [40.7769, -73.8740],
    'KBOS': [42.3656, -71.0096],
    'KSEA': [47.4502, -122.3088],
    'KDEN': [39.8561, -104.6737],
    'EGLL': [51.4700, -0.4543],
    'LFPG': [49.0128, 2.5500]
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'caution': return '#f59e0b'
      case 'normal': return '#10b981'
      default: return '#6b7280'
    }
  }

  const createCustomIcon = (severity, isOrigin = false, isDestination = false) => {
    const color = getSeverityColor(severity)
    let iconHtml = `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
      ">
    `
    
    if (isOrigin) iconHtml += '🛫'
    else if (isDestination) iconHtml += '🛬'
    else iconHtml += '✈️'
    
    iconHtml += '</div>'

    return L.divIcon({
      html: iconHtml,
      className: 'custom-airport-marker',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13]
    })
  }

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView([39.8283, -98.5795], 4) // Center of US
    mapInstanceRef.current = map

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current
    
    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    if (!route || !route.origin || !route.destination) return

    const markers = []
    const routeCoordinates = []

    // Add origin marker
    const originCoords = airportCoordinates[route.origin]
    if (originCoords) {
      const originMarker = L.marker(originCoords, {
        icon: createCustomIcon('normal', true, false)
      })
        .bindPopup(`
          <div class="text-center">
            <h3 class="font-bold text-lg">${route.origin}</h3>
            <p class="text-sm text-gray-600">Origin Airport</p>
          </div>
        `)
        .addTo(map)
      
      markers.push(originMarker)
      routeCoordinates.push(originCoords)
    }

    // Add destination marker
    const destCoords = airportCoordinates[route.destination]
    if (destCoords) {
      const destMarker = L.marker(destCoords, {
        icon: createCustomIcon('normal', false, true)
      })
        .bindPopup(`
          <div class="text-center">
            <h3 class="font-bold text-lg">${route.destination}</h3>
            <p class="text-sm text-gray-600">Destination Airport</p>
          </div>
        `)
        .addTo(map)
      
      markers.push(destMarker)
      routeCoordinates.push(destCoords)
    }

    // Add alternate airports
    if (route.alternates && route.alternates.length > 0) {
      route.alternates.forEach(alt => {
        if (alt && airportCoordinates[alt]) {
          const altCoords = airportCoordinates[alt]
          const altMarker = L.marker(altCoords, {
            icon: createCustomIcon('caution')
          })
            .bindPopup(`
              <div class="text-center">
                <h3 class="font-bold text-lg">${alt}</h3>
                <p class="text-sm text-gray-600">Alternate Airport</p>
              </div>
            `)
            .addTo(map)
          
          markers.push(altMarker)
        }
      })
    }

    // Add airports with weather data
    if (airports && airports.length > 0) {
      airports.forEach(airport => {
        const coords = airportCoordinates[airport.icao]
        if (coords && !routeCoordinates.some(coord => coord[0] === coords[0] && coord[1] === coords[1])) {
          const marker = L.marker(coords, {
            icon: createCustomIcon(airport.severity?.level || 'normal')
          })
            .bindPopup(`
              <div class="text-center max-w-xs">
                <h3 class="font-bold text-lg">${airport.icao}</h3>
                <p class="text-sm text-gray-600 mb-2">${airport.severity?.description || 'Weather conditions'}</p>
                ${airport.conditions ? `<p class="text-xs text-gray-500">${airport.conditions}</p>` : ''}
              </div>
            `)
            .addTo(map)
          
          markers.push(marker)
        }
      })
    }

    // Draw flight path
    if (routeCoordinates.length === 2) {
      const flightPath = L.polyline(routeCoordinates, {
        color: '#0ea5e9',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(map)
      
      // Add arrow to show direction
      const midpoint = [
        (routeCoordinates[0][0] + routeCoordinates[1][0]) / 2,
        (routeCoordinates[0][1] + routeCoordinates[1][1]) / 2
      ]
      
      L.marker(midpoint, {
        icon: L.divIcon({
          html: '<div style="font-size: 20px;">✈️</div>',
          className: 'flight-direction-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map)
    }

    // Fit map to show all markers
    if (markers.length > 0) {
      const group = new L.featureGroup(markers)
      map.fitBounds(group.getBounds().pad(0.1))
    }

  }, [route, airports])

  return (
    <div className="aviation-card overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <svg className="h-5 w-5 mr-2 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Flight Route Map
        </h3>
        {route && route.origin && route.destination && (
          <p className="text-sm text-slate-600 mt-1">
            {route.origin} → {route.destination}
            {route.alternates && route.alternates.filter(alt => alt).length > 0 && (
              <span className="ml-2 text-slate-500">
                (Alternates: {route.alternates.filter(alt => alt).join(', ')})
              </span>
            )}
          </p>
        )}
      </div>
      
      <div 
        ref={mapRef}
        style={{ height }}
        className="w-full"
      />
      
      <div className="p-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Normal</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Caution</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Critical</span>
            </div>
          </div>
          <span>Click markers for details</span>
        </div>
      </div>
    </div>
  )
}

export default FlightMap