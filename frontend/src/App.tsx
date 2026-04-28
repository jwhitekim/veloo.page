import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PaperAnalyzer from './pages/PaperAnalyzer'
import Translator from './pages/Translator'
import ArchTrainer from './pages/ArchTrainer'
import Todo from './pages/Todo'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/paper" element={<PaperAnalyzer />} />
      <Route path="/translate" element={<Translator />} />
      <Route path="/arch-trainer" element={<ArchTrainer />} />
      <Route path="/todo/*" element={<Todo />} />
    </Routes>
  )
}
