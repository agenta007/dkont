import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSnapshot, login } from "./api.js";
import { showDeveloperArea } from "./constants.js";
import { AuthenticatedApp } from "./components/AuthenticatedApp.jsx";
import { LoginPage } from "./components/LoginPage.jsx";
import { AssignmentPage } from "./pages/AssignmentPage.jsx";
import { ChecklistPage } from "./pages/ChecklistPage.jsx";
import { DocumentationPage } from "./pages/DocumentationPage.jsx";
import { LiveDashboardPage } from "./pages/LiveDashboardPage.jsx";

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [role, setRole] = useState("ADMIN");
  const [clientId, setClientId] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [serverOffline, setServerOffline] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState(false);

  const load = async () => {
    const snapshot = await getSnapshot();
    setData(snapshot);
    setClientId((current) => current ?? snapshot.clients[0]?.id ?? null);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setServerOffline(false);
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const nextSession = await login(payload);
      setSession(nextSession);
      setRole(nextSession.role);
      setClientId(nextSession.clientId ?? null);
      setActive("dashboard");
      setLoginSuccess(true);
      await load();
      navigate("/");
    } catch (exception) {
      if (exception.code === "SERVER_UNREACHABLE") {
        setServerOffline(true);
      } else {
        setError(exception.message);
      }
    }
  };

  const completeLogout = () => {
    setSession(null);
    setData(null);
    setClientId(null);
    setRole("ADMIN");
    setActive("dashboard");
    setError("");
    setServerOffline(false);
    setLoginSuccess(false);
    setLogoutMessage(false);
    navigate("/");
  };

  const handleLogout = () => {
    setLoginSuccess(false);
    setLogoutMessage(true);
    window.setTimeout(completeLogout, 700);
  };

  useEffect(() => {
    if (session) {
      load().catch((exception) => setError(exception.message));
    }
  }, [session]);

  useEffect(() => {
    if (!loginSuccess) return undefined;
    const timeout = window.setTimeout(() => setLoginSuccess(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [loginSuccess]);

  const visibleShipments = useMemo(() => {
    if (!data) return [];
    if (role === "CLIENT") {
      return data.shipments.filter((shipment) => shipment.senderClientId === Number(clientId) || shipment.receiverClientId === Number(clientId));
    }
    if (role === "EMPLOYEE" && session?.employeeType === "COURIER") {
      return data.shipments.filter((shipment) => shipment.courierId === Number(session.employeeId));
    }
    if (role === "EMPLOYEE") {
      return data.shipments.filter((shipment) => shipment.sourceOfficeId === Number(session.officeId) || shipment.destinationOfficeId === Number(session.officeId));
    }
    return data.shipments;
  }, [data, role, clientId, session]);

  return (
    <Routes>
      {showDeveloperArea && <Route path="/checklist" element={<ChecklistPage />} />}
      {showDeveloperArea && <Route path="/assignment" element={<AssignmentPage />} />}
      {showDeveloperArea && <Route path="/documentation" element={<DocumentationPage />} />}
      {showDeveloperArea && <Route path="/documentation/:section" element={<DocumentationPage />} />}
      <Route
        path="/live"
        element={
          session && data ? (
            <LiveDashboardPage data={data} session={session} />
          ) : session ? (
            <main className="loading">{t("common.loading")}</main>
          ) : (
            <LoginPage error={error} serverOffline={serverOffline} onDismissOffline={() => setServerOffline(false)} onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/*"
        element={
          session && data ? (
            <AuthenticatedApp
              active={active}
              clientId={clientId}
              data={data}
              error={error}
              load={load}
              loginSuccess={loginSuccess}
              logoutMessage={logoutMessage}
              onLogout={handleLogout}
              role={role}
              session={session}
              setActive={setActive}
              setClientId={setClientId}
              setLoginSuccess={setLoginSuccess}
              setRole={setRole}
              visibleShipments={visibleShipments}
            />
          ) : session ? (
            <main className="loading">{t("common.loading")}</main>
          ) : (
            <LoginPage error={error} serverOffline={serverOffline} onDismissOffline={() => setServerOffline(false)} onLogin={handleLogin} />
          )
        }
      />
    </Routes>
  );
}
