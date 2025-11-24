import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import ThemeSelector from "@/components/ThemeSelector"

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="flex-shrink-0 border-b bg-card z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl sm:text-2xl font-bold text-primary">
          EZpark
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span>{user?.name || user?.email}</span>
          </div>
          <ThemeSelector />
        </div>
      </div>
    </header>
  )
}
