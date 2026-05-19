import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import PaperAnalyzer from './pages/PaperAnalyzer'
import Translator from './pages/Translator'
import ArchTrainer from './pages/ArchTrainer'
import Todo from './pages/Todo'
import Login from './pages/Login'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/login': 'Login',
  '/paper': 'Paper Analyzer',
  '/translate': 'Translator',
  '/arch-trainer': 'Arch Trainer',
  '/todo': 'Todo',
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    const base = '/' + location.pathname.split('/')[1]
    const title = PAGE_TITLES[base] ?? 'Lab Toolkit'
    document.title = title
  }, [location.pathname])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/paper" element={<PaperAnalyzer />} />
      <Route path="/translate" element={<Translator />} />
      <Route path="/arch-trainer" element={<ArchTrainer />} />
      <Route path="/todo/*" element={<Todo />} />
    </Routes>
  )
}
