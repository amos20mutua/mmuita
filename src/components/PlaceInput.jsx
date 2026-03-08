import { useEffect, useRef } from 'react'

export default function PlaceInput({ label, value, onTextChange, onPlaceSelect, disabled }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!window.google?.maps?.places || !ref.current || disabled) return
    const autocomplete = new window.google.maps.places.Autocomplete(ref.current, {
      fields: ['formatted_address', 'place_id', 'geometry', 'name'],
      componentRestrictions: { country: 'ke' }
    })
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place?.geometry?.location) return
      onPlaceSelect({
        text: place.formatted_address || place.name || '',
        placeId: place.place_id,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      })
    })
    return () => window.google?.maps?.event?.clearInstanceListeners(autocomplete)
  }, [disabled, onPlaceSelect])

  return (
    <div>
      <label className="mb-1 block text-xs text-slate-300">{label}</label>
      <input
        ref={ref}
        className="input"
        value={value}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Search ${label.toLowerCase()}`}
        disabled={disabled}
        required
      />
    </div>
  )
}
