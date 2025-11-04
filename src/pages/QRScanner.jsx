import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { applySpotSession, getSpotsByLevel, getLevelsByDeck, getDecks } from "@/api"
import { useToast } from "@/hooks/use-toast"
import { QrCode, Camera } from "lucide-react"

export default function QRScanner() {
  const [qrInput, setQrInput] = useState("")
  const [loading, setLoading] = useState(false)
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
            await applySpotSession(found._id)
            setQrInput("")
            toast({
              title: "Spot updated!",
              description: `Spot ${found.label} has been ${found.status === 'free' ? 'checked in' : 'checked out'}.`,
            })
            navigate(`/decks/${deck._id}/availability`)
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
    <div className="space-y-6">
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
    </div>
  )
}

