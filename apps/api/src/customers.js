export function validateCustomerInput(input) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const phone = typeof input?.phone === "string" ? input.phone.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const notes = typeof input?.notes === "string" ? input.notes.trim() : "";
  const validEmail = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (
    !name ||
    name.length > 120 ||
    phone.length > 40 ||
    email.length > 254 ||
    notes.length > 500 ||
    !validEmail
  ) {
    const error = new Error("Enter a valid customer name and contact details.");
    error.status = 400;
    error.code = "INVALID_CUSTOMER";
    throw error;
  }
  return { name, phone: phone || null, email: email || null, notes: notes || null };
}

export function customerResponse(customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    notes: customer.notes ?? "",
    createdAt: new Date(customer.created_at).getTime(),
  };
}

export function customerIdFromInput(value) {
  if (value === null || value === undefined || value === "") return null;
  if (Number.isSafeInteger(value) && value > 0) return value;
  const error = new Error("Select a customer from the customer list.");
  error.status = 400;
  error.code = "INVALID_CUSTOMER";
  throw error;
}

