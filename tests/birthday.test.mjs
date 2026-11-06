import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  const resolved = path.resolve(file);
  if (cache.has(resolved)) return cache.get(resolved).exports;
  const module = { exports: {} }; cache.set(resolved, module);
  const source = ts.transpileModule(fs.readFileSync(resolved, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const importer = name => name.startsWith("node:") ? require(name) : load((name.startsWith("@/") ? path.join("src", name.slice(2)) : path.resolve(path.dirname(resolved), name)) + ".ts");
  vm.runInThisContext("(function(require,module,exports){" + source + "\n})", { filename: resolved })(importer, module, module.exports);
  return module.exports;
}
const { ageOn, isBirthDate, isBirthday, birthdayDiscount, peruToday } = load("src/lib/birthday.ts");
const { initialData, executeCommand, publicSnapshot } = load("src/server/shared-domain.ts");

test("birth dates validate real dates, reject future dates and calculate age on the birthday", () => {
  assert.equal(isBirthDate("2001-02-29"), false);
  assert.equal(isBirthDate("2000-02-29"), true);
  assert.equal(isBirthDate("2000-13-01"), false);
  assert.equal(ageOn("2000-11-06", "2026-11-05"), 25);
  assert.equal(ageOn("2000-11-06", "2026-11-06"), 26);
  assert.equal(ageOn("2027-01-01", "2026-11-06"), undefined);
  assert.equal(peruToday(new Date("2026-11-07T04:59:59Z")), "2026-11-06");
});
test("February 29 birthdays use February 28 only in non-leap years", () => {
  assert.equal(isBirthday("2000-02-29", "2026-02-28"), true);
  assert.equal(ageOn("2000-02-29", "2026-02-28"), 26);
  assert.equal(isBirthday("2000-02-29", "2028-02-28"), false);
  assert.equal(isBirthday("2000-02-29", "2028-02-29"), true);
  assert.equal(birthdayDiscount(16, "2000-11-06", "2026-11-06"), 1.6);
  assert.equal(birthdayDiscount(16, "2000-11-06", "2026-11-07"), 0);
});
test("server stores birth date, calculates age, applies birthday pricing and prevents date changes", () => {
  const data = initialData();
  const today = peruToday();
  const birthDate = `2000-${today.slice(5)}`;
  const registration = { name: "Prueba", lastName: "Cumpleaños", birthDate, email: "birthday@example.test", phone: "912345678", password: "example123" };
  const { token } = executeCommand(data, "", { action: "register", args: [registration] });
  const snapshot = publicSnapshot(data, token);
  assert.equal(snapshot.session.birthDate, birthDate);
  assert.equal(snapshot.session.age, ageOn(birthDate));
  assert.equal(snapshot.session.birthdayToday, true);
  const input = { customer: { name: "María José Pérez", phone: "912345678" }, fulfillmentType: "pickup", paymentMethod: "cash", discount: 99999 };
  const id = Object.keys(data.inventory)[0];
  const { result: order } = executeCommand(data, token, { action: "createOrder", requestId: "birthday-order-001", args: [input, [{ product: { id }, quantity: 1 }]] });
  assert.equal(order.customer.name, "María José Pérez");
  assert.equal(order.customer.id, snapshot.session.userId);
  assert.equal(publicSnapshot(data, token).session.name, "Prueba");
  assert.throws(() => executeCommand(data, token, { action: "createOrder", requestId: "invalid-recipient-001", args: [{ ...input, customer: { ...input.customer, name: " " } }, [{ product: { id }, quantity: 1 }]] }), /nombre para el pedido/);
  assert.equal(order.discount, Math.round(order.subtotal * 10) / 100);
  assert.equal(order.total, Math.round((order.subtotal - order.discount) * 100) / 100);
  assert.throws(() => executeCommand(data, token, { action: "setBirthDate", requestId: "birthday-change-001", args: ["1999-01-01"] }), /ya fue registrada/);
  assert.throws(() => executeCommand(data, "", { action: "register", args: [{ ...registration, email: "future@example.test", birthDate: "2999-01-01" }] }), /fecha de nacimiento válida/);
  assert.throws(() => executeCommand(data, "", { action: "register", args: [{ ...registration, email: "young@example.test", birthDate: `${Number(today.slice(0,4))-12}-${today.slice(5)}` }] }), /al menos 13/);
});
