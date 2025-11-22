// src/pages/QRScanner.jsx
import { useState, useEffect, useRef } from "react"
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
import {
  applySpotSession,
  getSpotsByLevel,
  checkOutSpot,
  getLevelsByDeck,
  getDecks,
} from "@/api"
import { useToast } from "@/hooks/use-toast"
import { QrCode, Camera } from "lucide-react"

export default function QRScanner() {
  const [qrInput, setQrInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [conflictData, setConflictData] = useState(null)
  const [newSpotId, setNewSpotId] = useState(null)

  const [isMobile, setIsMobile] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const videoRef = useRef(null)

  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera
    const mobile = /android|iphone|ipad|ipod/i.test(ua)
    setIsMobile(mobile)

    if (!mobile) return

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera not supported in this browser")
      return
    }

    let stream

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      .then((mediaStream) => {
        stream = mediaStream
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play().catch(() => {})
        }
      })
      .catch((err) => {
        setCameraError(err?.message || "Could not access camera")
      })

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Centralized behavior when a spot has been found
  // Decides check in vs check out based on availability/status
  const processSpotAction = async (spot, deck, level) => {
    // Support both:
    // - status (Mongo style: "free", "occupied")
    // - available (boolean)
    const isFree = spot.status
      ? spot.status === "free"
      : spot.available !== false

    if (isFree) {
      // Check in
      try {
        await applySpotSession(spot._id ?? spot.id)
        toast({
          title: "Scan successful",
          description: `You are checked in to ${spot.label}.`,
        })
        navigate("/") // go back home
      } catch (error) {
        if (error.conflictData) {
          setConflictData(error.conflictData)
          setNewSpotId(spot._id ?? spot.id)
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
      // Check out
      try {
        await checkOutSpot(spot._id ?? spot.id)
        toast({
          title: "Scan successful",
          description: `You are checked out of ${spot.label}.`,
        })
        navigate("/") // go back home
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to check out",
          variant: "destructive",
        })
      }
    }
  }

  const handleQrSubmit = async (e) => {
    e.preventDefault()
    const raw = qrInput.trim()
    if (!raw) return

    setLoading(true)

    try {
      const decks = await getDecks()

      // Try to parse JSON payload first
      let qrData = null
      try {
        const parsed = JSON.parse(raw)
        if (
          parsed &&
          Object.prototype.hasOwnProperty.call(parsed, "deck-id") &&
          Object.prototype.hasOwnProperty.call(parsed, "level-id") &&
          Object.prototype.hasOwnProperty.call(parsed, "spot-id")
        ) {
          qrData = parsed
        }
      } catch (_) {
        // Not JSON, fall back to label mode
      }

      if (qrData) {
        // New QR format: {"deck-id":"1001","level-id":1,"spot-id":1}
        const deckCode = String(qrData["deck-id"])
        const levelNumericId = Number(qrData["level-id"])
        const spotNumericId = Number(qrData["spot-id"])

        const deck = decks.find(
          (d) =>
            String(d["building-code"]) === deckCode ||
            String(d._id) === deckCode
        )

        if (!deck) {
          toast({
            title: "Deck not found",
            description: `Deck with id "${deckCode}" was not found.`,
            variant: "destructive",
          })
          return
        }

        const levels = await getLevelsByDeck(deck._id)
        const level = levels.find((l) => Number(l.id) === levelNumericId)

        if (!level) {
          toast({
            title: "Level not found",
            description: `Level "${levelNumericId}" not found in deck "${deck["building-name"] || deckCode}".`,
            variant: "destructive",
          })
          return
        }

        const spots = await getSpotsByLevel(level._id)
        const spot = spots.find((s) => Number(s.id) === spotNumericId)

        if (!spot) {
          toast({
            title: "Spot not found",
            description: `Spot "${spotNumericId}" not found on level "${level.name}".`,
            variant: "destructive",
          })
          return
        }

        await processSpotAction(spot, deck, level)
        setQrInput("")
        return
      }

      // Fallback: old format, treat input as spot label like "L1-001"
      const label = raw.toUpperCase()

      for (const deck of decks) {
        const levels = await getLevelsByDeck(deck._id)
        for (const level of levels) {
          const spots = await getSpotsByLevel(level._id)
          const found = spots.find(
            (s) => s.label && s.label.toUpperCase() === label
          )

          if (found) {
            await processSpotAction(found, deck, level)
            setQrInput("")
            return
          }
        }
      }

      toast({
        title: "Spot not found",
        description: `Spot "${raw}" not found in any deck.`,
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

  const handleConfirmSwitchSpot = async () => {
    if (!conflictData?.currentSpot?._id || !newSpotId) return

    try {
      // free current spot
      await checkOutSpot(conflictData.currentSpot._id)
      // take new one from QR scan
      await applySpotSession(newSpotId)

      toast({
        title: "Scan successful",
        description: "Your parking spot has been switched.",
      })

      setShowConfirmDialog(false)
      setConflictData(null)
      setNewSpotId(null)

      // After switching, send user to home
      navigate("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to switch spots",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4 p-4">
      {/* Mobile camera section, only shows on phones */}
      {isMobile && (
        <Card className="mb-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Live Camera
            </CardTitle>
            <CardDescription>Point your phone at the QR code.</CardDescription>
          </CardHeader>
          <CardContent>
            {cameraError ? (
              <p className="text-sm text-destructive">{cameraError}</p>
            ) : (
              <video ref={videoRef} className="w-full rounded-md" playsInline />
            )}
          </CardContent>
        </Card>
      )}

      {/* QR input flow, works on all devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Check In / Check Out
          </CardTitle>
          <CardDescription>
            Scan a QR code like{" "}
            <code>{"{\"deck-id\":\"1001\",\"level-id\":1,\"spot-id\":1}"}</code>{" "}
            or enter a spot label (for example, L1-001).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQrSubmit} className="space-y-4">
            <Input
              placeholder='{"deck-id":"1001","level-id":1,"spot-id":1} or L1-001'
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Conflict dialog for switching spots */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Parking Spot?</DialogTitle>
          <DialogDescription>
              You are currently occupying spot{" "}
              <strong>{conflictData?.currentSpot?.label}</strong>. Do you want
              to free that spot and occupy the new one instead?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false)
                setConflictData(null)
                setNewSpotId(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSwitchSpot}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
