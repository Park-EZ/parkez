export default function Header({ title, subtitle }) {
  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
    </header>
  )
}
