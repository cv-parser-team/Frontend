import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandMark from '../components/brand/BrandMark.jsx';
import '../css/splash.css';

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigate('/login', { replace: true });
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <main className="splash-screen" aria-label="LuminaCV splash screen">
      <div className="splash-background" aria-hidden="true">
        <span className="glow glow-primary" />
        <span className="glow glow-secondary" />
        <span className="glow glow-tertiary" />
      </div>

      <section className="splash-content" aria-label="Welcome to LuminaCV">
        <div className="brand-lockup">
          <BrandMark />
          <h1 className="brand-name">
            Lumina<span>CV</span>
          </h1>
        </div>
        <p className="brand-tagline">Your career story, in one clear profile.</p>
        <div className="loading-indicator" role="status" aria-label="Loading">
          <span />
          <span />
          <span />
        </div>
      </section>

      <span className="splash-version">LUMINACV</span>
    </main>
  );
}
