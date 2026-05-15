export function Field({ field }) {
  if (field === "employeeType") return <label>Тип<select name="employeeType"><option value="OFFICE_EMPLOYEE">офис служител</option><option value="COURIER">куриер</option></select></label>;
  const labelsByField = { firstName: "Име", lastName: "Фамилия", phone: "Телефон", email: "Имейл", address: "Адрес", userId: "Потребител ID", officeId: "Офис ID", name: "Име", city: "Град" };
  return <label>{labelsByField[field] ?? field}<input name={field} type={field.endsWith("Id") ? "number" : field === "email" ? "email" : "text"} required /></label>;
}
