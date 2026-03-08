import { Link } from 'react-router-dom'

const pages = {
  promotions: {
    title: 'Promotions',
    intro: 'Automatic savings for loyal and high-frequency delivery customers.',
    points: [
      'First request: 15% off up to KES 300.',
      '5+ deliveries in 7 days: 8% loyalty discount auto-applied.',
      'Business accounts: volume pricing from 50 monthly deliveries.',
      'Referral bonus: KES 200 credit after the first successful referral delivery.'
    ],
    footer: 'Offer terms are enforced at checkout and visible before you confirm a request.'
  },
  support: {
    title: 'Support',
    intro: 'Fast human support for urgent deliveries, payment issues, and account help.',
    points: [
      'Call: +254 700 111 222',
      'WhatsApp: +254 700 111 222',
      'Email: support@efikishe.com',
      'Hours: 06:00 - 22:00 EAT, 7 days a week'
    ],
    footer: 'For active deliveries, include your tracking code for priority handling.'
  },
  about: {
    title: 'About Efikishe',
    intro: 'Efikishe is a Nairobi-built electric logistics company focused on speed, reliability, and cleaner cities.',
    points: [
      '100% electric-first dispatch model for urban delivery.',
      'Coverage across Nairobi CBD, Westlands, Kilimani, Parklands, and surrounding areas.',
      'Rider-first operations with safety, fair dispatch, and route intelligence.',
      'Mission: make everyday delivery cleaner, faster, and dependable for homes and businesses.'
    ],
    footer: 'Head Office: Nairobi, Kenya | Partnerships: partners@efikishe.com'
  },
  payments: {
    title: 'Payments',
    intro: 'Flexible payment methods for individual and business customers.',
    points: [
      'M-Pesa STK Push (default).',
      'Visa and Mastercard (secure checkout).',
      'Business account invoicing for approved monthly clients.',
      'Instant receipt issued after successful payment.'
    ],
    footer: 'Payment support: payments@efikishe.com | Disputes resolved within 24 hours.'
  }
}

export default function UtilityPage({ type = 'support' }) {
  const p = pages[type] || pages.support
  return (
    <section className="mx-auto max-w-2xl card p-6">
      <h1 className="text-2xl font-extrabold">{p.title}</h1>
      <p className="mt-2 text-sm text-slate-300">{p.intro}</p>
      <div className="mt-4 rounded-xl border border-line bg-[#0a291f] p-4">
        <ul className="space-y-2 text-sm text-slate-200">
          {p.points.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
      <p className="mt-4 text-xs text-slate-400">{p.footer}</p>
      <Link to="/" className="btn-primary mt-6">Back Home</Link>
    </section>
  )
}
