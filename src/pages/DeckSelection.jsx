import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getDecks, getDeckAvailability as fetchDeckAvailability } from "@/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  MapPin, 
  ChevronRight, 
  Car, 
  Building2, 
  Phone, 
  Mail, 
  Users,
  Hash,
  CheckCircle2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function DeckSelection() {
  const navigate = useNavigate()
  const { data: decks = [], isLoading } = useQuery({
    queryKey: ["decks"],
    queryFn: getDecks,
  })

  // Fetch availability for all decks using database aggregation (efficient)
  const { data: allDeckAvailability = {}, isLoading: availabilityLoading, error: availabilityError } = useQuery({
    queryKey: ["allDeckAvailability"],
    queryFn: async () => {
      console.log('Fetching availability for', decks.length, 'decks')
      const availabilityMap = {}
      for (const deck of decks) {
        try {
          // Use aggregation endpoint - counts spots in database, doesn't fetch all documents
          const availability = await fetchDeckAvailability(deck._id)
          console.log(`Deck ${deck['building-name']} (${deck._id}):`, availability)
          availabilityMap[deck._id] = availability
        } catch (error) {
          console.error(`Error fetching availability for deck ${deck._id}:`, error)
          availabilityMap[deck._id] = { free: 0, total: 0 }
        }
      }
      console.log('Final availabilityMap:', availabilityMap)
      return availabilityMap
    },
    enabled: decks.length > 0,
  })

  // Debug logging
  if (availabilityError) {
    console.error('Availability query error:', availabilityError)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading decks...</div>
  }

  const formatAddress = (deck) => {
    const parts = [
      deck.ADDRESS1,
      deck.CITY_ID,
      deck.STATE_ID,
      deck.ZIP
    ].filter(Boolean)
    return parts.join(', ') || 'Address not available'
  }

  const getTotalADASpaces = (deck) => {
    const van = parseInt(deck['ada-van'] || 0)
    const car = parseInt(deck['ada-car'] || 0)
    return van + car
  }

  const getDeckAvailability = (deckId) => {
    return allDeckAvailability[deckId] || { free: 0, total: 0 }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">Select Parking Deck</h1>
        <p className="text-muted-foreground">Choose a deck to view levels and spots</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => {
          const totalADA = getTotalADASpaces(deck)
          const availability = getDeckAvailability(deck._id)
          
          return (
            <Card 
              key={deck._id} 
              className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/decks/${deck._id}/levels`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-xl mb-1">
                      <Building2 className="h-5 w-5 text-primary" />
                      {deck['building-name']}
                    </CardTitle>
                    {deck['building-code'] && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Hash className="h-3 w-3" />
                        Code: {deck['building-code']}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-4">
                {/* Availability Info */}
                <div className="space-y-2">
                  {availabilityLoading ? (
                    <div className="text-sm text-muted-foreground">Loading availability...</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium">Available</span>
                        </div>
                        <Badge variant="outline" className="font-semibold border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                          {availability.free}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Total Spaces</span>
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {availability.total || deck['total-spaces'] || 'N/A'}
                        </Badge>
                      </div>
                    </>
                  )}
                  
                  {totalADA > 0 && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium">ADA Spaces</span>
                      </div>
                      <Badge variant="outline" className="font-semibold border-blue-300 dark:border-blue-700">
                        {totalADA}
                        {deck['ada-van'] > 0 && (
                          <span className="ml-1 text-xs">({deck['ada-van']} van)</span>
                        )}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{formatAddress(deck)}</span>
                </div>

                {/* Aliases */}
                {deck.aliases && deck.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {deck.aliases.map((alias, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {alias}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Contact Info */}
                {deck.contacts && deck.contacts.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">
                      Contact:
                    </div>
                    {deck.contacts.slice(0, 1).map((contact, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="font-medium">{contact.name}</div>
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Button */}
                <Button
                  className="w-full mt-auto"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/decks/${deck._id}/levels`)
                  }}
                >
                  View Levels
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {decks.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No parking decks available</p>
        </div>
      )}
    </div>
  )
}
