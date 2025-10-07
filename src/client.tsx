import './styles.css'
import { createRoot } from 'react-dom/client'
import App from './app'

const root = createRoot(document.getElementById('app')!)

root.render(
  <div className="text-base text-white antialiased transition-colors selection:bg-blue-700 selection:text-white">
    <App />
  </div>
)
