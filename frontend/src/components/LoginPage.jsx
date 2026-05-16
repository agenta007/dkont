import { useTranslation } from "react-i18next";
import dkontLogo from "../assets/images/dkont-logo.png";
import { OverlayNotification } from "./OverlayNotification.jsx";

export function LoginPage({ error, serverOffline, onDismissOffline, onLogin }) {
  const { t } = useTranslation();
  return (
    <main className="login-screen">
      <OverlayNotification message={serverOffline ? t("auth.serverOffline") : ""} type="error" onDismiss={onDismissOffline} />
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
