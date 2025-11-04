import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const icons = { standard: '🅿️', EV: '⚡', ADA: '♿' }

export default function SpotGrid({ spots, onToggle }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {spots.map((s) => (
        <TooltipProvider key={s._id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={s.status === 'free' ? 'default' : 'secondary'}
                className={cn(
                  "h-20 flex flex-col items-center justify-center gap-1",
                  s.status === 'free' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                )}
                onClick={() => onToggle?.(s._id)}
              >
                <div className="text-sm font-semibold">{s.label}</div>
                <div className="flex items-center gap-1 text-xs">
                  <span>{icons[s.type]}</span>
                  <span>{s.status === 'free' ? 'Free' : 'Occupied'}</span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{s.label} • {s.type} • {s.status}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
