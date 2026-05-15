import { BarChart3, Truck } from "lucide-react";
import { AuthenticatedShell } from "./AuthenticatedShell.jsx";
import { Dashboard, Shipments } from "./operations.jsx";

export function ClientAuthenticatedApp({ active, clientId, data, error, load, loginSuccess, logoutMessage, onLogout, session, setActive, setLoginSuccess, visibleShipments }) {
  const currentClient = data.clients.find((client) => client.id === Number(clientId));

  return (
    <AuthenticatedShell
      active={active}
      currentClient={currentClient}
      error={error}
      loginSuccess={loginSuccess}
      logoutMessage={logoutMessage}
      onLogout={onLogout}
      session={session}
      setActive={setActive}
      setLoginSuccess={setLoginSuccess}
      tabs={clientTabs}
    >
      {active === "dashboard" && <Dashboard data={data} visibleShipments={visibleShipments} currentClient={currentClient} currentOffice={null} session={session} onRefresh={load} />}
      {active === "shipments" && <Shipments data={data} shipments={visibleShipments} role={session.role} session={session} onRefresh={load} />}
    </AuthenticatedShell>
  );
}

const clientTabs = [
  ["dashboard", "Табло", BarChart3],
  ["shipments", "Моите пратки", Truck],
];
