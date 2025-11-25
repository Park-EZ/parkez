import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MapPin, Car, CheckCircle2 } from "lucide-react"
import { getMySpot, checkOutSpot } from "@/api"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import CampusMap from "@/components/CampusMap"

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [spotToFree, setSpotToFree] = useState(null)

  const { data: mySpotData, isLoading, error } = useQuery({
    queryKey: ["mySpot"],
    queryFn: async () => {
      try {
        const result = await getMySpot()
        return result
      } catch (err) {
        if (err.message?.includes('404') || err.message?.includes('No active spot')) {
          return null
        }
        throw err
      }
    },
    retry: false,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })

  const handleFreeSpot = async () => {
    if (!spotToFree) return

    try {
      await checkOutSpot(spotToFree.spot.id)
      toast({
        title: "Spot freed",
        description: `Spot ${spotToFree.spot.label} is now available.`,
      })
      setShowConfirmDialog(false)
      setSpotToFree(null)
      queryClient.invalidateQueries({ queryKey: ["mySpot"] })
      queryClient.invalidateQueries({ queryKey: ["spots"] })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to free spot",
        variant: "destructive",
      })
    }
  }

  const handleSpotClick = () => {
    if (mySpotData) {
      setSpotToFree(mySpotData)
      setShowConfirmDialog(true)
    }
  }

  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 h-full">
      <div className="flex-shrink-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Find and manage your parking spots</p>
      </div>

      {isLoading && (
        <Card className="flex-shrink-0">
          <CardContent className="py-4 sm:py-6">
            <div className="text-center text-muted-foreground text-sm">Loading your spot...</div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="flex-shrink-0">
          <CardContent className="py-4 sm:py-6">
            <div className="text-center text-destructive text-sm">Error loading spot: {error.message}</div>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && mySpotData && mySpotData.spot && (
        <Card className="flex-shrink-0 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 shadow-lg">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Car className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              Your Current Spot
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">You are currently occupying a parking spot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-4">
            <div className="flex items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                <div className="font-semibold text-base sm:text-lg">
                  Spot {mySpotData.spot.label}
                </div>
                {mySpotData.level && (
                  <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{mySpotData.level.name}</span>
                  </div>
                )}
                {mySpotData.deck && (
                  <div className="text-xs sm:text-sm text-muted-foreground truncate">
                    {mySpotData.deck['building-name'] || mySpotData.deck.name}
                  </div>
                )}
                {mySpotData.spot.occupiedAt && (
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {new Date(mySpotData.spot.occupiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <Badge variant="default" className="bg-green-600 text-white flex-shrink-0 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Occupied</span>
                <span className="sm:hidden">✓</span>
              </Badge>
            </div>
            <Button
              variant="destructive"
              className="w-full text-sm sm:text-base h-8 sm:h-10"
              onClick={handleSpotClick}
            >
              Free This Spot
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        <CampusMap />
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Free Parking Spot?</DialogTitle>
            <DialogDescription>
              Are you sure you want to free spot <strong>{spotToFree?.spot.label}</strong>?
              This will mark the spot as available for other users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFreeSpot}>
              Free Spot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
