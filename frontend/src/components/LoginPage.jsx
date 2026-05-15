import dkontLogo from "../assets/images/dkont-logo.png";
import { AlertTriangle, X } from "lucide-react";

export function LoginPage({ error, serverOffline, onDismissOffline, onLogin }) {
  return (
    <main className="login-screen">
      {serverOffline && (
        <div className="offline-overlay" role="alertdialog" aria-modal="true" aria-labelledby="offline-title">
          <section className="offline-popup">
            <AlertTriangle size={24} aria-hidden="true" />
            <div>
              <h2 id="offline-title">Server offline</h2>
              <p>Backend server is unreachable. Check that it is running, then try again.</p>
            </div>
            <button type="button" className="offline-close" onClick={onDismissOffline} aria-label="Close server offline warning">
              <X size={18} aria-hidden="true" />
            </button>
          </section>
        </div>
      )}
      <section className="login-panel" aria-label="Вход">
        <img src={dkontLogo} alt="Dkont logo" className="login-logo" />
        <form className="login-card" onSubmit={onLogin}>
          {error && <div className="alert">{error}</div>}
          <label>
            Потребител
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Парола
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button>Вход</button>
        </form>
      </section>
    </main>
  );
}
