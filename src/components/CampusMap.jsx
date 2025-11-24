import { useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getDecks } from "@/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Building2 } from "lucide-react"
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function CampusMap() {
  const navigate = useNavigate()
  const mapRef = useRef()
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [viewState, setViewState] = useState({
    longitude: -80.7331,
    latitude: 35.3074,
    zoom: 16,
    pitch: 60, // Tilted for 3D effect
    bearing: 0
  })

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ["decks"],
    queryFn: getDecks,
  })

  // Filter to show only decks with valid coordinates
  const validDecks = decks.filter(deck => 
    deck.latitude && deck.longitude &&
    !isNaN(parseFloat(deck.latitude)) &&
    !isNaN(parseFloat(deck.longitude))
  )

  const handleDeckClick = useCallback((deck) => {
    setSelectedDeck(deck)
  }, [])

  const handleNavigateToDeck = useCallback((deckId) => {
    navigate(`/decks/${deckId}/levels`)
  }, [navigate])

  // Add 3D buildings layer when map loads
  const onMapLoad = useCallback(() => {
    if (!mapRef.current) return
    
    const map = mapRef.current.getMap()
    
    // Wait for the style to load
    if (!map.isStyleLoaded()) {
      map.once('styledata', () => {
        addBuildingsLayer(map)
      })
    } else {
      addBuildingsLayer(map)
    }
  }, [])

  const addBuildingsLayer = (map) => {
    try {
      const style = map.getStyle()
      
      // Check what sources are available in the current style
      const sources = style.sources
      const sourceName = Object.keys(sources).find(name => 
        sources[name].type === 'vector'
      )
      
      if (!sourceName) {
        console.log('No vector source available for 3D buildings')
        return
      }

      // Add 3D buildings layer if it doesn't exist
      if (!map.getLayer('3d-buildings')) {
        const layers = style.layers
        const labelLayerId = layers.find(
          (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
        )?.id

        // Try to add the 3D buildings layer
        map.addLayer(
          {
            'id': '3d-buildings',
            'source': sourceName,
            'source-layer': 'building',
            'type': 'fill-extrusion',
            'minzoom': 15,
            'paint': {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['coalesce', ['get', 'render_height'], ['get', 'height'], 15]
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]
              ],
              'fill-extrusion-opacity': 0.6
            }
          },
          labelLayerId
        )
        console.log('3D buildings layer added successfully')
      }
    } catch (error) {
      console.warn('Could not add 3D buildings layer:', error.message)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-muted-foreground">Loading 3D campus map...</div>
      </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 sm:pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Interactive 3D Campus Parking Map</span>
          <span className="sm:hidden">Campus Map</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm hidden sm:block">
          Click on any parking deck marker to view details and available spots
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 sm:pb-3 flex-1 flex flex-col min-h-0">
        <div className="w-full flex-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onLoad={onMapLoad}
            mapStyle="https://tiles.openfreemap.org/styles/liberty"
            style={{ width: '100%', height: '100%' }}
            maxZoom={20}
            minZoom={14}
            touchZoomRotate={true}
            touchPitch={true}
            dragRotate={true}
            dragPan={true}
          >
            <NavigationControl position="top-right" />
            
            {/* Parking Deck Markers */}
            {validDecks.map((deck) => {
              const lat = parseFloat(deck.latitude)
              const lng = parseFloat(deck.longitude)
              
              return (
                <Marker
                  key={deck._id}
                  longitude={lng}
                  latitude={lat}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    handleDeckClick(deck)
                  }}
                >
                  <div 
                    className="cursor-pointer group relative"
                    title={deck['building-name']}
                  >
                    <div className="absolute -inset-2 bg-blue-500 rounded-full animate-pulse opacity-50 group-hover:opacity-75"></div>
                    <div className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-xl border-2 border-white transform transition-transform group-hover:scale-125">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>
                </Marker>
              )
            })}

            {/* Popup for selected deck */}
            {selectedDeck && (
              <Popup
                longitude={parseFloat(selectedDeck.longitude)}
                latitude={parseFloat(selectedDeck.latitude)}
                anchor="top"
                onClose={() => setSelectedDeck(null)}
                closeOnClick={false}
              >
                <div className="p-3 min-w-[200px]">
                  <h3 className="font-bold text-base mb-1">
                    {selectedDeck['building-name']}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Code: {selectedDeck['building-code']}
                  </p>
                  {selectedDeck['total-spaces'] && (
                    <p className="text-xs text-gray-600 mb-2">
                      Total Spaces: {selectedDeck['total-spaces']}
                    </p>
                  )}
                  {selectedDeck.ADDRESS1 && (
                    <p className="text-xs text-gray-500 mb-3">
                      {selectedDeck.ADDRESS1}
                    </p>
                  )}
                  <button
                    onClick={() => handleNavigateToDeck(selectedDeck._id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                  >
                    View Levels & Spots
                  </button>
                </div>
              </Popup>
            )}
          </Map>
        </div>

        {/* Legend and Instructions */}
        <div className="mt-1 sm:mt-2 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="bg-blue-600 rounded-full p-0.5 sm:p-1">
                <Building2 className="h-2 w-2 text-white" />
              </div>
              <span>Deck</span>
            </div>
            <span>•</span>
            <span>{validDecks.length} locations</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
  }