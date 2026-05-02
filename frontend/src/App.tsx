import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import PaperAnalyzer from './pages/PaperAnalyzer'
import Translator from './pages/Translator'
import ArchTrainer from './pages/ArchTrainer'
import Todo from './pages/Todo'
import Login from './pages/Login'
import { ThemeToggle } from './components/ThemeToggle'

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isLogin = location.pathname === '/login'

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/paper" element={<PaperAnalyzer />} />
        <Route path="/translate" element={<Translator />} />
        <Route path="/arch-trainer" element={<ArchTrainer />} />
        <Route path="/todo/*" element={<Todo />} />
      </Routes>
      {!isHome && !isLogin && <ThemeToggle />}
    </>
  )
}
