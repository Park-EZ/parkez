// src/pages/QRScanner.jsx
import { useState, useEffect, useRef, useCallback } from "react"
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
import { useAuth } from "@/contexts/AuthContext"
import { BrowserMultiFormatReader } from "@zxing/browser"

export default function QRScanner() {
  const [qrInput, setQrInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [conflictData, setConflictData] = useState(null)
  const [newSpotId, setNewSpotId] = useState(null)

  const [isMobile, setIsMobile] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const videoRef = useRef(null)
  const lastScannedRef = useRef(null)

  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const currentUserId = user?._id

  // Detect mobile to decide whether to show live camera
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera
    const mobile = /android|iphone|ipad|ipod/i.test(ua)
    setIsMobile(mobile)
  }, [])

  /**
   * Core logic to handle a QR string (from camera or manual input)
   */
  const handleScan = useCallback(
    async (rawString) => {
      const raw = (rawString || "").trim()
      if (!raw) return

      // Defaults: plain label
      let label = raw.toUpperCase()
      let qrData = null
      let buildingName = null
      let levelName = null
      let address = null
      let useStructuredSearch = false

      // Try to parse JSON from QR payload
      try {
        const parsed = JSON.parse(raw)
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed["building-name"] === "string" &&
          typeof parsed["level-name"] === "string" &&
          typeof parsed["spot-label"] === "string"
        ) {
          qrData = parsed
          buildingName = parsed["building-name"].trim().toUpperCase()
          levelName = parsed["level-name"].trim().toUpperCase()
          address =
            typeof parsed.address === "string"
              ? parsed.address.trim().toUpperCase()
              : null
          label = parsed["spot-label"].trim().toUpperCase()
          useStructuredSearch = true
        }
      } catch {
        // Not JSON, treat as simple label like "L1-001"
      }

      setLoading(true)
      try {
        const decks = await getDecks()

        // If QR has building info, narrow decks
        let decksToSearch = decks
        if (useStructuredSearch) {
          const filtered = decks.filter((deck) => {
            const deckBuildingName = (deck["building-name"] || deck.name || "")
              .trim()
              .toUpperCase()
            const deckAddress = (deck.address || "").trim().toUpperCase()

            const nameMatches = deckBuildingName === buildingName
            const addressMatches = address ? deckAddress === address : true

            return nameMatches && addressMatches
          })

          if (filtered.length > 0) {
            decksToSearch = filtered
          }
        }

        for (const deck of decksToSearch) {
          const levels = await getLevelsByDeck(deck._id)

          // Narrow levels by level-name if present in QR
          let levelsToSearch = levels
          if (useStructuredSearch) {
            const filteredLevels = levels.filter(
              (lvl) =>
                typeof lvl.name === "string" &&
                lvl.name.trim().toUpperCase() === levelName
            )
            if (filteredLevels.length > 0) {
              levelsToSearch = filteredLevels
            }
          }

          for (const level of levelsToSearch) {
            const spots = await getSpotsByLevel(level._id)
            const found = spots.find(
              (s) => s.label && s.label.trim().toUpperCase() === label
            )

            if (found) {
              // Support both:
              // - Mongo style: status, occupiedBy
              // - Mock style: availabe/available, user_id
              const status = found.status
              const occupiedBy = found.occupiedBy

              const boolAvailable =
                typeof found.available === "boolean"
                  ? found.available
                  : typeof found.availabe === "boolean"
                  ? found.availabe
                  : undefined

              const spotUserId = found.user_id || occupiedBy || null

              // Determine if spot is free
              const isFree =
                boolAvailable !== undefined
                  ? !!boolAvailable && !spotUserId
                  : status
                  ? status === "free"
                  : !spotUserId

              // Determine if current user owns this spot
              const isMine =
                !isFree &&
                currentUserId &&
                spotUserId &&
                String(spotUserId) === String(currentUserId)

              const spotId = found._id ?? found.id

              if (isFree) {
                // Check in
                try {
                  await applySpotSession(spotId)
                  toast({
                    title: "Checked In",
                    description: `Spot ${found.label} is now occupied.`,
                  })
                  navigate(`/decks/${deck._id}/levels/${level._id}/spots`)
                } catch (error) {
                  if (error.conflictData) {
                    setConflictData(error.conflictData)
                    setNewSpotId(spotId)
                    setShowConfirmDialog(true)
                  } else {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to check in",
                      variant: "destructive",
                    })
                  }
                }
              } else if (isMine) {
                // Spot is occupied by this user, so check out
                try {
                  await checkOutSpot(spotId)
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
              } else {
                // Occupied by someone else
                toast({
                  title: "Spot already occupied",
                  description:
                    "This spot is currently occupied by another user.",
                  variant: "destructive",
                })
              }

              setQrInput("")
              return
            }
          }
        }

        // Spot not found
        if (useStructuredSearch && qrData) {
          toast({
            title: "Spot not found",
            description: `Spot "${qrData["spot-label"]}" was not found for ${qrData["building-name"]}, ${qrData["level-name"]}.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Spot not found",
            description: `Spot "${label}" not found in any deck.`,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to process QR code.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [currentUserId, navigate, toast]
  )

  /**
   * Manual submit handler (desktop or manual paste)
   */
  const handleQrSubmit = async (e) => {
    e.preventDefault()
    if (!qrInput.trim()) return
    // Avoid re-processing the same thing the scanner just fired
    lastScannedRef.current = null
    await handleScan(qrInput.trim())
  }

  /**
   * Set up @zxing/browser scanner on mobile to auto-detect QR codes
   */
  useEffect(() => {
    if (!isMobile) return

    const videoElement = videoRef.current
    if (!videoElement) return

    const codeReader = new BrowserMultiFormatReader()
    let cancelled = false

    async function startScanner() {
      try {
        await codeReader.decodeFromVideoDevice(
          null, // default camera
          videoElement,
          async (result, error, controls) => {
            if (cancelled) {
              controls.stop()
              return
            }
            if (result) {
              const text = result.getText()
              // Prevent constant spam of the same code
              if (!text) return
              if (lastScannedRef.current === text) return
              if (loading) return

              lastScannedRef.current = text
              setQrInput(text)
              await handleScan(text)
            }
            // ignore decoding errors (they happen continuously while searching)
          }
        )
      } catch (err) {
        setCameraError(err?.message || "Could not start camera")
      }
    }

    startScanner()

    return () => {
      cancelled = true
      try {
        codeReader.reset()
      } catch {
        // ignore
      }
    }
  }, [isMobile, handleScan, loading])

  const handleConfirmSwitchSpot = async () => {
    if (!conflictData?.currentSpot?._id || !newSpotId) return

    try {
      await checkOutSpot(conflictData.currentSpot._id)
      await applySpotSession(newSpotId)

      toast({
        title: "Spot switched",
        description: "Your parking spot has been updated.",
      })

      setShowConfirmDialog(false)
      setConflictData(null)
      setNewSpotId(null)

      const targetDeckId = conflictData.currentSpot.deckId || conflictData.deckId
      const targetLevelId =
        conflictData.currentSpot.levelId || conflictData.levelId

      if (targetDeckId && targetLevelId) {
        navigate(`/decks/${targetDeckId}/levels/${targetLevelId}/spots`)
      }
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
      {/* Mobile camera section with live auto-scan */}
      {isMobile && (
        <Card className="mb-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Live Camera
            </CardTitle>
            <CardDescription>
              Point your phone at the QR code. It will auto-detect when readable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cameraError ? (
              <p className="text-sm text-destructive">{cameraError}</p>
            ) : (
              <video
                ref={videoRef}
                className="w-full rounded-md"
                playsInline
                muted
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual QR / label input (works everywhere) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Check In / Check Out
          </CardTitle>
          <CardDescription>
            Paste the QR contents or enter the spot label to check in or out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQrSubmit} className="space-y-4">
            <Input
              placeholder='Example: L1-001 or {"building-name":"Cone Deck 1",...}'
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
            <Button onClick={handleConfirmSwitchSpot}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
