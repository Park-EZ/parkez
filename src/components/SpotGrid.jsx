import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const icons = { standard: '🅿️', EV: '⚡', ADA: '♿' }

export default function SpotGrid({ spots, onToggle, currentUserId = null }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {spots.map((s) => {
        // Check if this spot is occupied by the current user
        // A spot is occupied if user_id has a value (not null or empty string)
        const isOccupied = s.user_id && s.user_id !== ''
        const isOccupiedByMe = isOccupied && currentUserId && s.user_id === currentUserId
        const isOccupiedByOthers = isOccupied && !isOccupiedByMe
        
        let spotColor = 'bg-green-500 hover:bg-green-600' // Free
        let spotStatusText = 'Free'
        
        if (isOccupiedByMe) {
          spotColor = 'bg-blue-500 hover:bg-blue-600' // User's own spot
          spotStatusText = 'Your Spot'
        } else if (isOccupiedByOthers) {
          spotColor = 'bg-red-500 hover:bg-red-600' // Other users' spots
          spotStatusText = 'Occupied'
        }
        
        // Determine spot type icon - use handicap field from raw JSON
        const spotType = s.handicap ? 'ADA' : 'standard'
        const spotTypeIcon = icons[spotType] || icons.standard
        
        return (
          <TooltipProvider key={s.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={!isOccupied ? 'default' : 'secondary'}
                  className={cn(
                    "h-20 flex flex-col items-center justify-center gap-1",
                    spotColor
                  )}
                  onClick={() => onToggle?.(s.id)}
                >
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="flex items-center gap-1 text-xs">
                    <span>{spotTypeIcon}</span>
                    <span>{spotStatusText}</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{s.label} • {spotType} • {spotStatusText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}
