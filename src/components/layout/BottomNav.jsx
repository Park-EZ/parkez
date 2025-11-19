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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-lg">
      <div className="container mx-auto">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path === "/dashboard" && location.pathname === "/")
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5",
                  isActive && "text-primary"
                )} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

