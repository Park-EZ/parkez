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
import { BrowserMultiFormatReader } from "@zxing/browser"

export default function QRScanner() {
  const [qrInput, setQrInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [conflictData, setConflictData] = useState(null)
  const [newSpotId, setNewSpotId] = useState(null)

  const [isMobile, setIsMobile] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [cameraFacingIndex, setCameraFacingIndex] = useState(0)
  const [videoDevices, setVideoDevices] = useState([])
  const [noQrHint, setNoQrHint] = useState(false)

  const videoRef = useRef(null)
  const scannerControlsRef = useRef(null)
  const readerRef = useRef(null)
  const lastScanRef = useRef(Date.now())
  const lastTextRef = useRef(null)
  const loadingRef = useRef(false)

  const navigate = useNavigate()
  const { toast } = useToast()

  // Detect mobile
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera
    const mobile = /android|iphone|ipad|ipod/i.test(ua)
    setIsMobile(mobile)
  }, [])

  // Setup ZXing reader and camera devices
  useEffect(() => {
    if (!isMobile) return
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera not supported in this browser")
      return
    }

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    const init = async () => {
      try {
        const devices = await reader.listVideoInputDevices()
        if (!devices || devices.length === 0) {
          setCameraError("No camera devices found")
          return
        }
        setVideoDevices(devices)
        setCameraFacingIndex(0)
      } catch (err) {
        setCameraError(err?.message || "Could not access camera")
      }
    }

    init()

    return () => {
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop()
        scannerControlsRef.current = null
      }
    }
  }, [isMobile])

  // Start / restart decoding when device index changes
  useEffect(() => {
    if (!isMobile) return
    if (!readerRef.current) return
    if (videoDevices.length === 0) return

    const device = videoDevices[cameraFacingIndex]
    if (!device) return

    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop()
      scannerControlsRef.current = null
    }

    lastScanRef.current = Date.now()
    lastTextRef.current = null
    setNoQrHint(false)

    readerRef.current
      .decodeFromVideoDevice(
        device.deviceId,
        videoRef.current,
        (result, err, controls) => {
          if (controls && !scannerControlsRef.current) {
            scannerControlsRef.current = controls
          }

          if (result) {
            const text =
              typeof result.getText === "function"
                ? result.getText()
                : result.text
            if (!text) return

            const now = Date.now()

            if (
              loadingRef.current ||
              (lastTextRef.current === text && now - lastScanRef.current < 3000)
            ) {
              return
            }

            lastScanRef.current = now
            lastTextRef.current = text
            setNoQrHint(false)
            setQrInput(text)
            processQrString(text)
          }
        }
      )
      .catch((err) => {
        setCameraError(err?.message || "Could not start camera")
      })

    return () => {
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop()
        scannerControlsRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, cameraFacingIndex, videoDevices])

  // No-QR-detected hint timer
  useEffect(() => {
    if (!isMobile || cameraError || videoDevices.length === 0) return

    const interval = setInterval(() => {
      const now = Date.now()
      const diff = now - lastScanRef.current
      setNoQrHint(diff > 5000)
    }, 2000)

    return () => clearInterval(interval)
  }, [isMobile, cameraError, videoDevices.length])

  const processSpotAction = async (spot, deck, level) => {
    const isFree = spot.status
      ? spot.status === "free"
      : spot.available !== false

    if (isFree) {
      try {
        await applySpotSession(spot._id ?? spot.id)
        toast({
          title: "Scan successful",
          description: `You are checked in to ${spot.label}.`,
        })
        navigate("/")
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
      try {
        await checkOutSpot(spot._id ?? spot.id)
        toast({
          title: "Scan successful",
          description: `You are checked out of ${spot.label}.`,
        })
        navigate("/")
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to check out",
          variant: "destructive",
        })
      }
    }
  }

  const processQrString = async (raw) => {
    const text = raw.trim()
    if (!text) return

    setLoading(true)
    loadingRef.current = true

    try {
      const decks = await getDecks()

      // Try JSON payload first
      let qrData = null
      try {
        const parsed = JSON.parse(text)
        if (
          parsed &&
          Object.prototype.hasOwnProperty.call(parsed, "deck-id") &&
          Object.prototype.hasOwnProperty.call(parsed, "level-id") &&
          Object.prototype.hasOwnProperty.call(parsed, "spot-id")
        ) {
          qrData = parsed
        }
      } catch {
        // not JSON
      }

      if (qrData) {
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
        return
      }

      // Fallback: label mode (L1-001)
      const label = text.toUpperCase()

      for (const deck of decks) {
        const levels = await getLevelsByDeck(deck._id)
        for (const level of levels) {
          const spots = await getSpotsByLevel(level._id)
          const found = spots.find(
            (s) => s.label && s.label.toUpperCase() === label
          )

          if (found) {
            await processSpotAction(found, deck, level)
            return
          }
        }
      }

      toast({
        title: "Spot not found",
        description: `Spot "${text}" not found in any deck.`,
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
      loadingRef.current = false
    }
  }

  const handleQrSubmit = async (e) => {
    e.preventDefault()
    if (!qrInput.trim()) return
    await processQrString(qrInput)
  }

  const handleConfirmSwitchSpot = async () => {
    if (!conflictData?.currentSpot?._id || !newSpotId) return

    try {
      await checkOutSpot(conflictData.currentSpot._id)
      await applySpotSession(newSpotId)

      toast({
        title: "Scan successful",
        description: "Your parking spot has been switched.",
      })

      setShowConfirmDialog(false)
      setConflictData(null)
      setNewSpotId(null)

      navigate("/")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to switch spots",
        variant: "destructive",
      })
    }
  }

  const handleToggleCameraFacing = () => {
    if (!videoDevices.length) return
    setCameraFacingIndex((prev) => (prev + 1) % videoDevices.length)
  }

  return (
    <div className="space-y-4 p-4">
      {isMobile && (
        <Card className="mb-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Live Camera
              </CardTitle>
              <CardDescription>Point your phone at the QR code.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleCameraFacing}
              disabled={videoDevices.length === 0}
            >
              {videoDevices.length <= 1
                ? "Camera"
                : `Switch camera (${cameraFacingIndex + 1}/${videoDevices.length})`}
            </Button>
          </CardHeader>
          <CardContent>
            {cameraError ? (
              <p className="text-sm text-destructive">{cameraError}</p>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full rounded-md"
                  playsInline
                  muted
                />
                {noQrHint && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No QR code detected yet. Make sure the code is clearly visible.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Check In / Check Out
          </CardTitle>
          <CardDescription>
            The camera will auto-scan, or you can paste the QR contents:
            <br />
            <code>{"{\"deck-id\":\"1001\",\"level-id\":1,\"spot-id\":1}"}</code>{" "}
            or a label like <code>L1-001</code>.
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
