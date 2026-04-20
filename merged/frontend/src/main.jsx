import { StrictMode, Suspense, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppPreloader from './components/preloaders/AppPreloader'

const AppWrapper = () => {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsLoaded(true), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  if (!isLoaded) {
    return <AppPreloader progress={Math.min(100, Math.floor(progress))} />;
  }

  return (
    <Suspense fallback={<AppPreloader progress={100} />}>
      <App />
    </Suspense>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
)