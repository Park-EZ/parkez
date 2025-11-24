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
        console.log('Dashboard: getMySpot result:', result)
        return result
      } catch (err) {
        console.log('Dashboard: getMySpot error:', err)
        // Return null if 404 (no spot), throw other errors
        if (err.message?.includes('404') || err.message?.includes('No active spot')) {
          return null
        }
        throw err
      }
    },
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  })

  console.log('Dashboard render - mySpotData:', mySpotData, 'isLoading:', isLoading, 'error:', error)

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
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Find and manage your parking spots</p>
      </div>

      {/* Current Occupied Spot */}
      {isLoading && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">Loading your spot...</div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-destructive">Error loading spot: {error.message}</div>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && mySpotData && mySpotData.spot && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-green-600 dark:text-green-400" />
              Your Current Spot
            </CardTitle>
            <CardDescription>You are currently occupying a parking spot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-semibold text-lg">
                  Spot {mySpotData.spot.label}
                </div>
                {mySpotData.level && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {mySpotData.level.name}
                  </div>
                )}
                {mySpotData.deck && (
                  <div className="text-sm text-muted-foreground">
                    {mySpotData.deck['building-name'] || mySpotData.deck.name}
                  </div>
                )}
                {mySpotData.spot.occupiedAt && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Occupied since {new Date(mySpotData.spot.occupiedAt).toLocaleString()}
                  </div>
                )}
              </div>
              <Badge variant="default" className="bg-green-600 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Occupied
              </Badge>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSpotClick}
            >
              Free This Spot
            </Button>
          </CardContent>
        </Card>
      )}

      <CampusMap />

      {/* Confirmation Dialog */}
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

