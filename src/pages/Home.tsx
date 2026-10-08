import { useTodayId } from '../components/LexiconDesk'
import { RootWorkbench } from './RootDetail'

export function HomePage() {
  const todayId = useTodayId()
  if (!todayId) return <p className="empty-pane">词库还没打开。</p>
  return <RootWorkbench id={todayId} />
}
