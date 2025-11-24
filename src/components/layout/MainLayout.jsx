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
    <div style={{ height: '100vh', height: '100dvh' }} className="flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed height */}
      <Header />
      
      {/* Main Content - Fills remaining space between header and bottom nav */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="container mx-auto px-4 py-3 sm:py-4 h-full">
          {children}
        </div>
      </main>
      
      {/* Bottom Navigation - Part of flex layout, will always be visible */}
      <BottomNav />
    </div>
  )
}
