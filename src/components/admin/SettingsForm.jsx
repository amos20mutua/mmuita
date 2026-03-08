import { useState } from 'react'

export default function SettingsForm({ initial = {}, title, onSave }) {
  const [value, setValue] = useState(JSON.stringify(initial, null, 2))

  return (
    <div className="card p-4">
      <h3 className="font-bold">{title}</h3>
      <textarea className="input mt-3 min-h-52 font-mono text-xs" value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="btn-primary mt-3" onClick={() => onSave(value)}>Save</button>
    </div>
  )
}
