import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PackagePlus, RefreshCw } from "lucide-react";
import { changeUserRole, createEmployee, createResource, createShipment, createUser, deleteEmployee, deleteResource, deleteShipment, deliverShipment, getGpsPositions, updateClient, updateUser } from "../api.js";
import { clientName, fullName, numericForm, officeName } from "../utils/logistics.js";
import { Field } from "./Field.jsx";
import { IconButton } from "./IconButton.jsx";
import { Info } from "./Info.jsx";
import { Metric } from "./Metric.jsx";
import { OverlayNotification, useOverlayNotification } from "./OverlayNotification.jsx";
import { Select } from "./Select.jsx";
import { ViewTitle } from "./ViewTitle.jsx";

export function Dashboard({ data, visibleShipments, currentClient, currentOffice, session, onRefresh }) {
  const { t } = useTranslation();
  const open = visibleShipments.filter((shipment) => !["DELIVERED", "CANCELLED"].includes(shipment.status));
  const company = data.companies[0] ?? {};
  const delivered = visibleShipments.filter((shipment) => shipment.status === "DELIVERED");

  return (
    <ViewTitle eyebrow={t("dashboard.eyebrow")} title={t("dashboard.title")} action={<IconButton onClick={onRefresh} icon={RefreshCw}>{t("common.refresh")}</IconButton>}>
      {session.role === "ADMIN" && (
        <div className="metrics">
          <Metric value={data.companies.length} label={t("dashboard.metrics.companies")} />
          <Metric value={data.offices.length} label={t("dashboard.metrics.offices")} />
          <Metric value={data.employees.length} label={t("dashboard.metrics.employees")} />
          <Metric value={data.clients.length} label={t("dashboard.metrics.clients")} />
        </div>
      )}
      {session.role === "EMPLOYEE" && session.employeeType === "OFFICE_EMPLOYEE" && (
        <>
          <div className="metrics">
            <Metric value={visibleShipments.length} label={t("dashboard.metrics.officeShipments")} />
            <Metric value={open.length} label={t("dashboard.metrics.activeRequests")} />
            <Metric value={currentOffice?.address ?? "-"} label={t("dashboard.metrics.office")} />
            <Metric value={currentOffice?.city ?? "-"} label={t("dashboard.metrics.city")} />
          </div>
          <div className="split">
            <section className="panel">
              <h3>{t("dashboard.context")}</h3>
              <Info rows={[
                [t("dashboard.infoRole"), t("labels.OFFICE_EMPLOYEE")],
                [t("dashboard.infoOffice"), currentOffice?.address ?? t("common.none")],
                [t("dashboard.infoShipments"), visibleShipments.length],
                [t("dashboard.infoActive"), open.length],
              ]} />
            </section>
            <section className="panel">
              <h3>{t("dashboard.clientDirectory")}</h3>
              {data.clients.length === 0 ? (
                <p style={{ color: "var(--muted)" }}>{t("dashboard.noClients")}</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("fields.name")}</th>
                        <th>{t("fields.phone")}</th>
                        <th>{t("fields.email")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.clients.map((client) => (
                        <tr key={client.id}>
                          <td>{fullName(client)}</td>
                          <td>{client.phone ?? "—"}</td>
                          <td>{client.email ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
      {session.role === "EMPLOYEE" && session.employeeType === "COURIER" && (
        <div className="metrics">
          <Metric value={visibleShipments.length} label={t("dashboard.metrics.assignedDeliveries")} />
          <Metric value={open.length} label={t("dashboard.metrics.toDeliver")} />
          <Metric value={delivered.length} label={t("dashboard.metrics.delivered")} />
          <Metric value={currentOffice?.city ?? "-"} label={t("dashboard.metrics.base")} />
        </div>
      )}
      {session.role === "CLIENT" && (
        <div className="metrics">
          <Metric value={visibleShipments.length} label={t("dashboard.metrics.myShipments")} />
          <Metric value={open.length} label={t("dashboard.metrics.activeShipments")} />
          <Metric value={delivered.length} label={t("dashboard.metrics.received")} />
          <Metric value={visibleShipments.at(-1)?.sentDate ?? "-"} label={t("dashboard.metrics.lastShipment")} />
        </div>
      )}
      {session.employeeType !== "OFFICE_EMPLOYEE" && (
        <div className="split">
          <section className="panel">
            <h3>{session.role === "ADMIN" ? t("dashboard.system") : t("dashboard.context")}</h3>
            <Info rows={session.role === "ADMIN"
              ? [
                  [t("fields.name"), "Dkont"],
                  [t("dashboard.purposeLabel"), t("dashboard.purpose")],
                  [t("dashboard.activeCompany"), company.name ?? "-"],
                  [t("dashboard.infoEmail"), company.email ?? "-"],
                ]
              : [
                  [t("dashboard.infoRole"), t(`labels.${session.employeeType ?? session.role}`)],
                  [t("dashboard.infoOffice"), currentOffice?.address ?? t("common.none")],
                  [t("dashboard.infoShipments"), visibleShipments.length],
                  [t("dashboard.infoActive"), open.length],
                ]} />
          </section>
          <section className="panel">
            <h3>{session.role === "CLIENT" && currentClient ? t("dashboard.panelClient", { name: fullName(currentClient) }) : t("dashboard.panelShipments")}</h3>
            <Info rows={[
              [t("dashboard.visibleShipments"), visibleShipments.length],
              [t("dashboard.activeShipments"), open.length],
              [t("dashboard.lastShipment"), visibleShipments.at(-1)?.sentDate ?? t("common.none")],
            ]} />
          </section>
        </div>
      )}
    </ViewTitle>
  );
}

export function Shipments({ data, shipments, role, session, onRefresh }) {
  const { t } = useTranslation();
  const canCreateShipment = role === "EMPLOYEE" && session?.employeeType === "OFFICE_EMPLOYEE";
  const [deliveryType, setDeliveryType] = useState("TO_OFFICE");

  const registeringEmployee = data.employees.find((e) => e.id === Number(session.employeeId));
  const companyId = registeringEmployee?.companyId ?? data.companies[0]?.id;
  const companyOffices = useMemo(
    () => data.offices.filter((o) => o.companyId === companyId),
    [data.offices, companyId]
  );

  const saveShipment = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = numericForm(form);
    const payload = {
      company: { id: companyId },
      sender: { id: values.senderClientId },
      recipient: { id: values.receiverClientId },
      registeredBy: { id: Number(session.employeeId) },
      deliveryType: values.deliveryType,
      weight: values.weight,
    };
    if (values.deliveryType === "TO_OFFICE") {
      payload.destinationOffice = { id: values.destinationOfficeId };
    } else {
      payload.deliveryAddress = values.deliveryAddress;
    }
    await createShipment(payload);
    form.reset();
    setDeliveryType("TO_OFFICE");
    await onRefresh();
  };

  const deliver = async (id) => {
    await deliverShipment(id);
    await onRefresh();
  };

  const remove = async (id) => {
    await deleteShipment(id);
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow={t("shipments.eyebrow")} title={t("shipments.title")}>
      {canCreateShipment && (
        <form className="form-grid panel" onSubmit={saveShipment}>
          <ClientPicker name="senderClientId" label={t("shipments.sender")} clients={data.clients} onRefresh={onRefresh} />
          <ClientPicker name="receiverClientId" label={t("shipments.receiver")} clients={data.clients} onRefresh={onRefresh} />
          <label>
            {t("shipments.deliveryType")}
            <select name="deliveryType" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
              <option value="TO_OFFICE">{t("shipments.toOffice")}</option>
              <option value="TO_ADDRESS">{t("shipments.toAddress")}</option>
            </select>
          </label>
          {deliveryType === "TO_OFFICE" ? (
            <label>
              {t("shipments.destOffice")}
              <select name="destinationOfficeId" required>
                {companyOffices.map((office) => (
                  <option key={office.id} value={office.id}>{office.address}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="wide">{t("shipments.address")}<input name="deliveryAddress" required /></label>
          )}
          <label>{t("shipments.weight")}<input name="weight" type="number" step="0.1" min="0.1" defaultValue="1.0" /></label>
          <button className="wide"><PackagePlus size={16} /> {t("shipments.add")}</button>
        </form>
      )}
      <ShipmentTable data={data} shipments={shipments} role={role} onDeliver={deliver} onDelete={remove} />
    </ViewTitle>
  );
}

export function Companies({ data, onRefresh }) {
  const { t } = useTranslation();
  const { message: toast, type: toastType, notify, dismiss } = useOverlayNotification();
  return (
    <>
      <OverlayNotification message={toast} type={toastType} onDismiss={dismiss} />
      <CrudView
        eyebrow={t("companies.eyebrow")}
        title={t("companies.title")}
        endpoint="companies"
        fields={["name", "basePricePerKg", "addressSurcharge"]}
        data={data.companies}
        onRefresh={onRefresh}
        renderRow={(company) => [company.name, `${Number(company.basePricePerKg).toFixed(2)} лв./кг`, `${Number(company.addressSurcharge).toFixed(2)} лв.`]}
        addLabel={t("companies.add")}
        addSuccess={t("companies.addSuccess")}
        addError={(err) => t("companies.addError", { error: err.message })}
        onNotify={notify}
        stacked
      />
    </>
  );
}

export function Clients({ data, selectedCompanyId, onRefresh }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const { message: toast, type: toastType, notify, dismiss } = useOverlayNotification();

  const handleCreated = async () => {
    setShowAdd(false);
    await onRefresh();
    notify(t("clients.addSuccess"), "success");
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    const values = numericForm(event.currentTarget);
    try {
      await updateUser(editing.userId, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || null,
      });
      await updateClient(editing.id, { phone: values.phone });
      setEditing(null);
      await onRefresh();
      notify(t("clients.saveSuccess"), "success");
    } catch (err) {
      notify(t("clients.saveError", { error: err.message }), "error");
    }
  };

  const remove = async (id) => {
    await deleteResource("clients", id);
    if (editing?.id === id) setEditing(null);
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow={t("clients.eyebrow")} title={t("clients.title")}
      action={<button onClick={() => setShowAdd(true)}>{t("clients.add")}</button>}>
      <OverlayNotification message={toast} type={toastType} onDismiss={dismiss} />
      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
      {editing && (
        <form key={editing.id} className="form-grid panel" style={{ marginBottom: 16 }} onSubmit={submitEdit}>
          <h4 style={{ margin: 0, gridColumn: "1 / -1" }}>{t("clients.editTitle")}</h4>
          <label>{t("clients.firstName")}<input name="firstName" defaultValue={editing.firstName} required /></label>
          <label>{t("clients.lastName")}<input name="lastName" defaultValue={editing.lastName} required /></label>
          <label>{t("clients.email")} <small style={{ fontWeight: 400 }}>({t("common.optional")})</small><input name="email" type="email" defaultValue={editing.email ?? ""} /></label>
          <label>{t("clients.phone")}<input name="phone" defaultValue={editing.phone ?? ""} required /></label>
          <button className="wide">{t("clients.save")}</button>
          <button type="button" className="wide secondary" onClick={() => setEditing(null)}>{t("common.back")}</button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <tbody>
            {data.clients.map((client) => (
              <tr key={client.id} className={editing?.id === client.id ? "active-row" : ""}>
                <td>{fullName(client)}</td>
                <td>{client.phone}</td>
                <td>{client.email}</td>
                <td className="actions">
                  <button className="secondary" onClick={() => setEditing(client)}>{t("common.edit")}</button>
                  <button className="secondary" onClick={() => remove(client.id)}>{t("common.delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ViewTitle>
  );
}

export function Employees({ data, selectedCompanyId, onRefresh }) {
  const { t } = useTranslation();
  const [workerCompanyId, setWorkerCompanyId] = useState(Number(selectedCompanyId) || data.companies[0]?.id || "");
  const { message: roleToast, type: roleToastType, notify: showToast, dismiss: dismissToast } = useOverlayNotification();
  const companyOffices = data.offices.filter((office) => office.companyId === Number(workerCompanyId));

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = numericForm(form);
    try {
      const user = await createUser({
        username: values.username,
        passwordHash: values.password,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        role: "EMPLOYEE",
      });
      await createEmployee({
        company: { id: Number(workerCompanyId) },
        office: { id: values.officeId },
        user: { id: user.id },
        employeeType: values.employeeType,
      });
      form.reset();
      await onRefresh();
      showToast(t("employees.addSuccess"), "success");
    } catch (err) {
      showToast(t("employees.addError", { error: err.message }), "error");
    }
  };

  const remove = async (id) => {
    await deleteEmployee(id);
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow={t("employees.eyebrow")} title={t("employees.title")}>
      <OverlayNotification message={roleToast} type={roleToastType} onDismiss={dismissToast} />
      <div className="split" style={{ gridTemplateColumns: "1fr" }}>
        <form className="form-grid panel" onSubmit={submit}>
          <label>
            {t("employees.company")}
            <select name="companyId" value={workerCompanyId} onChange={(event) => setWorkerCompanyId(Number(event.target.value))} required>
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label>{t("employees.firstName")}<input name="firstName" required /></label>
          <label>{t("employees.lastName")}<input name="lastName" required /></label>
          <label>{t("employees.username")}<input name="username" required /></label>
          <label>{t("employees.password")}<input name="password" type="password" required /></label>
          <label>{t("employees.email")}<input name="email" type="email" required /></label>
          <label>
            {t("employees.officeAddress")}
            <select name="officeId" required>
              {companyOffices.map((office) => (
                <option key={office.id} value={office.id}>{office.address}</option>
              ))}
            </select>
          </label>
          <label>
            {t("employees.type")}
            <select name="employeeType">
              <option value="OFFICE_EMPLOYEE">{t("employees.typeOffice")}</option>
              <option value="COURIER">{t("employees.typeCourier")}</option>
            </select>
          </label>
          <button className="wide">{t("employees.add")}</button>
        </form>
        <div className="table-wrap">
          <table>
            <tbody>
              {data.employees.map((employee) => {
                const user = data.users.find((u) => u.id === employee.userId);
                return (
                  <tr key={employee.id}>
                    <td>{fullName(employee)}</td>
                    <td>{t(`labels.${employee.employeeType}`)}</td>
                    <td>{officeName(data, employee.officeId)}</td>
                    <td>
                      <select
                        value={user?.role ?? ""}
                        onChange={async (e) => {
                          await changeUserRole(employee.userId, e.target.value);
                          await onRefresh();
                          showToast(t("employees.roleUpdated", { name: fullName(employee) }));
                        }}
                      >
                        <option value="ADMIN">{t("employees.roleAdmin")}</option>
                        <option value="EMPLOYEE">{t("employees.roleEmployee")}</option>
                        <option value="CLIENT">{t("employees.roleClient")}</option>
                      </select>
                    </td>
                    <td><button className="secondary" onClick={() => remove(employee.id)}>{t("common.delete")}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ViewTitle>
  );
}

export function Offices({ data, selectedCompanyId, onRefresh }) {
  const { t } = useTranslation();
  const [officeCompanyId, setOfficeCompanyId] = useState(Number(selectedCompanyId) || data.companies[0]?.id || "");
  const companyOffices = data.offices.filter((office) => office.companyId === Number(officeCompanyId));

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = numericForm(form);
    await createResource("offices", {
      company: { id: Number(officeCompanyId) },
      city: values.city,
      address: values.address,
      phone: values.phone,
    });
    form.reset();
    await onRefresh();
  };

  const remove = async (id) => {
    await deleteResource("offices", id);
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow={t("offices.eyebrow")} title={t("offices.title")}>
      <div className="split">
        <form className="form-grid panel" onSubmit={submit}>
          <label>
            {t("offices.company")}
            <select name="companyId" value={officeCompanyId} onChange={(event) => setOfficeCompanyId(Number(event.target.value))} required>
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label>{t("offices.city")}<input name="city" required /></label>
          <label className="wide">{t("offices.address")}<input name="address" required /></label>
          <label>{t("offices.phone")}<input name="phone" /></label>
          <button className="wide">{t("offices.add")}</button>
        </form>
        <div className="table-wrap">
          <table>
            <tbody>
              {companyOffices.map((office) => (
                <tr key={office.id}>
                  <td>{office.city}</td>
                  <td>{office.address}</td>
                  <td>{office.phone}</td>
                  <td><button className="secondary" onClick={() => remove(office.id)}>{t("common.delete")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ViewTitle>
  );
}

export function Reports({ data }) {
  const { t } = useTranslation();
  const [dates, setDates] = useState({ from: "", to: "" });
  const report = buildReport(data, dates);
  const loadReport = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    setDates(payload);
  };

  return (
    <ViewTitle eyebrow={t("reports.eyebrow")} title={t("reports.title")}>
      <form className="inline-form" onSubmit={loadReport}>
        <label>{t("reports.from")}<input type="date" name="from" /></label>
        <label>{t("reports.to")}<input type="date" name="to" /></label>
        <button>{t("reports.calculate")}</button>
      </form>
      {report && (
        <div className="metrics">
          <Metric value={`${Number(report.revenue).toFixed(2)} ${t("reports.currency")}`} label={t("reports.revenue")} />
          <Metric value={report.openShipments.length} label={t("reports.undelivered")} />
          <Metric value={report.shipments.length} label={t("reports.total")} />
        </div>
      )}
    </ViewTitle>
  );
}

function buildReport(data, dates) {
  const from = dates.from || localDateOffset(-31);
  const to = dates.to || localDateOffset(0);
  const shipments = data.shipments.filter((shipment) => shipment.sentDate >= from && shipment.sentDate <= to);
  const revenue = shipments.reduce((sum, shipment) => sum + Number(shipment.price ?? 0), 0);
  const openShipments = data.shipments.filter((shipment) => shipment.status !== "DELIVERED" && shipment.status !== "CANCELLED");
  return { shipments, openShipments, revenue };
}

function localDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function ClientPicker({ name, label, clients, onRefresh }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => String(clients[0]?.id ?? ""));
  const [showModal, setShowModal] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () => normalizedQuery
      ? clients.filter((c) => [c.phone, fullName(c), c.email].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery))
      : clients,
    [clients, normalizedQuery],
  );

  const handleCreated = async (newClient) => {
    setShowModal(false);
    setQuery("");
    setSelectedId(String(newClient.id));
    await onRefresh();
  };

  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label style={{ marginBottom: 0 }}>
        {label}
        <input
          type="search"
          placeholder={t("fields.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          name={name}
          required
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {fullName(c)}{c.phone ? `, ${c.phone}` : ""}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="secondary"
        style={{ justifySelf: "start", minHeight: 30, padding: "3px 10px", fontSize: 13 }}
        onClick={() => setShowModal(true)}
      >
        + {t("clients.add")}
      </button>
      {showModal && (
        <AddClientModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

function AddClientModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const values = numericForm(event.currentTarget);
      const user = await createUser({
        username: values.username,
        passwordHash: values.password,
        email: values.email || null,
        firstName: values.firstName,
        lastName: values.lastName,
        role: "CLIENT",
      });
      const client = await createResource("clients", { user: { id: user.id }, phone: values.phone || null });
      onCreated(client);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialogRef} onClose={onClose}>
      <form className="modal-content" onSubmit={submit}>
        <h3 className="modal-title">{t("clients.addTitle")}</h3>
        <div className="form-grid" style={{ marginBottom: 0 }}>
          <label>{t("clients.firstName")}<input name="firstName" required /></label>
          <label>{t("clients.lastName")}<input name="lastName" required /></label>
          <label>{t("clients.username")}<input name="username" required autoComplete="off" /></label>
          <label>{t("clients.password")}<input name="password" type="password" required autoComplete="new-password" /></label>
          <label>{t("clients.email")}<input name="email" type="email" /></label>
          <label>{t("clients.phone")}<input name="phone" /></label>
        </div>
        <div className="modal-actions">
          <button disabled={busy}>{t("clients.save")}</button>
          <button type="button" className="secondary" onClick={onClose}>{t("common.back")}</button>
        </div>
      </form>
    </dialog>
  );
}

const ACTIVE_STATUSES = new Set(["REGISTERED", "IN_TRANSIT"]);
const DONE_STATUSES = new Set(["DELIVERED", "CANCELLED"]);
const STATUS_STEPS = ["REGISTERED", "IN_TRANSIT", "DELIVERED"];

export function ClientDeliveries({ data, shipments, session, onRefresh }) {
  const { t } = useTranslation();
  const [gpsPositions, setGpsPositions] = useState({});

  const incoming = useMemo(
    () => shipments.filter((s) => s.receiverClientId === session.clientId),
    [shipments, session.clientId]
  );
  const awaiting = useMemo(() => incoming.filter((s) => ACTIVE_STATUSES.has(s.status)), [incoming]);
  const history = useMemo(() => incoming.filter((s) => DONE_STATUSES.has(s.status)), [incoming]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const positions = await getGpsPositions();
        if (!cancelled) {
          const map = {};
          for (const p of positions) map[p.employeeId] = p;
          setGpsPositions(map);
        }
      } catch {}
    };
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const courierFor = (shipment) => {
    const employee = data.employees.find((e) => e.employeeType === "COURIER" && gpsPositions[e.id]);
    if (!employee) return null;
    const pos = gpsPositions[employee.id];
    return { name: fullName(employee), lat: pos.lat, lng: pos.lng };
  };

  return (
    <ViewTitle eyebrow={t("deliveries.eyebrow")} title={t("deliveries.title")} action={<IconButton onClick={onRefresh} icon={RefreshCw}>{t("common.refresh")}</IconButton>}>
      <h3 className="section-label">{t("deliveries.awaiting")}</h3>
      {awaiting.length === 0 ? (
        <p className="muted">{t("deliveries.noAwaiting")}</p>
      ) : (
        <div className="delivery-cards">
          {awaiting.map((shipment) => {
            const stepIndex = STATUS_STEPS.indexOf(shipment.status);
            const courier = courierFor(shipment);
            return (
              <div key={shipment.id} className="delivery-card panel">
                <div className="delivery-card-header">
                  <span className="delivery-id">#{shipment.id}</span>
                  <span className={`status ${shipment.status}`}>{t(`labels.${shipment.status}`)}</span>
                </div>
                <div className="delivery-meta">
                  <span>{t("deliveries.from")}: <strong>{clientName(data, shipment.senderClientId)}</strong></span>
                  {shipment.deliveryType === "TO_ADDRESS" && shipment.deliveryAddress && (
                    <span>{t("deliveries.destination")}: <strong>{shipment.deliveryAddress}</strong></span>
                  )}
                  {shipment.deliveryType === "TO_OFFICE" && shipment.destinationOfficeId && (
                    <span>{t("deliveries.destination")}: <strong>{officeName(data, shipment.destinationOfficeId)}</strong></span>
                  )}
                  <span>{t("shipments.colDate")}: <strong>{shipment.sentDate}</strong></span>
                </div>
                <div className="status-stepper">
                  {STATUS_STEPS.map((step, i) => {
                    const labelKey = { REGISTERED: "stepRegistered", IN_TRANSIT: "stepTransit", DELIVERED: "stepDelivered" }[step];
                    return (
                      <div key={step} className={`step ${i <= stepIndex ? "done" : ""} ${i === stepIndex ? "active" : ""}`}>
                        <div className="step-dot" />
                        {i < STATUS_STEPS.length - 1 && <div className="step-line" />}
                        <span className="step-label">{t(`deliveries.${labelKey}`)}</span>
                      </div>
                    );
                  })}
                </div>
                {shipment.status === "IN_TRANSIT" && (
                  <div className="courier-info">
                    {courier ? (
                      <span>{t("deliveries.courierAt")}: <strong>{courier.name}</strong> ({courier.lat.toFixed(4)}, {courier.lng.toFixed(4)})</span>
                    ) : (
                      <span className="muted">{t("deliveries.courierUnknown")}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h3 className="section-label" style={{ marginTop: "2rem" }}>{t("deliveries.history")}</h3>
      {history.length === 0 ? (
        <p className="muted">{t("deliveries.noHistory")}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("deliveries.colId")}</th>
                <th>{t("deliveries.colFrom")}</th>
                <th>{t("deliveries.colStatus")}</th>
                <th>{t("deliveries.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((shipment) => (
                <tr key={shipment.id}>
                  <td>#{shipment.id}</td>
                  <td>{clientName(data, shipment.senderClientId)}</td>
                  <td><span className={`status ${shipment.status}`}>{t(`labels.${shipment.status}`)}</span></td>
                  <td>{shipment.sentDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ViewTitle>
  );
}

function CrudView({ eyebrow, title, endpoint, fields, data, renderRow, onRefresh, extra = {}, addLabel, stacked = false, onNotify, addSuccess, addError }) {
  const { t } = useTranslation();
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await createResource(endpoint, { ...extra, ...numericForm(form) });
      form.reset();
      await onRefresh();
      onNotify?.(addSuccess, "success");
    } catch (err) {
      onNotify?.(addError ? addError(err) : err.message, "error");
    }
  };
  const remove = async (id) => {
    await deleteResource(endpoint, id);
    await onRefresh();
  };
  return (
    <ViewTitle eyebrow={eyebrow} title={title}>
      <div className="split" style={stacked ? { gridTemplateColumns: "1fr" } : undefined}>
        <form className="form-grid panel" onSubmit={submit}>
          {fields.map((field) => <Field key={field} field={field} />)}
          <button className="wide">{addLabel ?? t("common.add")}</button>
        </form>
        <div className="table-wrap">
          <table>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  {renderRow(item).map((cell, index) => <td key={index}>{cell}</td>)}
                  <td><button className="secondary" onClick={() => remove(item.id)}>{t("common.delete")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ViewTitle>
  );
}

function ShipmentTable({ data, shipments, role, onDeliver, onDelete }) {
  const { t } = useTranslation();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("shipments.colId")}</th>
            <th>{t("shipments.colSender")}</th>
            <th>{t("shipments.colReceiver")}</th>
            <th>{t("shipments.colType")}</th>
            <th>{t("shipments.colPrice")}</th>
            <th>{t("shipments.colStatus")}</th>
            <th>{t("shipments.colDate")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td>{shipment.id}</td>
              <td>{clientName(data, shipment.senderClientId)}</td>
              <td>{clientName(data, shipment.receiverClientId)}</td>
              <td>{t(`labels.${shipment.deliveryType}`)}</td>
              <td>{Number(shipment.price).toFixed(2)} {t("shipments.currency")}</td>
              <td><span className={`status ${shipment.status}`}>{t(`labels.${shipment.status}`)}</span></td>
              <td>{shipment.sentDate}</td>
              <td className="actions">
                {role !== "CLIENT" && shipment.status !== "DELIVERED" && <button onClick={() => onDeliver(shipment.id)}>{t("shipments.markReceived")}</button>}
                {role !== "CLIENT" && <button className="secondary" onClick={() => onDelete(shipment.id)}>{t("common.delete")}</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
