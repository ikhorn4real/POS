export function validateSupplierInput(input) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const contactName = typeof input?.contactName === "string" ? input.contactName.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const phone = typeof input?.phone === "string" ? input.phone.trim() : "";
  const validEmail = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (
    !name ||
    name.length > 120 ||
    contactName.length > 120 ||
    email.length > 254 ||
    phone.length > 40 ||
    !validEmail
  ) {
    const error = new Error("Enter a valid supplier name and contact details.");
    error.status = 400;
    error.code = "INVALID_SUPPLIER";
    throw error;
  }

  return {
    name,
    contactName: contactName || null,
    email: email || null,
    phone: phone || null,
  };
}

export function supplierResponse(supplier) {
  return {
    id: supplier.id,
    name: supplier.name,
    contactName: supplier.contact_name ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    createdAt: new Date(supplier.created_at).getTime(),
  };
}

export function supplierNameConflict(error) {
  return error.code === "23505" && error.constraint === "suppliers_name_ci_key";
}
