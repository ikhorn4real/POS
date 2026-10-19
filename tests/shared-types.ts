import { roleCan } from "@counterpoint/shared/permissions";
import {
  addMinorUnits,
  formatGhs,
  parseGhs,
  type MinorUnits,
} from "@counterpoint/shared/money";

const allowed: boolean = roleCan("manager", "inventory:write");
const total: MinorUnits = addMinorUnits(parseGhs("12.40"), parseGhs("0.60"));
const receiptTotal: string = formatGhs(total);

// @ts-expect-error Store management is restricted to owners.
roleCan("cashier", "stores:write");

void [allowed, receiptTotal];
