const variantBySlug = {
  parcel: 'parcel',
  food: 'food',
  express: 'express',
  scheduled: 'scheduled',
  bulk: 'bulk'
}

export default function ServiceVisual({ slug }) {
  const variant = variantBySlug[slug] || 'parcel'

  return (
    <div className={`service-visual ${variant}`} aria-hidden>
      <svg viewBox="0 0 180 90" className="service-visual-svg">
        <g className="bike-shift">
          <path className="road" d="M12 77 H168" />
          <path className="road-dash one" d="M136 77 h16" />
          <path className="road-dash two" d="M158 77 h10" />

          <circle className="tire" cx="46" cy="67" r="14" />
          <circle className="tire" cx="130" cy="67" r="14" />
          <circle className="rim wheel-spin rear" cx="46" cy="67" r="8.5" />
          <circle className="rim wheel-spin front" cx="130" cy="67" r="8.5" />

          <path className="swingarm" d="M46 67 L74 56 L97 56 L117 67" />
          <path className="fork" d="M112 47 L130 67" />
          <path className="tank" d="M72 44 h20 l8 8 h-28 z" />
          <rect className="seat" x="63" y="40" width="18" height="7" rx="3.5" />
          <path className="handlebar" d="M107 42 h12" />
          <circle className="headlight" cx="122" cy="44" r="3.5" />
          <rect className="engine" x="79" y="54" width="15" height="8" rx="2.5" />
          <path className="exhaust" d="M94 61 h14" />

          <rect className="rack" x="23" y="49" width="11" height="3" rx="1.5" />
          <rect className="topbox" x="16" y="35" width="22" height="15" rx="3" />
          <rect className="foodbag" x="16" y="36" width="22" height="14" rx="4" />
          <path className="food-steam one" d="M22 31 C19 27, 26 25, 22 21" />
          <path className="food-steam two" d="M29 30 C26 26, 33 24, 29 20" />
          <rect className="bulkbox" x="14" y="33" width="25" height="17" rx="2" />

          <circle className="rider-head" cx="92" cy="30" r="5.5" />
          <path className="rider-body" d="M87 36 L98 41 L101 50 L94 52 L91 44 L84 40 Z" />

          <path className="speed-line one" d="M140 30 H166" />
          <path className="speed-line two" d="M132 37 H162" />
        </g>
      </svg>
    </div>
  )
}
