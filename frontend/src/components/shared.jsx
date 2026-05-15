import { useMemo, useState } from "react";
import dkontLogo from "../assets/images/dkont-logo.png";

export function ViewTitle({ eyebrow, title, action, children }) {
  return <section><div className="section-heading"><div><h2>{title}</h2></div>{action}</div>{children}</section>;
}

export function BrandHeader({ eyebrow, title }) {
  return (
    <div className="brand">
      <img src={dkontLogo} alt="Dkont logo" className="brand-logo" />
    </div>
  );
}

export function Metric({ value, label }) {
  return <article><strong>{value}</strong><span>{label}</span></article>;
}

export function Info({ rows }) {
  return <div className="info-list">{rows.map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div>;
}

export function IconButton({ icon: Icon, children, ...props }) {
  return <button {...props}><Icon size={16} /> {children}</button>;
}

export function Select({ name, label, items, render }) {
  return <label>{label}<select name={name}>{items.map((item) => <option key={item.id} value={item.id}>{render(item)}</option>)}</select></label>;
}

export function SearchableSelect({ name, label, items, render, searchText }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) => searchText(item).toLowerCase().includes(normalizedQuery));
  }, [items, normalizedQuery, searchText]);

  return (
    <label>
      {label}
      <input
        type="search"
        placeholder="Търси по телефон"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <select name={name} required>
        {filteredItems.map((item) => (
          <option key={item.id} value={item.id}>{render(item)}</option>
        ))}
      </select>
    </label>
  );
}

export function Field({ field }) {
  if (field === "employeeType") return <label>Тип<select name="employeeType"><option value="OFFICE_EMPLOYEE">офис служител</option><option value="COURIER">куриер</option></select></label>;
  const labelsByField = { firstName: "Име", lastName: "Фамилия", phone: "Телефон", email: "Имейл", address: "Адрес", userId: "Потребител ID", officeId: "Офис ID", name: "Име", city: "Град" };
  return <label>{labelsByField[field] ?? field}<input name={field} type={field.endsWith("Id") ? "number" : field === "email" ? "email" : "text"} required /></label>;
}
