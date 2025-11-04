import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getSpotsByLevel, getLevelsByDeck, getDecks } from "@/api"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ReportStatus() {
  const [spotLabel, setSpotLabel] = useState("")
  const [reportType, setReportType] = useState("occupied-to-available")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!spotLabel.trim()) return

    setLoading(true)
    try {
      const decks = await getDecks()
      let found = false
      
      for (const deck of decks) {
        const levels = await getLevelsByDeck(deck._id)
        for (const level of levels) {
          const spots = await getSpotsByLevel(level._id)
          const spot = spots.find((s) => s.label.toUpperCase() === spotLabel.trim().toUpperCase())
          
          if (spot) {
            found = true
            // TODO: Replace with actual API call to report status
            // await reportSpotStatus(spot._id, reportType, notes)
            
            toast({
              title: "Report submitted",
              description: `Your report for spot ${spot.label} has been submitted and will be reviewed.`,
            })
            setSpotLabel("")
            setNotes("")
            navigate("/dashboard")
            return
          }
        }
      }
      
      if (!found) {
        toast({
          title: "Spot not found",
          description: `Spot "${spotLabel}" not found in any deck.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Report Incorrect Status</h1>
        <p className="text-muted-foreground">Help us improve accuracy by reporting incorrect spot statuses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Submit Report
          </CardTitle>
          <CardDescription>
            Report if a spot is showing as available but is occupied, or vice versa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="spot-label" className="text-sm font-medium">
                Spot Label
              </label>
              <Input
                id="spot-label"
                placeholder="Enter spot label (e.g., B12)"
                value={spotLabel}
                onChange={(e) => setSpotLabel(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="report-type" className="text-sm font-medium">
                Issue Type
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
                required
              >
                <option value="occupied-to-available">Showing as Occupied, but Available</option>
                <option value="available-to-occupied">Showing as Available, but Occupied</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                placeholder="Add any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background min-h-[100px]"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !spotLabel.trim()}>
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Why Report?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Your reports help us maintain accurate parking availability data.</p>
          <p>All reports are reviewed and verified before updating the system.</p>
          <p>This helps other students find available spots more efficiently.</p>
        </CardContent>
      </Card>
    </div>
  )
}

