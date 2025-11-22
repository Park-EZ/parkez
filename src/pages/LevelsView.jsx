import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getDecks, getLevelsByDeck, getLevelAvailability as fetchLevelAvailability } from "@/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, ChevronRight, CheckCircle2, Car, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function LevelsView() {
  const { deckId } = useParams()
  const navigate = useNavigate()

  const { data: deck } = useQuery({
    queryKey: ["deck", deckId],
    queryFn: async () => {
      const decks = await getDecks()
      return decks.find((d) => d._id === deckId)
    },
    enabled: !!deckId,
  })

  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["levels", deckId],
    queryFn: () => getLevelsByDeck(deckId),
    enabled: !!deckId,
  })

  // Fetch availability for all levels
  const { data: allLevelAvailability = {}, isLoading: availabilityLoading } = useQuery({
    queryKey: ["allLevelAvailability", deckId],
    queryFn: async () => {
      const availabilityMap = {}
      for (const level of levels) {
        try {
          // Use aggregation endpoint - counts spots in database, doesn't fetch all documents
          const availability = await fetchLevelAvailability(level._id)
          availabilityMap[level._id] = availability
        } catch (error) {
          console.error(`Error fetching availability for level ${level._id}:`, error)
          availabilityMap[level._id] = { free: 0, total: 0 }
        }
      }
      return availabilityMap
    },
    enabled: levels.length > 0 && !!deckId,
  })

  const getLevelAvailability = (levelId) => {
    return allLevelAvailability[levelId] || { free: 0, total: 0 }
  }

  if (!deck) {
    return (
      <div className="text-center py-8 pb-20">
        <p>Deck not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/decks")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Decks
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/decks")}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{deck['building-name']}</h1>
          <p className="text-muted-foreground">Select a level to view parking spots</p>
        </div>
      </div>

      {levelsLoading ? (
        <div className="text-center py-8">Loading levels...</div>
      ) : levels.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No levels available for this deck</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {levels.map((level) => {
            const availability = getLevelAvailability(level._id)
            
            return (
              <Card
                key={level._id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/decks/${deckId}/levels/${level._id}/spots`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {level.name}
                  </CardTitle>
                  <CardDescription>Level {level.index + 1}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availabilityLoading ? (
                    <div className="text-sm text-muted-foreground">Loading availability...</div>
                  ) : (
                    <div className="space-y-2">
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
                          <span className="text-sm font-medium">Total Spots</span>
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {availability.total}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/decks/${deckId}/levels/${level._id}/spots`)
                    }}
                  >
                    View Spots
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

