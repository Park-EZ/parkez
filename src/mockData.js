const deckA = { _id: 'deckA', name: 'North Deck', address: '100 University Way', geo: [0,0] }
const deckB = { _id: 'deckB', name: 'South Deck', address: '900 Research Dr', geo: [0,0] }
export const initialDecks = [deckA, deckB]

const levelsA = [0,1,2].map(i => ({ _id: `A_L${i}`, deckId: deckA._id, index: i, name: `A • Level ${i+1}` }))
const levelsB = [0,1,2].map(i => ({ _id: `B_L${i}`, deckId: deckB._id, index: i, name: `B • Level ${i+1}` }))
export const initialLevels = [...levelsA, ...levelsB]

function makeSpots(prefix, levelId) {
  const out = []
  for (let i=1; i<=24; i++) {
    const label = `${prefix}${String(i).padStart(2,'0')}`
    let type = 'standard'
    if (i % 12 === 0) type = 'ADA'
    else if (i % 8 === 0) type = 'EV'
    out.push({_id: `${levelId}_${label}`, levelId, label, type, status: Math.random() < 0.25 ? 'occupied' : 'free'})
  }
  return out
}
export const initialSpots = [
  ...makeSpots('A', 'A_L0'), ...makeSpots('B', 'A_L0'),
  ...makeSpots('A', 'A_L1'), ...makeSpots('B', 'A_L1'),
  ...makeSpots('A', 'A_L2'), ...makeSpots('B', 'A_L2'),
  ...makeSpots('A', 'B_L0'), ...makeSpots('B', 'B_L0'),
  ...makeSpots('A', 'B_L1'), ...makeSpots('B', 'B_L1'),
  ...makeSpots('A', 'B_L2'), ...makeSpots('B', 'B_L2'),
]
