import { Link, useLocation } from "react-router-dom"
import { Home, MapPin, QrCode, AlertCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNav() {
  const location = useLocation()

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/decks", icon: MapPin, label: "Decks" },
    { path: "/qr-scanner", icon: QrCode, label: "Scan" },
    { path: "/report", icon: AlertCircle, label: "Report" },
    { path: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <nav className="flex-shrink-0 border-t bg-card shadow-lg">
      <div className="container mx-auto safe-bottom">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path === "/dashboard" && location.pathname === "/")
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[54px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive && "text-primary"
                )} />
                <span className="text-[10px] sm:text-xs font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

