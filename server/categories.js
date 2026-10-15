export function validateCategoryInput(input) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 60) {
    const error = new Error("Enter a category name up to 60 characters.");
    error.status = 400;
    error.code = "INVALID_CATEGORY";
    throw error;
  }
  return { name };
}

export function categoryResponse(category) {
  return {
    id: category.id,
    name: category.name,
    productCount: Number(category.product_count ?? 0),
  };
}

export function categoryNameConflict(error) {
  return error.code === "23505" && error.constraint === "categories_name_ci_key";
}
