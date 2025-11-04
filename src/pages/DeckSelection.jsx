import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getDecks } from "@/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, ChevronRight } from "lucide-react"

export default function DeckSelection() {
  const navigate = useNavigate()
  const { data: decks = [], isLoading } = useQuery({
    queryKey: ["decks"],
    queryFn: getDecks,
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading decks...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Select Parking Deck</h1>
        <p className="text-muted-foreground">Choose a deck to view available spots</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {decks.map((deck) => (
          <Card key={deck._id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {deck.name}
              </CardTitle>
              <CardDescription>{deck.address}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => navigate(`/decks/${deck._id}/availability`)}
              >
                View Availability
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

