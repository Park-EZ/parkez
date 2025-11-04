import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LevelView({ levels, levelId, onPick }) {
  if (!levels?.length) return null
  
  return (
    <Tabs value={levelId} onValueChange={onPick}>
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${levels.length}, 1fr)` }}>
        {levels.map((l) => (
          <TabsTrigger key={l._id} value={l._id}>
            {l.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
