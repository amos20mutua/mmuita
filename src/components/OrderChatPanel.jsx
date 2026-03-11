import { useMemo, useState } from 'react'

const who = (m, me) => (m.sender_id === me ? 'me' : m.sender_role)

export default function OrderChatPanel({ order, user, messages = [], onSend, disabled }) {
  const [text, setText] = useState('')

  const canSend = useMemo(() => !!user?.id && !disabled && text.trim().length > 0, [user?.id, disabled, text])

  const submit = async (e) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean) return
    const ok = await onSend(clean)
    if (ok) setText('')
  }

  const riderPhone = order?.riders?.phone || order?.recipient_phone
  const customerPhone = order?.sender_phone

  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold">In-App Chat</h3>
        <div className="flex gap-2">
          {customerPhone && <a className="btn-ghost px-3 py-1.5 text-xs" href={`tel:${customerPhone}`}>Call Customer</a>}
          {riderPhone && <a className="btn-ghost px-3 py-1.5 text-xs" href={`tel:${riderPhone}`}>Call Rider</a>}
        </div>
      </div>

      <div className="mb-3 max-h-56 space-y-2 overflow-auto rounded-xl border border-line bg-[#0b271f] p-2">
        {!messages.length && <p className="text-xs text-slate-400">Start the conversation to coordinate delivery quickly.</p>}
        {messages.map((m) => {
          const mine = who(m, user?.id) === 'me'
          return (
            <div key={m.id} className={`max-w-[86%] rounded-lg px-3 py-2 text-sm ${mine ? 'ml-auto bg-brand/20' : 'bg-[#143b2e]'}`}>
              <p className="text-[11px] text-slate-300">{mine ? 'You' : m.sender_role}</p>
              <p>{m.message_text}</p>
            </div>
          )
        })}
      </div>

      <form className="flex gap-2" onSubmit={submit}>
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? 'Sign in to message the delivery team' : 'Type message...'}
          disabled={disabled}
        />
        <button className="btn-primary px-4" type="submit" disabled={!canSend}>Send</button>
      </form>
    </section>
  )
}

