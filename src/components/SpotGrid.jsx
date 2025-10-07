const icons = { standard: '🅿️', EV: '⚡', ADA: '♿' }

export default function SpotGrid({ spots, onToggle }) {
  return (
    <section className="grid-wrap">
      <div className="grid">
        {spots.map(s => (
          <button
            key={s._id}
            className={`spot ${s.status} ${s.type}`}
            title={`${s.label} • ${s.type} • ${s.status}`}
            onClick={() => onToggle(s._id)}
          >
            <div className="label">{s.label}</div>
            <div className="meta">
              <span>{icons[s.type]}</span>
              <span>{s.status === 'free' ? 'Free' : 'Occupied'}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
