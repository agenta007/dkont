import { useTranslation } from "react-i18next";
import dkontLogo from "../assets/images/dkont-logo.png";
import { AlertTriangle, X } from "lucide-react";

export function LoginPage({ error, serverOffline, onDismissOffline, onLogin }) {
  const { t } = useTranslation();
  return (
    <main className="login-screen">
      {serverOffline && (
        <div className="offline-overlay" role="alertdialog" aria-modal="true" aria-labelledby="offline-title">
          <section className="offline-popup">
            <AlertTriangle size={24} aria-hidden="true" />
            <div>
              <h2 id="offline-title">{t("auth.serverOffline")}</h2>
              <p>{t("auth.serverOfflineMsg")}</p>
            </div>
            <button type="button" className="offline-close" onClick={onDismissOffline} aria-label={t("auth.closeWarning")}>
              <X size={18} aria-hidden="true" />
            </button>
          </section>
        </div>
      )}
      <section className="login-panel" aria-label={t("auth.login")}>
        <img src={dkontLogo} alt="Dkont logo" className="login-logo" />
        <form className="login-card" onSubmit={onLogin}>
          {error && <div className="alert">{error}</div>}
          <label>
            {t("auth.username")}
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            {t("auth.password")}
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button>{t("auth.login")}</button>
        </form>
      </section>
    </main>
  );
}
