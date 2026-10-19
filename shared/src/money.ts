declare const minorUnitsBrand: unique symbol;

export type MinorUnits = number & {
  readonly [minorUnitsBrand]: "MinorUnits";
};

const MAX_SAFE_MINOR_UNITS = BigInt(Number.MAX_SAFE_INTEGER);

export function minorUnits(value: number): MinorUnits {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Minor-unit amounts must be safe integers.");
  }
  return value as MinorUnits;
}

export function parseGhs(value: string): MinorUnits {
  const match = /^([+-]?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) {
    throw new TypeError("Enter a GHS amount with no more than two decimal places.");
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const whole = BigInt(match[2]!);
  const fraction = BigInt((match[3] ?? "").padEnd(2, "0") || "0");
  const amount = sign * (whole * 100n + fraction);
  if (amount > MAX_SAFE_MINOR_UNITS || amount < -MAX_SAFE_MINOR_UNITS) {
    throw new RangeError("GHS amount exceeds the safe minor-unit range.");
  }
  return minorUnits(Number(amount));
}

export function addMinorUnits(...values: MinorUnits[]): MinorUnits {
  const total = values.reduce((sum, value) => sum + BigInt(minorUnits(value)), 0n);
  if (total > MAX_SAFE_MINOR_UNITS || total < -MAX_SAFE_MINOR_UNITS) {
    throw new RangeError("GHS total exceeds the safe minor-unit range.");
  }
  return minorUnits(Number(total));
}

export function multiplyMinorUnits(
  amount: MinorUnits,
  quantity: number,
): MinorUnits {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError("Quantity must be a non-negative safe integer.");
  }
  const total = BigInt(minorUnits(amount)) * BigInt(quantity);
  if (total > MAX_SAFE_MINOR_UNITS || total < -MAX_SAFE_MINOR_UNITS) {
    throw new RangeError("GHS total exceeds the safe minor-unit range.");
  }
  return minorUnits(Number(total));
}

export function formatGhs(amount: MinorUnits, locale = "en-GH"): string {
  minorUnits(amount);
  const absolute = BigInt(Math.abs(amount));
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  const pattern = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(amount < 0 ? -1.01 : 1.01);
  const integerIndex = pattern.findIndex((part) => part.type === "integer");
  const fractionIndex = pattern.findIndex((part) => part.type === "fraction");
  const decimal = pattern.find((part) => part.type === "decimal")?.value ?? ".";
  const formattedWhole = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(Number(whole));

  return [
    ...pattern.slice(0, integerIndex).map((part) => part.value),
    formattedWhole,
    decimal,
    fraction,
    ...pattern.slice(fractionIndex + 1).map((part) => part.value),
  ].join("");
}
