import { useEffect, useMemo, useState } from 'react'
import { searchPlaces } from '../services/geocoding'

const RECENTS_KEY = 'efikishe_recent_places_v1'

const loadRecents = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]')
  } catch {
    return []
  }
}

const saveRecent = (place) => {
  const list = loadRecents()
  const idx = list.findIndex((p) => p.text === place.text)
  if (idx >= 0) list[idx].count += 1
  else list.push({ ...place, count: 1 })
  const next = list.sort((a, b) => b.count - a.count).slice(0, 12)
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
}

let timer

export default function PlaceInput({ label, value, onTextChange, onPlaceSelect, disabled }) {
  const [mapResults, setMapResults] = useState([])
  const [open, setOpen] = useState(false)

  const localSuggestions = useMemo(() => {
    const q = (value || '').toLowerCase().trim()
    if (!q) return loadRecents().slice(0, 4)
    return loadRecents().filter((p) => p.text.toLowerCase().includes(q)).slice(0, 4)
  }, [value])

  useEffect(() => {
    if (disabled || !value || value.length < 2) {
      setMapResults([])
      return
    }

    clearTimeout(timer)
    timer = setTimeout(async () => {
      try {
        const rows = await searchPlaces(value)
        setMapResults(
          rows.map((r) => ({
            id: r.id,
            place_name: r.place_name,
            center: [r.lng, r.lat],
            _raw: r
          }))
        )
        setOpen(true)
      } catch {
        setMapResults([])
      }
    }, 180)

    return () => clearTimeout(timer)
  }, [value, disabled])

  const suggestions = [
    ...localSuggestions.map((r) => ({ id: `local-${r.text}`, place_name: `${r.text} (recent)`, center: [r.lng, r.lat], _raw: r })),
    ...mapResults
  ].slice(0, 8)

  return (
    <div className="relative">
      <label className="mb-1 block text-xs text-slate-300">{label}</label>
      <input
        className="input"
        value={value}
        onChange={(e) => {
          onTextChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={`Search ${label.toLowerCase()}`}
        required
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-line bg-[#0a261e] shadow-soft">
          {suggestions.map((r) => (
            <button
              key={r.id}
              type="button"
              className="block w-full border-b border-line/30 px-3 py-2 text-left text-sm hover:bg-[#12382c]"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const text = r._raw?.text || r.place_name.replace(' (recent)', '')
                const lat = r._raw?.lat ?? r.center?.[1]
                const lng = r._raw?.lng ?? r.center?.[0]
                const picked = { text, placeId: r.id, lat, lng }
                saveRecent(picked)
                onPlaceSelect(picked)
                setOpen(false)
              }}
            >
              {r.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
