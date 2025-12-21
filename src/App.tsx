import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Dashboard from './pages/Dashboard'
import CharacterEditor from './pages/CharacterEditor'

// Simplified version - works without authentication
// Uses localStorage only for now

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/character/:id?" element={<CharacterEditor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App
