import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const colorOptions = {
  blue: { name: "Blue", class: "bg-blue-500" },
  green: { name: "Green", class: "bg-green-500" },
  purple: { name: "Purple", class: "bg-purple-500" },
  orange: { name: "Orange", class: "bg-orange-500" },
}

export default function ThemeSelector() {
  const { mode, color, toggleMode, setThemeColor, availableColors } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {mode === "dark" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={toggleMode} className="cursor-pointer">
          {mode === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              Switch to Light
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Switch to Dark
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color Scheme</DropdownMenuLabel>
        
        {availableColors.map((colorKey) => (
          <DropdownMenuItem
            key={colorKey}
            onClick={() => setThemeColor(colorKey)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-full ${colorOptions[colorKey]?.class || "bg-gray-500"}`}
              />
              <span>{colorOptions[colorKey]?.name || colorKey}</span>
              {color === colorKey && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

