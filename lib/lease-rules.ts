// Deposit limits by province, so the lease form can warn before the landlord saves.
// The backend only records what was agreed and does not check provincial law. Only Ontario and Manitoba are coded here.
// Ontario (Residential Tenancies Act, 2006): no damage or pet deposit; only a rent deposit of at most one rental period, used for the last period.
// Manitoba (Residential Tenancies Act, C.C.S.M. c. R119): security deposit at most half a month's rent, pet deposit at most one month's rent.

export interface DepositRule {
  // Short text shown above the deposit fields; empty when the province has no rule coded.
  note: string;
  maxSecurity: number | null;
  maxPet: number | null;
}

const NO_RULE: DepositRule = { note: "", maxSecurity: null, maxPet: null };

// A region can be "ON", "Ontario", "MB" or "Manitoba" depending on how the landlord typed the address.
export function depositRule(region: string | null, monthlyRent: number | null): DepositRule {
  const name = (region ?? "").trim().toLowerCase();
  if (name === "on" || name === "ontario") {
    return {
      note: "Ontario: only a last month's rent deposit is allowed, up to one month's rent. A damage or pet deposit is not allowed.",
      maxSecurity: monthlyRent,
      maxPet: 0,
    };
  }
  if (name === "mb" || name === "manitoba") {
    const half = monthlyRent === null ? null : Math.round(monthlyRent * 50) / 100;
    return {
      note: "Manitoba: a security deposit can be at most half of one month's rent, and a pet deposit at most one month's rent.",
      maxSecurity: half,
      maxPet: monthlyRent,
    };
  }
  return NO_RULE;
}

// Messages for deposits over the limit; empty when everything is within it.
export function depositProblems(rule: DepositRule, security: number | null, pet: number | null): string[] {
  const problems: string[] = [];
  if (rule.maxSecurity !== null && security !== null && security > rule.maxSecurity) {
    problems.push(`The security deposit is over the limit of $${rule.maxSecurity.toFixed(2)}.`);
  }
  if (rule.maxPet !== null && pet !== null && pet > rule.maxPet) {
    problems.push(rule.maxPet === 0 ? "A pet deposit is not allowed in this province." : `The pet deposit is over the limit of $${rule.maxPet.toFixed(2)}.`);
  }
  return problems;
}
