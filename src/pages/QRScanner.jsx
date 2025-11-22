import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
import { applySpotSession, getSpotsByLevel, checkOutSpot, checkInSpot, getLevelsByDeck, getDecks } from "@/api"
import { useToast } from "@/hooks/use-toast"
import { QrCode, Camera } from "lucide-react"

export default function QRScanner() {
  const [qrInput, setQrInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [conflictData, setConflictData] = useState(null)
  const [newSpotId, setNewSpotId] = useState(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleQrSubmit = async (e) => {
    e.preventDefault()
    const label = qrInput.trim().toUpperCase()
    if (!label) return

    setLoading(true)
    try {
      const decks = await getDecks()
      
      for (const deck of decks) {
        const levels = await getLevelsByDeck(deck._id)
        for (const level of levels) {
          const spots = await getSpotsByLevel(level._id)
          const found = spots.find((s) => s.label.toUpperCase() === label)
          
          if (found) {
            if (found.status === "free") {
              // CHECK IN
              try {
                await applySpotSession(found._id)
                toast({
                  title: "Checked In",
                  description: `Spot ${found.label} is now occupied.`,
                })
                navigate(`/decks/${deck._id}/levels/${level._id}/spots`)
              } catch (error) {
                // Check if it's a conflict (user already has a spot)
                if (error.conflictData) {
                  setConflictData(error.conflictData)
                  setNewSpotId(found._id)
                  setShowConfirmDialog(true)
                } else {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to check in",
                    variant: "destructive",
                  })
                }
              }
            } else {
              // CHECK OUT
              try {
                await checkOutSpot(found._id)
                toast({
                  title: "Checked Out",
                  description: `Spot ${found.label} is now free.`,
                })
                navigate(`/decks/${deck._id}/levels/${level._id}/spots`)
              } catch (error) {
                toast({
                  title: "Error",
                  description: error.message || "Failed to check out",
                  variant: "destructive",
                })
              }
            }
            setQrInput("")
            return
          }
        }
      }
      
      toast({
        title: "Spot not found",
        description: `Spot "${label}" not found in any deck.`,
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to process QR code.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">QR Code Scanner</h1>
        <p className="text-muted-foreground">Scan or enter a QR code to check in/out</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Check In/Out
          </CardTitle>
          <CardDescription>
            Scan the QR code at the parking spot or enter the spot label manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQrSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="qr-input" className="text-sm font-medium">
                Spot Label or QR Code
              </label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="qr-input"
                  placeholder="Scan QR or type spot label (e.g., B12)"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !qrInput.trim()}>
              {loading ? "Processing..." : "Check In/Out"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Scan the QR code at the parking spot with your camera</p>
          <p>2. Or manually enter the spot label (e.g., "A12", "B05")</p>
          <p>3. The system will automatically check you in if the spot is free, or check you out if you're already checked in</p>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for switching spots */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Parking Spot?</DialogTitle>
            <DialogDescription>
              You are currently occupying spot <strong>{conflictData?.currentSpot?.label}</strong>.
              Do you want to free that spot and occupy the new spot instead?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowConfirmDialog(false)
              setConflictData(null)
              setNewSpotId(null)
              setQrInput("")
            }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!conflictData?.currentSpot?._id || !newSpotId) return
              
              try {
                // Free the current spot
                await checkOutSpot(conflictData.currentSpot._id)
                // Check in to the new spot
                await checkInSpot(newSpotId)
                toast({
                  title: "Spot switched",
                  description: `You are now occupying the new spot.`,
                })
                setShowConfirmDialog(false)
                setConflictData(null)
                setNewSpotId(null)
                setQrInput("")
                // Navigate to the new spot's location
                const decks = await getDecks()
                for (const deck of decks) {
                  const levels = await getLevelsByDeck(deck._id)
                  for (const level of levels) {
                    const spots = await getSpotsByLevel(level._id)
                    if (spots.find(s => s._id === newSpotId)) {
                      navigate(`/decks/${deck._id}/levels/${level._id}/spots`)
                      return
                    }
                  }
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: error.message || "Failed to switch spots",
                  variant: "destructive",
                })
              }
            }}>
              Switch Spot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

