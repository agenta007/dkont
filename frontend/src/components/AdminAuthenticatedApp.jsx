import { useNavigate } from "react-router-dom";
import { BarChart3, Building2, CheckCircle2, ClipboardList, MapPinned, Users } from "lucide-react";
import { AuthenticatedShell } from "./AuthenticatedShell.jsx";
import { Clients, Companies, Dashboard, Employees, Offices, Reports } from "./operations.jsx";

export function AdminAuthenticatedApp({ active, data, error, load, loginSuccess, logoutMessage, onLogout, session, setActive, setLoginSuccess, visibleShipments }) {
  const navigate = useNavigate();
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
      tabs={adminTabs}
      extraTabs={<button type="button" className="secondary" onClick={() => navigate("/live")}><MapPinned size={16} /> Live</button>}
    >
      {active === "dashboard" && <Dashboard data={data} visibleShipments={visibleShipments} currentClient={null} currentOffice={currentOffice} session={session} onRefresh={load} />}
      {active === "companies" && <Companies data={data} onRefresh={load} />}
      {active === "offices" && <Offices data={data} selectedCompanyId={data.companies[0]?.id ?? ""} onRefresh={load} />}
      {active === "employees" && <Employees data={data} selectedCompanyId={data.companies[0]?.id ?? ""} onRefresh={load} />}
      {active === "clients" && <Clients data={data} selectedCompanyId={data.companies[0]?.id ?? ""} onRefresh={load} />}
      {active === "reports" && <Reports data={data} />}
    </AuthenticatedShell>
  );
}

const adminTabs = [
  ["dashboard", "Табло", BarChart3],
  ["companies", "Компании", Building2],
  ["offices", "Офиси", Building2],
  ["employees", "Служители", ClipboardList],
  ["clients", "Клиенти", Users],
  ["reports", "Справки", CheckCircle2],
];
