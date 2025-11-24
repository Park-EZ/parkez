import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getLevelsByDeck, getSpotsByLevel, getDecks, checkInSpot, checkOutSpot, getMySpot, getLevelAvailability } from "@/api"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import SpotGrid from "@/components/SpotGrid"
import { Search, ArrowLeft, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SpotAvailability() {
  const { deckId, levelId } = useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { preferADA } = useUserPreferences()
  const { user } = useAuth()
  const { toast } = useToast()
  const [filterType, setFilterType] = useState("all")
  const [search, setSearch] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [conflictData, setConflictData] = useState(null)
  const [newSpotId, setNewSpotId] = useState(null)
  const [showFreeSpotDialog, setShowFreeSpotDialog] = useState(false)
  const [spotToFree, setSpotToFree] = useState(null)

  const { data: deck } = useQuery({
    queryKey: ["deck", deckId],
    queryFn: async () => {
      const decks = await getDecks()
      return decks.find((d) => d._id === deckId)
    },
    enabled: !!deckId,
  })

  const { data: level } = useQuery({
    queryKey: ["level", levelId],
    queryFn: async () => {
      const levels = await getLevelsByDeck(deckId)
      return levels.find((l) => l._id === levelId)
    },
    enabled: !!deckId && !!levelId,
  })

  const { data: spots = [], isLoading: spotsLoading } = useQuery({
    queryKey: ["spots", levelId],
    queryFn: () => getSpotsByLevel(levelId),
    enabled: !!levelId,
    refetchInterval: 1000, // Refetch every 1 second for real-time updates
    refetchIntervalInBackground: true, // Continue refetching even when tab is not focused
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    staleTime: 0, // Always consider data stale
  })


  const filteredSpots = useMemo(() => {
    return spots.filter(
      (s) => {
        // Determine spot type from handicap field (JSON structure)
        const spotType = s.handicap ? 'ADA' : 'standard'
        
        return (
          (filterType === "all" || spotType === filterType) &&
          s.label.toLowerCase().includes(search.toLowerCase()) &&
          (!preferADA || s.handicap === true) // Filter by ADA preference (use handicap field from JSON)
        )
      }
    )
  }, [spots, filterType, search, preferADA])

  const availability = useMemo(() => {
    // Filter spots based on ADA preference
    const relevantSpots = preferADA 
      ? spots.filter(s => s.handicap === true)
      : spots
    
    // A spot is free if user_id is null or empty string (database-driven)
    const free = relevantSpots.filter(s => !s.user_id || s.user_id === '').length
    const total = relevantSpots.length
    return { free, total }
  }, [spots, preferADA])

  if (!deck || !level) {
    return (
      <div className="text-center py-8 pb-20">
        <p>Deck or level not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/decks/${deckId}/levels`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Levels
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
          onClick={() => navigate(`/decks/${deckId}/levels`)}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{level.name}</h1>
          <p className="text-muted-foreground">{deck['building-name']}</p>
        </div>
      </div>

      {/* Availability Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Availability Summary
          </CardTitle>
          <CardDescription>
            {spotsLoading ? 'Loading...' : `${availability.free} free out of ${availability.total} total spots`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spot label (e.g., B12)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-background"
        >
          <option value="all">All Types</option>
          <option value="standard">Standard</option>
          <option value="EV">EV</option>
          <option value="ADA">ADA</option>
        </select>
      </div>

      {/* Spots Grid */}
      {spotsLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading spots...</div>
      ) : filteredSpots.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No spots found matching your criteria</p>
            {(search || filterType !== "all" || preferADA) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearch("")
                  setFilterType("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <SpotGrid
            spots={filteredSpots}
            currentUserId={user?._id || user?.id || null}
            onToggle={async (spotId) => {
              const spot = filteredSpots.find(s => s.id === spotId)
              if (!spot) return

              const currentUserId = user?._id || user?.id
              // A spot is occupied if user_id has a value (not null or empty string)
              const isOccupied = spot.user_id && spot.user_id !== ''
              const isMySpot = isOccupied && currentUserId && spot.user_id === currentUserId

              // If clicking on own spot, show free confirmation dialog
              if (isMySpot) {
                setSpotToFree(spot)
                setShowFreeSpotDialog(true)
                return
              }

              // Only allow check-in for free spots (spots where user_id is empty/null)
              if (!isOccupied) {
                try {
                  // Immediately refetch to get latest state before attempting check-in
                  await queryClient.invalidateQueries({ queryKey: ["spots", levelId] })
                  await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for query to complete
                  
                  await checkInSpot(spot.id)
                  toast({
                    title: "Spot occupied",
                    description: `Spot ${spot.label} is now occupied.`,
                  })
                  // Immediately refetch all related data
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["spots", levelId] }),
                    queryClient.invalidateQueries({ queryKey: ["levelAvailability", levelId] }),
                    queryClient.invalidateQueries({ queryKey: ["mySpot"] })
                  ])
                } catch (error) {
                  // Check if it's a conflict (user already has a spot)
                  if (error.conflictData) {
                    setConflictData(error.conflictData)
                    setNewSpotId(spot.id)
                    setShowConfirmDialog(true)
                  } else {
                    // Likely a race condition - spot was taken
                    toast({
                      title: "Spot unavailable",
                      description: error.message?.includes('already occupied') || error.message?.includes('not available')
                        ? `Someone just took spot ${spot.label}. Please select another spot.`
                        : error.message || "Failed to occupy spot",
                      variant: "destructive",
                    })
                    // Immediately refetch to show current state
                    queryClient.invalidateQueries({ queryKey: ["spots", levelId] })
                  }
                }
              } else {
                // Spot is occupied by someone else - can't check in
                toast({
                  title: "Spot unavailable",
                  description: `Spot ${spot.label} is already occupied by another user.`,
                  variant: "destructive",
                })
              }
            }}
          />
          
          {/* Confirmation Dialog for switching spots */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Switch Parking Spot?</DialogTitle>
                <DialogDescription>
                  You are currently occupying spot <strong>{conflictData?.currentSpot?.label}</strong>.
                  Do you want to free that spot and occupy spot <strong>{filteredSpots.find(s => s._id === newSpotId)?.label}</strong> instead?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowConfirmDialog(false)
                  setConflictData(null)
                  setNewSpotId(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={async () => {
                  if (!conflictData?.currentSpot?.id || !newSpotId) return
                  
                  try {
                    // Verify spot is still available before switching
                    await queryClient.invalidateQueries({ queryKey: ["spots", levelId] })
                    await new Promise(resolve => setTimeout(resolve, 100))
                    
                    // Free the current spot
                    await checkOutSpot(conflictData.currentSpot.id)
                    // Check in to the new spot
                    await checkInSpot(newSpotId)
                    toast({
                      title: "Spot switched",
                      description: `You are now occupying spot ${filteredSpots.find(s => s.id === newSpotId)?.label}.`,
                    })
                    setShowConfirmDialog(false)
                    setConflictData(null)
                    setNewSpotId(null)
                    // Immediately refetch
                    await Promise.all([
                      queryClient.invalidateQueries({ queryKey: ["spots", levelId] }),
                      queryClient.invalidateQueries({ queryKey: ["levelAvailability", levelId] }),
                      queryClient.invalidateQueries({ queryKey: ["mySpot"] })
                    ])
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: error.message?.includes('already occupied') || error.message?.includes('not available')
                        ? "Someone just took that spot. Please select another one."
                        : error.message || "Failed to switch spots",
                      variant: "destructive",
                    })
                    // Refetch to show current state
                    queryClient.invalidateQueries({ queryKey: ["spots", levelId] })
                  }
                }}>
                  Switch Spot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirmation Dialog for freeing own spot */}
          <Dialog open={showFreeSpotDialog} onOpenChange={setShowFreeSpotDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Free Parking Spot?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to free spot <strong>{spotToFree?.label}</strong>?
                  This will mark the spot as available for other users.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowFreeSpotDialog(false)
                  setSpotToFree(null)
                }}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={async () => {
                  if (!spotToFree?.id) return
                  
                  try {
                    await checkOutSpot(spotToFree.id)
                    toast({
                      title: "Spot freed",
                      description: `Spot ${spotToFree.label} is now available.`,
                    })
                    setShowFreeSpotDialog(false)
                    setSpotToFree(null)
                    // Immediately refetch all related data
                    await Promise.all([
                      queryClient.invalidateQueries({ queryKey: ["spots", levelId] }),
                      queryClient.invalidateQueries({ queryKey: ["levelAvailability", levelId] }),
                      queryClient.invalidateQueries({ queryKey: ["mySpot"] })
                    ])
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to free spot",
                      variant: "destructive",
                    })
                  }
                }}>
                  Free Spot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
