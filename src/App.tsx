import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { HomePage } from './pages/Home'
import { ProgressPage } from './pages/Progress'
import { RootDetailPage } from './pages/RootDetail'
import { RootsPage } from './pages/Roots'
import { SectionPage } from './pages/Section'
import { StudyPage } from './pages/Study'
import { WordPage } from './pages/Word'

function basename(): string | undefined {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return base || undefined
}

export function App() {
  return (
    <BrowserRouter basename={basename()}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="roots" element={<RootsPage />} />
          <Route path="roots/:kind/:slug" element={<RootDetailPage />} />
          <Route path="roots/:kind/:slug/graph" element={<RootDetailPage graph />} />
          <Route path="sections/:id" element={<SectionPage />} />
          <Route path="sections/:id/graph" element={<SectionPage graph />} />
          <Route path="words/:spelling" element={<WordPage />} />
          <Route path="words/:spelling/graph" element={<WordPage graph />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="me" element={<ProgressPage />} />
          <Route path="*" element={<p className="empty">没有这一页。</p>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
