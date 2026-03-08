export default function LoadingCard({ text = 'Loading...' }) {
  return <div className="card animate-pulse p-4 text-sm text-slate-300">{text}</div>
}
