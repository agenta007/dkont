import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  PackagePlus,
  RefreshCw,
  Truck,
  Users,
} from "lucide-react";
import "./styles.css";

const labels = {
  ADMIN: "Администратор",
  EMPLOYEE: "Служител",
  CLIENT: "Клиент",
  TO_OFFICE: "до офис",
  TO_ADDRESS: "до адрес",
  REGISTERED: "регистрирана",
  IN_TRANSIT: "в движение",
  DELIVERED: "получена",
  CANCELLED: "отказана",
  COURIER: "куриер",
  OFFICE_EMPLOYEE: "офис служител",
};

const api = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return null;
  return response.json();
};

function App() {
  const [data, setData] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [role, setRole] = useState("ADMIN");
  const [clientId, setClientId] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    const snapshot = await api("/api/snapshot");
    setData(snapshot);
    setClientId((current) => current ?? snapshot.clients[0]?.id ?? null);
  };

  useEffect(() => {
    load().catch((exception) => setError(exception.message));
  }, []);

  const visibleShipments = useMemo(() => {
    if (!data) return [];
    if (role !== "CLIENT") return data.shipments;
    return data.shipments.filter((shipment) => shipment.senderClientId === Number(clientId) || shipment.receiverClientId === Number(clientId));
  }, [data, role, clientId]);

  if (!data) {
    return <main className="loading">Зареждане...</main>;
  }

  const currentClient = data.clients.find((client) => client.id === Number(clientId));

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const nextSession = await api("/api/login", { method: "POST", body: JSON.stringify(payload) });
      setSession(nextSession);
      setRole(nextSession.role);
      if (nextSession.clientId) setClientId(nextSession.clientId);
    } catch (exception) {
      setError(exception.message);
    }
  };

  const tabs = [
    ["dashboard", "Табло", BarChart3],
    ["shipments", "Пратки", Truck],
    ["clients", "Клиенти", Users],
    ["employees", "Служители", ClipboardList],
    ["offices", "Офиси", Building2],
    ["reports", "Справки", CheckCircle2],
  ].filter(([key]) => role !== "CLIENT" || !["clients", "employees", "offices"].includes(key));

  return (
    <div>
      <header className="topbar">
        <div>
          <p className="eyebrow">Логистична компания</p>
          <h1>Balkan Logistics</h1>
        </div>
        <form className="login" onSubmit={handleLogin}>
          <input name="username" defaultValue="admin" aria-label="Потребител" />
          <input name="password" type="password" defaultValue="admin" aria-label="Парола" />
          <button>Вход</button>
          <strong>{session ? session.username : "демо режим"}</strong>
        </form>
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
          </nav>
          <div className="role-controls">
            <label>
              Роля
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="ADMIN">Администратор</option>
                <option value="EMPLOYEE">Служител</option>
                <option value="CLIENT">Клиент</option>
              </select>
            </label>
            {role === "CLIENT" && (
              <label>
                Клиент
                <select value={clientId ?? ""} onChange={(event) => setClientId(Number(event.target.value))}>
                  {data.clients.map((client) => (
                    <option key={client.id} value={client.id}>{fullName(client)}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>

        {active === "dashboard" && <Dashboard data={data} visibleShipments={visibleShipments} currentClient={currentClient} onRefresh={load} />}
        {active === "shipments" && <Shipments data={data} shipments={visibleShipments} role={role} onRefresh={load} />}
        {active === "clients" && <Clients data={data} onRefresh={load} />}
        {active === "employees" && <Employees data={data} onRefresh={load} />}
        {active === "offices" && <Offices data={data} onRefresh={load} />}
        {active === "reports" && <Reports />}
      </main>
    </div>
  );
}

function Dashboard({ data, visibleShipments, currentClient, onRefresh }) {
  const open = visibleShipments.filter((shipment) => !["DELIVERED", "CANCELLED"].includes(shipment.status));
  const company = data.companies[0];

  return (
    <ViewTitle eyebrow="Операции" title="Текущо състояние" action={<IconButton onClick={onRefresh} icon={RefreshCw}>Обнови</IconButton>}>
      <div className="metrics">
        <Metric value={visibleShipments.length} label="регистрирани пратки" />
        <Metric value={open.length} label="неполучени пратки" />
        <Metric value={data.clients.length} label="клиенти" />
        <Metric value={data.employees.length} label="служители" />
      </div>
      <div className="split">
        <section className="panel">
          <h3>Компания</h3>
          <Info rows={[["Име", company.name], ["Адрес", company.address], ["Телефон", company.phone], ["Имейл", company.email]]} />
        </section>
        <section className="panel">
          <h3>{currentClient ? `Клиент: ${fullName(currentClient)}` : "Клиентски изглед"}</h3>
          <Info rows={[["Видими пратки", visibleShipments.length], ["Активни пратки", open.length], ["Последна пратка", visibleShipments.at(-1)?.sentDate ?? "няма"]]} />
        </section>
      </div>
    </ViewTitle>
  );
}

function Shipments({ data, shipments, role, onRefresh }) {
  const saveShipment = async (event) => {
    event.preventDefault();
    await api("/api/shipments", { method: "POST", body: JSON.stringify(numericForm(event.currentTarget)) });
    event.currentTarget.reset();
    await onRefresh();
  };

  const deliver = async (id) => {
    await api(`/api/shipments/${id}/deliver`, { method: "POST" });
    await onRefresh();
  };

  const remove = async (id) => {
    await api(`/api/shipments/${id}`, { method: "DELETE" });
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow="Регистър" title="Пратки">
      {role !== "CLIENT" && (
        <form className="form-grid panel" onSubmit={saveShipment}>
          <Select name="senderClientId" label="Подател" items={data.clients} render={fullName} />
          <Select name="receiverClientId" label="Получател" items={data.clients} render={fullName} />
          <Select name="registeredByEmployeeId" label="Регистрирал" items={data.employees} render={fullName} />
          <Select name="courierId" label="Куриер" items={data.employees.filter((item) => item.employeeType === "COURIER")} render={fullName} />
          <Select name="sourceOfficeId" label="Начален офис" items={data.offices} render={(office) => office.name} />
          <Select name="destinationOfficeId" label="Краен офис" items={data.offices} render={(office) => office.name} />
          <label>Тип доставка<select name="deliveryType"><option value="TO_OFFICE">до офис</option><option value="TO_ADDRESS">до адрес</option></select></label>
          <label>Статус<select name="status"><option value="REGISTERED">регистрирана</option><option value="IN_TRANSIT">в движение</option><option value="DELIVERED">получена</option><option value="CANCELLED">отказана</option></select></label>
          <label>Тегло<input name="weight" type="number" step="0.1" min="0.1" defaultValue="1.0" /></label>
          <label className="wide">Адрес<input name="deliveryAddress" /></label>
          <button className="wide"><PackagePlus size={16} /> Запази пратка</button>
        </form>
      )}
      <ShipmentTable data={data} shipments={shipments} role={role} onDeliver={deliver} onDelete={remove} />
    </ViewTitle>
  );
}

function Clients({ data, onRefresh }) {
  return <CrudView title="Клиенти" endpoint="clients" fields={["firstName", "lastName", "phone", "email", "address"]} data={data.clients} onRefresh={onRefresh} renderRow={(client) => [fullName(client), client.phone, client.email, client.address]} />;
}

function Employees({ data, onRefresh }) {
  return <CrudView title="Служители" endpoint="employees" extra={{ companyId: data.companies[0].id }} fields={["firstName", "lastName", "userId", "officeId", "employeeType"]} data={data.employees} onRefresh={onRefresh} renderRow={(employee) => [fullName(employee), labels[employee.employeeType], officeName(data, employee.officeId)]} />;
}

function Offices({ data, onRefresh }) {
  return <CrudView title="Офиси" endpoint="offices" extra={{ companyId: data.companies[0].id }} fields={["name", "city", "address", "phone"]} data={data.offices} onRefresh={onRefresh} renderRow={(office) => [office.name, office.city, office.address, office.phone]} />;
}

function CrudView({ title, endpoint, fields, data, renderRow, onRefresh, extra = {} }) {
  const submit = async (event) => {
    event.preventDefault();
    await api(`/api/${endpoint}`, { method: "POST", body: JSON.stringify({ ...extra, ...numericForm(event.currentTarget) }) });
    event.currentTarget.reset();
    await onRefresh();
  };
  const remove = async (id) => {
    await api(`/api/${endpoint}/${id}`, { method: "DELETE" });
    await onRefresh();
  };
  return (
    <ViewTitle eyebrow="Регистър" title={title}>
      <div className="split">
        <form className="form-grid panel" onSubmit={submit}>{fields.map((field) => <Field key={field} field={field} />)}<button className="wide">Запази</button></form>
        <div className="table-wrap"><table><tbody>{data.map((item) => <tr key={item.id}>{renderRow(item).map((cell, index) => <td key={index}>{cell}</td>)}<td><button className="secondary" onClick={() => remove(item.id)}>Изтрий</button></td></tr>)}</tbody></table></div>
      </div>
    </ViewTitle>
  );
}

function Reports() {
  const [report, setReport] = useState(null);
  const loadReport = async (event) => {
    event?.preventDefault();
    const params = event ? new URLSearchParams(new FormData(event.currentTarget)) : new URLSearchParams();
    setReport(await api(`/api/reports?${params}`));
  };
  useEffect(() => {
    loadReport();
  }, []);
  return (
    <ViewTitle eyebrow="Справки" title="Приходи и активни пратки">
      <form className="inline-form" onSubmit={loadReport}>
        <label>От<input type="date" name="from" /></label>
        <label>До<input type="date" name="to" /></label>
        <button>Изчисли</button>
      </form>
      {report && <div className="metrics"><Metric value={`${Number(report.revenue).toFixed(2)} лв.`} label="приходи" /><Metric value={report.openShipments.length} label="неполучени" /><Metric value={report.shipments.length} label="общо пратки" /></div>}
    </ViewTitle>
  );
}

function ShipmentTable({ data, shipments, role, onDeliver, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Подател</th><th>Получател</th><th>Тип</th><th>Цена</th><th>Статус</th><th>Дата</th><th></th></tr></thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td>{shipment.id}</td>
              <td>{clientName(data, shipment.senderClientId)}</td>
              <td>{clientName(data, shipment.receiverClientId)}</td>
              <td>{labels[shipment.deliveryType]}</td>
              <td>{Number(shipment.price).toFixed(2)} лв.</td>
              <td><span className={`status ${shipment.status}`}>{labels[shipment.status]}</span></td>
              <td>{shipment.sentDate}</td>
              <td className="actions">{role !== "CLIENT" && shipment.status !== "DELIVERED" && <button onClick={() => onDeliver(shipment.id)}>Получена</button>}{role !== "CLIENT" && <button className="secondary" onClick={() => onDelete(shipment.id)}>Изтрий</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ViewTitle({ eyebrow, title, action, children }) {
  return <section><div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>{children}</section>;
}

function Metric({ value, label }) {
  return <article><strong>{value}</strong><span>{label}</span></article>;
}

function Info({ rows }) {
  return <div className="info-list">{rows.map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div>;
}

function IconButton({ icon: Icon, children, ...props }) {
  return <button {...props}><Icon size={16} /> {children}</button>;
}

function Select({ name, label, items, render }) {
  return <label>{label}<select name={name}>{items.map((item) => <option key={item.id} value={item.id}>{render(item)}</option>)}</select></label>;
}

function Field({ field }) {
  if (field === "employeeType") return <label>Тип<select name="employeeType"><option value="OFFICE_EMPLOYEE">офис служител</option><option value="COURIER">куриер</option></select></label>;
  const labelsByField = { firstName: "Име", lastName: "Фамилия", phone: "Телефон", email: "Имейл", address: "Адрес", userId: "Потребител ID", officeId: "Офис ID", name: "Име", city: "Град" };
  return <label>{labelsByField[field] ?? field}<input name={field} type={field.endsWith("Id") ? "number" : field === "email" ? "email" : "text"} required /></label>;
}

function numericForm(form) {
  const data = Object.fromEntries(new FormData(form));
  Object.keys(data).forEach((key) => {
    if (key.endsWith("Id") || key === "weight") data[key] = Number(data[key]);
  });
  return data;
}

function fullName(item) {
  return `${item.firstName} ${item.lastName}`;
}

function clientName(data, id) {
  const client = data.clients.find((item) => item.id === Number(id));
  return client ? fullName(client) : `#${id}`;
}

function officeName(data, id) {
  const office = data.offices.find((item) => item.id === Number(id));
  return office ? `${office.name}, ${office.city}` : `#${id}`;
}

createRoot(document.getElementById("root")).render(<App />);
