import { useAuth } from "@/contexts/AuthContext"
import { Navigate } from "react-router-dom"
import Header from "./Header"
import BottomNav from "./BottomNav"

export function MainLayout({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 sm:py-6 h-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
