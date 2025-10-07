import { useEffect, useMemo, useState } from "react";
import { getDecks, getLevelsByDeck, getSpotsByLevel, toggleSpotOccupancy, applySpotSession, subscribe, unsubscribe, seedIfEmpty } from "./api";
import Header from "./components/Header.jsx";
import DeckList from "./components/DeckList.jsx";
import LevelView from "./components/LevelView.jsx";
import SpotGrid from "./components/SpotGrid.jsx";

export default function App() {
  const [deckId, setDeckId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => { seedIfEmpty() }, []);
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    subscribe(handler);
    return () => unsubscribe(handler);
  }, []);

  const decks = useMemo(() => getDecks(), [tick]);
  useEffect(() => { if (!deckId && decks.length) setDeckId(decks[0]._id) }, [decks, deckId]);

  const levels = useMemo(() => deckId ? getLevelsByDeck(deckId) : [], [deckId, tick]);
  useEffect(() => {
    if (levels.length && !levels.find(l => l._id === levelId)) setLevelId(levels[0]._id);
  }, [levels, levelId]);

  const spots = useMemo(() => levelId ? getSpotsByLevel(levelId) : [], [levelId, tick]);

  const filtered = useMemo(() =>
    spots.filter(s => (filterType === 'all' || s.type === filterType) &&
      s.label.toLowerCase().includes(search.toLowerCase())),
    [spots, filterType, search]
  );

  const deckSummary = useMemo(() => {
    const byLevel = levels.map(l => {
      const vs = getSpotsByLevel(l._id);
      const free = vs.filter(v => v.status === 'free').length;
      return { level: l, total: vs.length, free };
    });
    const free = byLevel.reduce((a, b) => a + b.free, 0);
    const total = byLevel.reduce((a, b) => a + b.total, 0);
    return { byLevel, free, total };
  }, [levels, tick]);

  const handleQrSubmit = (e) => {
    e.preventDefault();
    const label = qrInput.trim().toUpperCase();
    if (!label) return;
    const allLevels = getLevelsByDeck(deckId);
    for (const lv of allLevels) {
      const vs = getSpotsByLevel(lv._id);
      const found = vs.find(s => s.label.toUpperCase() === label);
      if (found) {
        applySpotSession(found._id);
        setQrInput('');
        if (levelId !== lv._id) setLevelId(lv._id);
        return;
      }
    }
    alert(`Spot "${label}" not found in this deck.`);
  };

  return (
    <div className="page">
      <Header title="Campus Parking" subtitle="Scrum & Coke — demo" />
      <div className="toolbar">
        <div className="row">
          <label>
            Deck:
            <select value={deckId} onChange={e => setDeckId(e.target.value)}>
              {decks.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </label>
          <label>
            Level:
            <select value={levelId} onChange={e => setLevelId(e.target.value)}>
              {levels.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </label>
          <label>
            Filter:
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="standard">Standard</option>
              <option value="EV">EV</option>
              <option value="ADA">ADA</option>
            </select>
          </label>
          <input
            placeholder="Search spot label (e.g., B12)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <form className="qr" onSubmit={handleQrSubmit}>
          <input
            placeholder="Scan QR → type spot label (e.g., B12)"
            value={qrInput}
            onChange={e => setQrInput(e.target.value)}
          />
          <button type="submit">Check-in / out</button>
        </form>
      </div>

      <DeckList summary={deckSummary} onJumpLevel={setLevelId} />
      <LevelView levels={levels} levelId={levelId} onPick={setLevelId} />
      <SpotGrid spots={filtered} onToggle={(id) => { toggleSpotOccupancy(id); setTick(t => t + 1); }} />

      <footer className="footer">
        <small>Mock data, localStorage, realtime-sim. Ready to swap with real API later.</small>
      </footer>
    </div>
  );
}
