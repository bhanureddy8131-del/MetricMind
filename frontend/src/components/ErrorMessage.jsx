import { AlertCircle } from 'lucide-react'

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null
  return <div className="error-box"><AlertCircle size={17} /><span>{message}</span>{onRetry && <button className="text-button" onClick={onRetry}>Retry</button>}</div>
}
