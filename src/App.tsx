import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainScreen from './pages/MainScreen';

const HistoryScreen = lazy(() => import('./pages/HistoryScreen'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route
          path="/history"
          element={
            <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
              <HistoryScreen />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
