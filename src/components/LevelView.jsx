export default function LevelView({ levels, levelId, onPick }) {
  if (!levels?.length) return null
  return (
    <nav className="level-tabs">
      {levels.map(l => (
        <button
          key={l._id}
          className={l._id === levelId ? 'tab active' : 'tab'}
          onClick={() => onPick(l._id)}
        >
          {l.name}
        </button>
      ))}
    </nav>
  )
}
