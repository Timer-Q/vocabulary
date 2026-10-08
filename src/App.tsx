import { BrowserRouter, Route, Routes, useLocation, type Location } from 'react-router-dom'
import { AwaitingSelection, LexiconDesk } from './components/LexiconDesk'
import { Shell } from './components/Shell'
import { isWordSheet } from './lib/nav'
import { HomePage } from './pages/Home'
import { ProgressPage } from './pages/Progress'
import { RootDetailPage } from './pages/RootDetail'
import { SectionPage } from './pages/Section'
import { StudyPage } from './pages/Study'
import { WordGraphPage, WordSheet } from './pages/Word'

function basename(): string | undefined {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return base || undefined
}

function sheetBackground(location: Location): Location | undefined {
  if (!isWordSheet(location.pathname)) return undefined
  const background = (location.state as { background?: Location } | null)?.background
  return background?.pathname ? background : undefined
}

function AppRoutes() {
  const location = useLocation()
  const background = sheetBackground(location)
  return (
    <>
      <Routes location={background || location}>
        <Route element={<Shell />}>
          <Route element={<LexiconDesk />}>
            <Route index element={<HomePage />} />
            <Route path="roots" element={<AwaitingSelection />} />
            <Route path="roots/:kind/:slug" element={<RootDetailPage />} />
            <Route path="roots/:kind/:slug/graph" element={<RootDetailPage />} />
            <Route path="sections/:id" element={<SectionPage />} />
            <Route path="sections/:id/graph" element={<SectionPage />} />
            <Route path="words/:spelling" element={<WordSheet />} />
            <Route path="words/:spelling/graph" element={<WordGraphPage />} />
            <Route path="study" element={<StudyPage />} />
            <Route path="me" element={<ProgressPage />} />
            <Route path="*" element={<p className="empty-pane">没有这一页。</p>} />
          </Route>
        </Route>
      </Routes>
      {background ? (
        <Routes>
          <Route path="/words/:spelling" element={<WordSheet overlay />} />
        </Routes>
      ) : null}
    </>
  )
}

export function App() {
  return (
    <BrowserRouter basename={basename()}>
      <AppRoutes />
    </BrowserRouter>
  )
}
