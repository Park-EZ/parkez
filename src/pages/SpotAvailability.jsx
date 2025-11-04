import { useState, useMemo, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getLevelsByDeck, getSpotsByLevel, getDecks, toggleSpotOccupancy } from "@/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import SpotGrid from "@/components/SpotGrid"
import { Search } from "lucide-react"

export default function SpotAvailability() {
  const { deckId } = useParams()
  const queryClient = useQueryClient()
  const [selectedLevelId, setSelectedLevelId] = useState(null)
  const [filterType, setFilterType] = useState("all")
  const [search, setSearch] = useState("")

  const { data: deck } = useQuery({
    queryKey: ["deck", deckId],
    queryFn: async () => {
      const decks = await getDecks()
      return decks.find((d) => d._id === deckId)
    },
    enabled: !!deckId,
  })

  const { data: levels = [] } = useQuery({
    queryKey: ["levels", deckId],
    queryFn: () => getLevelsByDeck(deckId),
    enabled: !!deckId,
  })

  useEffect(() => {
    if (levels.length && !selectedLevelId) {
      setSelectedLevelId(levels[0]._id)
    }
  }, [levels, selectedLevelId])

  const { data: spots = [] } = useQuery({
    queryKey: ["spots", selectedLevelId],
    queryFn: () => getSpotsByLevel(selectedLevelId),
    enabled: !!selectedLevelId,
  })

  const filteredSpots = useMemo(() => {
    return spots.filter(
      (s) =>
        s.levelId === selectedLevelId &&
        (filterType === "all" || s.type === filterType) &&
        s.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [spots, selectedLevelId, filterType, search])

  const { data: allSpots = [] } = useQuery({
    queryKey: ["allSpots", deckId],
    queryFn: async () => {
      const allLevels = await getLevelsByDeck(deckId)
      const spotsPromises = allLevels.map(level => getSpotsByLevel(level._id))
      const allSpotsArrays = await Promise.all(spotsPromises)
      return allSpotsArrays.flat()
    },
    enabled: !!deckId,
  })

  const deckSummary = useMemo(() => {
    const byLevel = levels.map((l) => {
      const levelSpots = allSpots.filter((s) => s.levelId === l._id)
      const free = levelSpots.filter((v) => v.status === "free").length
      return { level: l, total: levelSpots.length, free }
    })
    const free = byLevel.reduce((a, b) => a + b.free, 0)
    const total = byLevel.reduce((a, b) => a + b.total, 0)
    return { byLevel, free, total }
  }, [levels, allSpots])

  if (!deck) {
    return <div className="text-center py-8">Deck not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{deck.name}</h1>
        <p className="text-muted-foreground">{deck.address}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deck Summary</CardTitle>
          <CardDescription>
            Total Free: {deckSummary.free} / Total Spots: {deckSummary.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {deckSummary.byLevel.map(({ level, free, total }) => (
              <Button
                key={level._id}
                variant={selectedLevelId === level._id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevelId(level._id)}
              >
                {level.name}: {free}/{total} free
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spot label (e.g., B12)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-background"
        >
          <option value="all">All Types</option>
          <option value="standard">Standard</option>
          <option value="EV">EV</option>
          <option value="ADA">ADA</option>
        </select>
      </div>

      {selectedLevelId && (
        <Tabs value={selectedLevelId} onValueChange={setSelectedLevelId}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${levels.length}, 1fr)` }}>
            {levels.map((level) => (
              <TabsTrigger key={level._id} value={level._id}>
                {level.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {levels.map((level) => (
            <TabsContent key={level._id} value={level._id}>
              <SpotGrid
                spots={level._id === selectedLevelId ? filteredSpots : []}
                onToggle={async (spotId) => {
                  await toggleSpotOccupancy(spotId)
                  // Refetch spots to update the UI
                  queryClient.invalidateQueries({ queryKey: ["spots", selectedLevelId] })
                  queryClient.invalidateQueries({ queryKey: ["allSpots", deckId] })
                }}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

