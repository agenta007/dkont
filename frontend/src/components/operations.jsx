import { useState } from "react";
import { PackagePlus, RefreshCw } from "lucide-react";
import { changeUserRole, createEmployee, createResource, createShipment, createUser, deleteEmployee, deleteResource, deleteShipment, deliverShipment } from "../api.js";
import { labels } from "../constants.js";
import { clientName, fullName, numericForm, officeName } from "../utils/logistics.js";
import { Field, IconButton, Info, Metric, SearchableSelect, Select, ViewTitle } from "./shared.jsx";

export function Dashboard({ data, visibleShipments, currentClient, currentOffice, session, onRefresh }) {
  const open = visibleShipments.filter((shipment) => !["DELIVERED", "CANCELLED"].includes(shipment.status));
  const company = data.companies[0] ?? {};
  const delivered = visibleShipments.filter((shipment) => shipment.status === "DELIVERED");

  return (
    <ViewTitle eyebrow="Операции" title="Текущо състояние" action={<IconButton onClick={onRefresh} icon={RefreshCw}>Обнови</IconButton>}>
      {session.role === "ADMIN" && (
        <div className="metrics">
          <Metric value={data.companies.length} label="логистични компании" />
          <Metric value={data.offices.length} label="общо офиси" />
          <Metric value={data.employees.length} label="общо служители" />
          <Metric value={data.clients.length} label="клиенти" />
        </div>
      )}
      {session.role === "EMPLOYEE" && session.employeeType === "OFFICE_EMPLOYEE" && (
        <div className="metrics">
          <Metric value={visibleShipments.length} label="пратки в офиса" />
          <Metric value={open.length} label="активни заявки" />
          <Metric value={currentOffice?.name ?? "офис"} label="офис" />
          <Metric value={currentOffice?.city ?? "-"} label="град" />
        </div>
      )}
      {session.role === "EMPLOYEE" && session.employeeType === "COURIER" && (
        <div className="metrics">
          <Metric value={visibleShipments.length} label="назначени доставки" />
          <Metric value={open.length} label="за доставяне" />
          <Metric value={delivered.length} label="доставени" />
          <Metric value={currentOffice?.city ?? "-"} label="база" />
        </div>
      )}
      {session.role === "CLIENT" && (
        <div className="metrics">
          <Metric value={visibleShipments.length} label="мои пратки" />
          <Metric value={open.length} label="активни пратки" />
          <Metric value={delivered.length} label="получени" />
          <Metric value={visibleShipments.at(-1)?.sentDate ?? "-"} label="последна пратка" />
        </div>
      )}
      <div className="split">
        <section className="panel">
          <h3>{session.role === "ADMIN" ? "Система" : "Контекст"}</h3>
          <Info rows={session.role === "ADMIN"
            ? [["Име", "Dkont"], ["Назначение", "Управление на логистични компании"], ["Активна компания", company.name ?? "-"], ["Имейл", company.email ?? "-"]]
            : [["Роля", labels[session.employeeType] ?? labels[session.role]], ["Офис", currentOffice?.address ?? "няма"], ["Пратки", visibleShipments.length], ["Активни", open.length]]} />
        </section>
        <section className="panel">
          <h3>{session.role === "CLIENT" && currentClient ? `Клиент: ${fullName(currentClient)}` : "Пратки"}</h3>
          <Info rows={[
            ["Видими пратки", visibleShipments.length],
            ["Активни пратки", open.length],
            ["Последна пратка", visibleShipments.at(-1)?.sentDate ?? "няма"],
          ]} />
        </section>
      </div>
    </ViewTitle>
  );
}

export function Shipments({ data, shipments, role, session, onRefresh }) {
  const canCreateShipment = role === "EMPLOYEE" && session?.employeeType === "OFFICE_EMPLOYEE";

  const saveShipment = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = numericForm(form);
    const registeringEmployee = data.employees.find((employee) => employee.id === Number(session.employeeId));
    const payload = {
      company: { id: registeringEmployee?.companyId ?? data.companies[0]?.id },
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
    <ViewTitle eyebrow="Регистър" title="Пратки">
      {canCreateShipment && (
        <form className="form-grid panel" onSubmit={saveShipment}>
          <SearchableSelect
            name="senderClientId"
            label="Подател"
            items={data.clients}
            render={(client) => `${fullName(client)}${client.phone ? `, ${client.phone}` : ""}`}
            searchText={(client) => [client.phone, fullName(client), client.email].filter(Boolean).join(" ")}
          />
          <Select name="receiverClientId" label="Получател" items={data.clients} render={fullName} />
          <Select name="destinationOfficeId" label="Краен офис" items={data.offices} render={(office) => office.address} />
          <label>Тип доставка<select name="deliveryType"><option value="TO_OFFICE">до офис</option><option value="TO_ADDRESS">до адрес</option></select></label>
          <label>Тегло (кг.)<input name="weight" type="number" step="0.1" min="0.1" defaultValue="1.0" /></label>
          <label className="wide">Адрес<input name="deliveryAddress" /></label>
          <button className="wide"><PackagePlus size={16} /> Добави пратка</button>
        </form>
      )}
      <ShipmentTable data={data} shipments={shipments} role={role} onDeliver={deliver} onDelete={remove} />
    </ViewTitle>
  );
}

export function Companies({ data, onRefresh }) {
  return <CrudView title="Логистични компании" endpoint="companies" fields={["name", "address", "phone", "email"]} data={data.companies} onRefresh={onRefresh} renderRow={(company) => [company.name, company.address, company.phone, company.email]} addLabel="Добави компания" />;
}

