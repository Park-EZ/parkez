import { Navigate, useParams } from "react-router-dom"

export default function DeckRedirect() {
  const { deckId } = useParams()
  return <Navigate to={`/decks/${deckId}/levels`} replace />
}

