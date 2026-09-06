import { useState } from 'react';
import Home from './views/Home.jsx';
import LearningMode from './views/LearningMode.jsx';
import RealMode from './views/RealMode.jsx';
import Results from './views/Results.jsx';

export default function App() {
  // route: {name:'home'} | {name:'learning',examId} | {name:'real',examId} | {name:'results',attempt}
  const [route, setRoute] = useState({ name: 'home' });

  const goHome = () => setRoute({ name: 'home' });

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={goHome}>
          <span className="brand-mark">CCAR</span> Study Guide
        </button>
        <span className="topbar-sub">Claude Certified Architect — Foundations & Professional</span>
      </header>
      <main>
        {route.name === 'home' && (
          <Home
            onStart={(examId, mode) =>
              setRoute({ name: mode === 'learning' ? 'learning' : 'real', examId })
            }
          />
        )}
        {route.name === 'learning' && <LearningMode examId={route.examId} onExit={goHome} />}
        {route.name === 'real' && (
          <RealMode
            examId={route.examId}
            onExit={goHome}
            onFinished={(attempt) => setRoute({ name: 'results', attempt })}
          />
        )}
        {route.name === 'results' && <Results attempt={route.attempt} onExit={goHome} />}
      </main>
    </div>
  );
}
