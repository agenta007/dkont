import { BarChart3, Truck } from "lucide-react";
import { AuthenticatedShell } from "./AuthenticatedShell.jsx";
import { Dashboard, Shipments } from "./operations.jsx";

export function DriverAuthenticatedApp({ active, data, error, load, loginSuccess, logoutMessage, onLogout, session, setActive, setLoginSuccess, visibleShipments }) {
  const currentEmployee = data.employees.find((employee) => employee.id === Number(session.employeeId));
  const currentOffice = data.offices.find((office) => office.id === Number(session.officeId));

  return (
    <AuthenticatedShell
      active={active}
      currentEmployee={currentEmployee}
      currentOffice={currentOffice}
      error={error}
      loginSuccess={loginSuccess}
      logoutMessage={logoutMessage}
      onLogout={onLogout}
      session={session}
      setActive={setActive}
      setLoginSuccess={setLoginSuccess}
      tabs={driverTabs}
    >
      {active === "dashboard" && <Dashboard data={data} visibleShipments={visibleShipments} currentClient={null} currentOffice={currentOffice} session={session} onRefresh={load} />}
      {active === "shipments" && <Shipments data={data} shipments={visibleShipments} role={session.role} session={session} onRefresh={load} />}
    </AuthenticatedShell>
  );
}

const driverTabs = [
  ["dashboard", "Табло", BarChart3],
  ["shipments", "Моите доставки", Truck],
];
