export function filterCustomers(customers, query) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return customers;

  return customers.filter((customer) =>
    [customer.name, customer.phone, customer.email]
      .some((value) => String(value ?? "").toLocaleLowerCase().includes(normalized)),
  );
}
