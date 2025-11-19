import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, QrCode, AlertCircle, BarChart3 } from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Find and manage your parking spots</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/decks")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Parking Deck
            </CardTitle>
            <CardDescription>Choose a deck to view availability</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">View Decks</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/qr-scanner")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>Check in or out of a parking spot</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Scan QR Code</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/report")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Report Issue
            </CardTitle>
            <CardDescription>Report incorrect spot status</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Report</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

