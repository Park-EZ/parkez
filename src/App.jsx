import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext"
import { MainLayout } from "@/components/layout/MainLayout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import DeckSelection from "./pages/DeckSelection"
import LevelsView from "./pages/LevelsView"
import SpotAvailability from "./pages/SpotAvailability"
import DeckRedirect from "./pages/DeckRedirect"
import QRScanner from "./pages/QRScanner"
import ReportStatus from "./pages/ReportStatus"
import Profile from "./pages/Profile"
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <UserPreferencesProvider>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <MainLayout>
                    <Navigate to="/dashboard" replace />
                  </MainLayout>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                }
              />
              <Route
                path="/decks"
                element={
                  <MainLayout>
                    <DeckSelection />
                  </MainLayout>
                }
              />
              <Route
                path="/decks/:deckId/levels"
                element={
                  <MainLayout>
                    <LevelsView />
                  </MainLayout>
                }
              />
              <Route
                path="/decks/:deckId/levels/:levelId/spots"
                element={
                  <MainLayout>
                    <SpotAvailability />
                  </MainLayout>
                }
              />
              {/* Legacy route redirect */}
              <Route
                path="/decks/:deckId/availability"
                element={
                  <MainLayout>
                    <DeckRedirect />
                  </MainLayout>
                }
              />
              <Route
                path="/qr-scanner"
                element={
                  <MainLayout>
                    <QRScanner />
                  </MainLayout>
                }
              />
              <Route
                path="/report"
                element={
                  <MainLayout>
                    <ReportStatus />
                  </MainLayout>
                }
              />
              <Route
                path="/profile"
                element={
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </UserPreferencesProvider>
          </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
)

export default App
