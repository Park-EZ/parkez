export default function DeckList({ summary, onJumpLevel }) {
  if (!summary) return null
  return (
    <section className="deck-summary">
      <div className="summary-card">
        <div className="summary-row">
          <strong>Total Free:</strong> <span>{summary.free}</span>
          <strong> / Total Spots:</strong> <span>{summary.total}</span>
        </div>
        <div className="levels">
          {summary.byLevel.map(({ level, free, total }) => (
            <button key={level._id} className="level-chip" onClick={() => onJumpLevel(level._id)}>
              <span>{level.name}</span>
              <span className="badge">{free}/{total} free</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
