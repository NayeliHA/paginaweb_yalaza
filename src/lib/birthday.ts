export const BIRTHDAY_DISCOUNT_PERCENT = 10;

export function peruToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type)!.value).join("-");
}

export function isBirthDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function anniversary(birthDate: string, year: number) {
  const monthDay = birthDate.slice(5);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  // February 29 birthdays are celebrated on February 28 in non-leap years.
  return monthDay === "02-29" && !leapYear ? "02-28" : monthDay;
}

export function ageOn(birthDate: string | undefined, today = peruToday()): number | undefined {
  if (!isBirthDate(birthDate) || birthDate > today) return undefined;
  const year = Number(today.slice(0, 4));
  return year - Number(birthDate.slice(0, 4)) - (today.slice(5) < anniversary(birthDate, year) ? 1 : 0);
}

export function isBirthday(birthDate: string | undefined, today = peruToday()): boolean {
  return ageOn(birthDate, today) !== undefined && today.slice(5) === anniversary(birthDate!, Number(today.slice(0, 4)));
}

export function birthdayDiscount(subtotal: number, birthDate: string | undefined, today = peruToday()): number {
  return isBirthday(birthDate, today) ? Math.round((subtotal * BIRTHDAY_DISCOUNT_PERCENT / 100 + Number.EPSILON) * 100) / 100 : 0;
}
