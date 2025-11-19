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
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
