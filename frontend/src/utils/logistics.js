export function numericForm(form) {
  const data = Object.fromEntries(new FormData(form));
  Object.keys(data).forEach((key) => {
    if (key.endsWith("Id") || key === "weight") data[key] = Number(data[key]);
  });
  return data;
}

export function fullName(item) {
  return `${item.firstName} ${item.lastName}`;
}

export function clientName(data, id) {
  const client = data.clients.find((item) => item.id === Number(id));
  return client ? fullName(client) : `#${id}`;
}

export function officeName(data, id) {
  const office = data.offices.find((item) => item.id === Number(id));
  return office ? `${office.address}, ${office.city}` : `#${id}`;
}
