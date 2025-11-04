import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DeckList({ summary, onJumpLevel }) {
  if (!summary) return null
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deck Summary</CardTitle>
        <CardDescription>
          Total Free: {summary.free} / Total Spots: {summary.total}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {summary.byLevel.map(({ level, free, total }) => (
            <Button
              key={level._id}
              variant="outline"
              size="sm"
              onClick={() => onJumpLevel?.(level._id)}
            >
              {level.name}: {free}/{total} free
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
