import type { PropsWithChildren, ReactElement } from 'react';
import { useEffect } from 'react';
import { useLearningStore } from '@/store/learning';
import './app.scss';

function App(props: PropsWithChildren): ReactElement {
  useEffect(() => {
    void useLearningStore.getState().hydrateToday();
  }, []);

  return <>{props.children}</>;
}

export default App;