export function Clients({ data, selectedCompanyId, onRefresh }) {
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = numericForm(form);
    const user = await createUser({
      username: values.username,
      passwordHash: values.password,
      email: values.email || null,
      firstName: values.firstName,
      lastName: values.lastName,
      role: "CLIENT",
    });
    await createResource("clients", {
      user: { id: user.id },
      phone: values.phone,
    });
    form.reset();
    await onRefresh();
  };

  const remove = async (id) => {
    await deleteResource("clients", id);
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow="Регистър" title="Клиенти">
      <div className="split">
        <form className="form-grid panel" onSubmit={submit}>
          <label>Име<input name="firstName" required /></label>
          <label>Фамилия<input name="lastName" required /></label>
          <label>Потребителско име<input name="username" required /></label>
          <label>Парола<input name="password" type="password" required /></label>
          <label>Имейл<input name="email" type="email" /></label>
          <label>Телефон<input name="phone" required /></label>
          <button className="wide">Добави клиент</button>
        </form>
        <div className="table-wrap">
          <table>
            <tbody>
              {data.clients.map((client) => (
                <tr key={client.id}>
                  <td>{fullName(client)}</td>
                  <td>{client.phone}</td>
                  <td>{client.email}</td>
                  <td><button className="secondary" onClick={() => remove(client.id)}>Изтрий</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ViewTitle>
  );
}

export function Employees({ data, selectedCompanyId, onRefresh }) {
  const [workerCompanyId, setWorkerCompanyId] = useState(Number(selectedCompanyId) || data.companies[0]?.id || "");
  const companyOffices = data.offices.filter((office) => office.companyId === Number(workerCompanyId));

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = numericForm(form);
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
  };
  const remove = async (id) => {
    await deleteEmployee(id);
    await onRefresh();
  };

  return (
    <ViewTitle eyebrow="Регистър" title="Служители">
      <div className="split" style={{ gridTemplateColumns: "1fr" }}>
        <form className="form-grid panel" onSubmit={submit}>
          <label>
            Компания
            <select name="companyId" value={workerCompanyId} onChange={(event) => setWorkerCompanyId(Number(event.target.value))} required>
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label>Име<input name="firstName" required /></label>
          <label>Фамилия<input name="lastName" required /></label>
          <label>Потребителско име<input name="username" required /></label>
          <label>Парола<input name="password" type="password" required /></label>
          <label>Имейл<input name="email" type="email" required /></label>
          <label>
            Офис адрес
            <select name="officeId" required>
              {companyOffices.map((office) => (
                <option key={office.id} value={office.id}>{office.address}</option>
              ))}
            </select>
          </label>
          <label>
            Тип
            <select name="employeeType">
              <option value="OFFICE_EMPLOYEE">офис служител</option>
              <option value="COURIER">куриер</option>
            </select>
          </label>
          <button className="wide">Добави служител</button>
        </form>
        <div className="table-wrap">
          <table>
            <tbody>
              {data.employees.map((employee) => {
                const user = data.users.find((u) => u.id === employee.userId);
                return (
                  <tr key={employee.id}>
                    <td>{fullName(employee)}</td>
                    <td>{labels[employee.employeeType]}</td>
                    <td>{officeName(data, employee.officeId)}</td>
                    <td>
                      <select
                        value={user?.role ?? ""}
                        onChange={async (e) => {
                          await changeUserRole(employee.userId, e.target.value);
                          await onRefresh();
                        }}
                      >
                        <option value="ADMIN">Администратор</option>
                        <option value="EMPLOYEE">Служител</option>
                        <option value="CLIENT">Клиент</option>
                      </select>
                    </td>
                    <td><button className="secondary" onClick={() => remove(employee.id)}>Изтрий</button></td>
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
    <ViewTitle eyebrow="Регистър" title="Офиси">
      <div className="split">
        <form className="form-grid panel" onSubmit={submit}>
          <label>
            Компания
            <select name="companyId" value={officeCompanyId} onChange={(event) => setOfficeCompanyId(Number(event.target.value))} required>
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <label>Град<input name="city" required /></label>
          <label className="wide">Адрес<input name="address" required /></label>
          <label>Телефон<input name="phone" /></label>
          <button className="wide">Добави</button>
        </form>
        <div className="table-wrap">
          <table>
            <tbody>
              {companyOffices.map((office) => (
                <tr key={office.id}>
                  <td>{office.city}</td>
                  <td>{office.address}</td>
                  <td>{office.phone}</td>
                  <td><button className="secondary" onClick={() => remove(office.id)}>Изтрий</button></td>
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
  const [dates, setDates] = useState({ from: "", to: "" });
  const report = buildReport(data, dates);
  const loadReport = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    setDates(payload);
  };

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

function CrudView({ title, endpoint, fields, data, renderRow, onRefresh, extra = {}, addLabel = "Добави" }) {
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    await createResource(endpoint, { ...extra, ...numericForm(form) });
    form.reset();
    await onRefresh();
  };
  const remove = async (id) => {
    await deleteResource(endpoint, id);
    await onRefresh();
  };
  return (
    <ViewTitle eyebrow="Регистър" title={title}>
      <div className="split">
        <form className="form-grid panel" onSubmit={submit}>{fields.map((field) => <Field key={field} field={field} />)}<button className="wide">{addLabel}</button></form>
        <div className="table-wrap"><table><tbody>{data.map((item) => <tr key={item.id}>{renderRow(item).map((cell, index) => <td key={index}>{cell}</td>)}<td><button className="secondary" onClick={() => remove(item.id)}>Изтрий</button></td></tr>)}</tbody></table></div>
      </div>
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
