import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(fs.readFileSync("src/lib/business-analytics.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const analyticsModule = { exports: {} };
vm.runInNewContext("(function(exports) {" + source + "})", {})(analyticsModule.exports);
const { summarizeDay, summarizeWeek, stockSummary, readAnalyticsSettings, limaDate, weekMonday } = analyticsModule.exports;
const product = { id: "p1", name: "Alitas", price: 16, categoryId: "cat-alitas" };
const settings = { costs: { p1: { ingredients: 7, packaging: 1 } }, weeklyExpenses: 10, lowStock: 10, targetStock: 30 };
const order = (overrides = {}) => ({ id: "YZ-1", active: true, createdAt: "2026-10-12T18:00:00Z", status: "delivered", items: [{ productId: "p1", name: "Alitas", unitPrice: 16, quantity: 2 }], ...overrides });

test("weekly totals distinguish pending orders from completed sales and subtract unit costs and expenses", () => {
  const result = summarizeWeek([order(), order({ id: "pending", status: "pending" })], [product], settings, "2026-10-12");
  assert.equal(result.count, 2);
  assert.equal(result.completed, 1);
  assert.equal(result.registeredAmount, 64);
  assert.equal(result.sales, 32);
  assert.equal(result.cost, 16);
  assert.equal(result.gross, 16);
  assert.equal(result.net, 6);
  assert.equal(result.margin, 50);
  assert.equal(result.sold[0].quantity, 2);
});
test("Peru dates respect midnight boundary; weekends and deleted/demo orders are excluded", () => {
  assert.equal(limaDate("2026-10-13T03:00:00Z"), "2026-10-12");
  assert.equal(weekMonday("2026-10-18"), "2026-10-12");
  const entries = [order(), order({ id: "YZ-DEMO-001" }), order({ active: false }), order({ createdAt: "2026-10-17T18:00:00Z" })];
  assert.equal(summarizeWeek(entries, [product], settings, "2026-10-12").count, 1);
  assert.equal(summarizeWeek(entries, [product], settings, "2026-10-12", true).count, 2);
});
test("busiest day reports ties and zero-sales weeks preserve operating losses", () => {
  const tied = summarizeWeek([order(), order({ createdAt: "2026-10-13T18:00:00Z" })], [product], settings, "2026-10-12");
  assert.equal(tied.busiest, "Lunes y Martes");
  const empty = summarizeWeek([], [product], settings, "2026-10-12");
  assert.equal(empty.busiest, "Sin pedidos");
  assert.equal(empty.margin, 0);
  assert.equal(empty.net, -10);
});
test("stock alerts separate zero from low stock, include the threshold and suggest replenishment", () => {
  const products = [product, { ...product, id: "p2" }, { ...product, id: "p3" }];
  const stock = stockSummary(products, { p1: 0, p2: 10, p3: 11 }, settings);
  assert.equal(stock.empty.length, 1);
  assert.equal(stock.low.length, 1);
  assert.equal(stock.empty[0].replenish, 30);
  assert.equal(stock.low[0].replenish, 20);
  assert.equal(stock.units, 21);
});
test("invalid saved settings fall back safely and unknown product costs raise a warning", () => {
  assert.equal(readAnalyticsSettings("bad json").weeklyExpenses, 250);
  const parsed = readAnalyticsSettings(JSON.stringify({ weeklyExpenses: -1, lowStock: 50, targetStock: 20, costs: { p1: { ingredients: -1, packaging: 0 } } }));
  assert.equal(parsed.targetStock, 51);
  assert.equal(Object.keys(parsed.costs).length, 0);
  assert.equal(summarizeWeek([order()], [], { ...settings, costs: {} }, "2026-10-12").missingCosts, true);
});

test("daily closing includes weekend deliveries by completion date and excludes pending/demo/inactive sales", () => {
  const completed = order({ verifiedAt: "2026-10-18T03:00:00Z", deliveryFee: 3, total: 35, paymentMethod: "cash", fulfillmentType: "delivery" });
  const pending = order({ id: "pending", createdAt: "2026-10-17T18:00:00Z", status: "pending", total: 32 });
  const result = summarizeDay([completed, pending, { ...completed, active: false }, { ...completed, id: "YZ-DEMO-001" }], [product], settings, "2026-10-17");
  assert.equal(result.registered, 1);
  assert.equal(result.completed, 1);
  assert.equal(result.pending, 1);
  assert.equal(result.sales, 32);
  assert.equal(result.total, 35);
  assert.equal(result.delivery, 3);
  assert.equal(result.payments.cash, 35);
  assert.equal(result.gross, 16);
  assert.equal(result.average, 35);
  assert.equal(result.sold[0].quantity, 2);
  assert.equal(summarizeDay([], [product], settings, "2026-10-17").average, 0);
  assert.equal(summarizeDay([completed], [product], settings, "2026-10-12").completed, 0);
});
