import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Car } from "lucide-react"

const icons = { standard: '🅿️', EV: '⚡', ADA: '♿' }

export default function SpotGrid({ spots, onToggle, currentUserId = null }) {
  const spotsPerColumn = Math.ceil(spots.length / 8)
  const columns = []
  
  for (let col = 0; col < 8; col++) {
    const columnSpots = []
    for (let row = 0; row < spotsPerColumn; row++) {
      const index = col * spotsPerColumn + row
      if (index < spots.length) {
        columnSpots.push(spots[index])
      }
    }
    if (columnSpots.length > 0) {
      columns.push(columnSpots)
    }
  }

  const leftColumns = columns.slice(0, Math.ceil(columns.length / 2))
  const rightColumns = columns.slice(Math.ceil(columns.length / 2))

  return (
    <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-6 rounded-lg shadow-inner overflow-x-auto">
      <div className="flex items-start justify-center gap-2 sm:gap-4 min-w-max">
        {leftColumns.map((column, colIndex) => (
          <div key={`left-${colIndex}`} className="flex flex-col gap-2">
            {column.map((s) => {
              const isOccupied = s.user_id && s.user_id !== ''
              const isOccupiedByMe = isOccupied && currentUserId && s.user_id === currentUserId
              const isOccupiedByOthers = isOccupied && !isOccupiedByMe
              
              let spotColor = 'from-green-400 to-green-600'
              let borderColor = 'border-green-500'
              let carIcon = false
              
              if (isOccupiedByMe) {
                spotColor = 'from-blue-400 to-blue-600'
                borderColor = 'border-blue-500'
                carIcon = true
              } else if (isOccupiedByOthers) {
                spotColor = 'from-red-400 to-red-600'
                borderColor = 'border-red-500'
                carIcon = true
              }
              
              const spotType = s.handicap ? 'ADA' : 'standard'
              
              return (
                <TooltipProvider key={s.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onToggle?.(s.id)}
                        className={cn(
                          "relative group transition-all duration-200 hover:scale-110",
                          !isOccupied ? 'cursor-pointer' : isOccupiedByMe ? 'cursor-pointer' : 'cursor-not-allowed'
                        )}
                      >
                        <div className={cn(
                          "w-12 h-16 sm:w-14 sm:h-20 rounded border-2 border-dashed",
                          borderColor,
                          "bg-gradient-to-br",
                          spotColor,
                          "shadow-md relative"
                        )}>
                          {/* Spot label */}
                          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 bg-white/90 px-1 rounded-sm">
                            <span className="text-[8px] sm:text-[10px] font-bold text-gray-900">{s.label}</span>
                          </div>
                          
                          {/* Car or icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {carIcon ? (
                              <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            ) : (
                              <span className="text-base sm:text-lg">{s.handicap ? '♿' : ''}</span>
                            )}
                          </div>
                          
                          {/* ADA badge */}
                          {s.handicap && (
                            <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-[8px]">♿</span>
                            </div>
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{s.label} • {spotType} • {isOccupied ? (isOccupiedByMe ? 'Your Spot' : 'Occupied') : 'Free'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        ))}
        
        {/* Vertical Driving Road */}
        <div className="w-8 sm:w-12 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg shadow-inner relative self-stretch min-h-full">
          {/* Vertical lane markings */}
          <div className="absolute inset-0 flex flex-col items-center justify-around py-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-1 h-4 sm:h-6 bg-yellow-400/70 rounded-full"></div>
            ))}
          </div>
        </div>
        
        {/* Right side parking columns */}
        {rightColumns.map((column, colIndex) => (
          <div key={`right-${colIndex}`} className="flex flex-col gap-2">
            {column.map((s) => {
              const isOccupied = s.user_id && s.user_id !== ''
              const isOccupiedByMe = isOccupied && currentUserId && s.user_id === currentUserId
              const isOccupiedByOthers = isOccupied && !isOccupiedByMe
              
              let spotColor = 'from-green-400 to-green-600'
              let borderColor = 'border-green-500'
              let carIcon = false
              
              if (isOccupiedByMe) {
                spotColor = 'from-blue-400 to-blue-600'
                borderColor = 'border-blue-500'
                carIcon = true
              } else if (isOccupiedByOthers) {
                spotColor = 'from-red-400 to-red-600'
                borderColor = 'border-red-500'
                carIcon = true
              }
              
              const spotType = s.handicap ? 'ADA' : 'standard'
              
              return (
                <TooltipProvider key={s.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onToggle?.(s.id)}
                        className={cn(
                          "relative group transition-all duration-200 hover:scale-110",
                          !isOccupied ? 'cursor-pointer' : isOccupiedByMe ? 'cursor-pointer' : 'cursor-not-allowed'
                        )}
                      >
                        <div className={cn(
                          "w-12 h-16 sm:w-14 sm:h-20 rounded border-2 border-dashed",
                          borderColor,
                          "bg-gradient-to-br",
                          spotColor,
                          "shadow-md relative"
                        )}>
                          {/* Spot label */}
                          <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 bg-white/90 px-1 rounded-sm">
                            <span className="text-[8px] sm:text-[10px] font-bold text-gray-900">{s.label}</span>
                          </div>
                          
                          {/* Car or icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {carIcon ? (
                              <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            ) : (
                              <span className="text-base sm:text-lg">{s.handicap ? '♿' : ''}</span>
                            )}
                          </div>
                          
                          {/* ADA badge */}
                          {s.handicap && (
                            <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-[8px]">♿</span>
                            </div>
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{s.label} • {spotType} • {isOccupied ? (isOccupiedByMe ? 'Your Spot' : 'Occupied') : 'Free'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-gray-300 dark:border-gray-700">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-4 sm:w-4 sm:h-5 bg-gradient-to-br from-green-400 to-green-600 rounded border border-green-500"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Available</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-4 sm:w-4 sm:h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded border border-blue-500"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Your Spot</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-4 sm:w-4 sm:h-5 bg-gradient-to-br from-red-400 to-red-600 rounded border border-red-500"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Occupied</span>
          </div>
        </div>
      </div>
    </div>
  )
}
