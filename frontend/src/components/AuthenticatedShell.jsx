import { AnimatePresence, motion } from "framer-motion";
import { labels } from "../constants.js";
import { fullName } from "../utils/logistics.js";
import { BrandHeader } from "./shared.jsx";

//shared layout wrapper for every logged-in user view.
export function AuthenticatedShell({ active,
                                       children,
                                       currentClient,
                                       currentEmployee,
                                       currentOffice,
                                       error,
                                       extraTabs,
                                       onLogout,
                                       session,
                                       setActive,
                                       setLoginSuccess,
                                       tabs,
                                       loginSuccess,
                                       logoutMessage,
                                    }) {
  return (
    <div>
      <AnimatePresence>
        {(loginSuccess || logoutMessage) && (
          <motion.div
            className="success-overlay"
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="success-popup"
              initial={{ opacity: 0, x: 48, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.98 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>{logoutMessage ? "Logged out" : "Login successful"}</span>
              {!logoutMessage && <button type="button" aria-label="Close" onClick={() => setLoginSuccess(false)}>X</button>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="topbar">
        <BrandHeader title="Dkont" />
        <div className="session-badge">
          <span>{labels[session.role]}</span>
          {currentEmployee && <span>{labels[currentEmployee.employeeType]}</span>}
          {currentOffice && <span>{currentOffice.address}</span>}
          <strong>{session.username}</strong>
          <button type="button" className="logout-button" onClick={onLogout}>Изход</button>
        </div>
      </header>

      <main className="shell">
        {error && <div className="alert">{error}</div>}
        <section className="controls">
          <nav className="tabs" aria-label="Навигация">
            {tabs.map(([key, label, Icon]) => (
              <button key={key} className={active === key ? "active" : ""} onClick={() => setActive(key)}>
                <Icon size={16} /> {label}
              </button>
            ))}
            {extraTabs}
          </nav>
          {currentClient && <div className="role-controls"><strong>{fullName(currentClient)}</strong></div>}
        </section>
        {children}
      </main>
    </div>
  );
}
