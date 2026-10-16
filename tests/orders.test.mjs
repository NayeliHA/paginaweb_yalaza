import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
function runtime(shared = new Map([["yalaza:order-data:v2", JSON.stringify({ orders: [], inventory: {}, demoOrdersSeeded: true })]])) {
  const storage = values => ({
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  });
  const listeners = new Set();
  const context = vm.createContext({
    process: { env: {} },
    localStorage: storage(shared), sessionStorage: storage(new Map()),
    window: {
      addEventListener: (name, callback) => { if (name === "storage") listeners.add(callback); },
      removeEventListener: (name, callback) => { if (name === "storage") listeners.delete(callback); },
    },
  });
  const cache = new Map();
  function load(file) {
    const resolved = path.resolve(root, file);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const loadedModule = { exports: {} };
    cache.set(resolved, loadedModule);
    const source = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const importModule = specifier => {
      let target = specifier.startsWith("@/") ? path.join(root, "src", specifier.slice(2)) : path.resolve(path.dirname(resolved), specifier);
      if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) target = fs.existsSync(target + ".ts") ? target + ".ts" : path.join(target, "index.ts");
      return load(target);
    };
    vm.runInContext("(function(require, module, exports) {\n" + source + "\n})", context, { filename: resolved })(importModule, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  const authState = load("src/services/auth-state.service.ts");
  const customerState = load("src/services/customer-state.service.ts");
  authState.subscribeToAuthState(() => {});
  customerState.subscribeToCustomerState(() => {});
  return {
    shared, authState, customerState,
    auth: load("src/services/auth.service.ts").authFacade,
    orders: load("src/services/order.service.ts").orderFacade,
    products: load("src/repositories/catalog.repository.ts").getProducts(),
    sync: () => listeners.forEach(callback => callback({ key: "yalaza:order-data:v2" })),
  };
}
function loginAdmin(app) {
  app.auth.login({ role: "admin", email: "admin@yalaza.pe", password: "admin123" });
}
function input(app, fulfillmentType = "pickup") {
  const customer = app.auth.getUsers().find(user => user.id === "demo-customer-01");
  return { customer, fulfillmentType, paymentMethod: "cash",
    ...(fulfillmentType === "delivery" ? { delivery: { district: "Lima", address: "Calle de ejemplo 123" } } : {}) };
}
function cart(app, quantity = 2) {
  return [{ product: app.products[0], quantity }];
}

test("startup inserts 20 demo customers once and preserves existing users", () => {
  const app = runtime();
  assert.equal(app.auth.getUsers().filter(user => user.role === "customer").length, 20);
  assert.equal(app.auth.getUsers().find(user => user.id === "demo-customer-05").lastName, "Herrera Albino");
  const reloaded = runtime(app.shared);
  assert.equal(reloaded.auth.getUsers().filter(user => user.role === "customer").length, 20);
  app.auth.registerCustomer({name: "Cliente", lastName: "Nuevo", age: 24, email: "nuevo@example.test", phone: "912345678", password: "demo123"});
  assert.equal(runtime(app.shared).auth.getUsers().filter(user => user.role === "customer").length, 21);
});

test("create, edit and delete commit stock correctly and persist across reload", () => {
  const app = runtime(); loginAdmin(app);
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 100);
  const order = app.orders.saveAdminOrder(input(app), cart(app, 3));
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 97);
  const edited = app.orders.saveAdminOrder(input(app), cart(app, 5), order.id);
  assert.equal(edited.id, order.id);
  assert.equal(edited.securityCode, order.securityCode);
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 95);
  assert.equal(runtime(app.shared).customerState.getCustomerSnapshot().inventory[app.products[0].id], 95);
  app.orders.saveAdminOrder(input(app), cart(app, 1), order.id);
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 99);
  app.orders.deleteAdminOrder(order.id);
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 100);
  assert.equal(app.orders.loadOrders().length, 1);
  assert.equal(app.orders.loadOrders()[0].active, false);
  assert.ok(app.orders.loadOrders()[0].deactivatedAt);
});

test("insufficient stock and invalid quantities leave both orders and stock untouched", () => {
  const app = runtime(); loginAdmin(app);
  for (const quantity of [101, -1, 1.5, 0, NaN]) {
    assert.throws(() => app.orders.saveAdminOrder(input(app), cart(app, quantity)));
  }
  const order = app.orders.saveAdminOrder(input(app), cart(app, 99));
  const before = app.shared.get("yalaza:order-data:v2");
  assert.throws(() => app.orders.saveAdminOrder(input(app), cart(app, 101), order.id), /Stock insuficiente/);
  assert.equal(app.shared.get("yalaza:order-data:v2"), before);
  app.orders.saveAdminOrder(input(app), cart(app, 1));
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 0);
  assert.throws(() => app.orders.saveAdminOrder(input(app), cart(app, 1)), /Stock insuficiente/);
});

test("customer checkout uses the same inventory and admin-only operations reject customers", () => {
  const app = runtime();
  app.auth.login({ role: "customer", email: "cliente01@yalaza.test", password: "cliente123" });
  assert.throws(() => app.orders.saveAdminOrder(input(app), cart(app)), /administrador/);
  assert.throws(() => app.orders.updateStock(app.products[0].id, 10), /administrador/);
  const order = app.orders.createOrder(input(app), cart(app, 2));
  assert.equal(order.customer.id, "demo-customer-01");
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 98);
});

test("independent sessions share status changes between admin, delivery and customer tabs", () => {
  const admin = runtime(); loginAdmin(admin);
  const client = runtime(admin.shared);
  client.auth.login({ role: "customer", email: "cliente01@yalaza.test", password: "cliente123" });
  const delivery = runtime(admin.shared);
  delivery.auth.login({ role: "delivery", email: "delivery@yalaza.pe", password: "delivery123" });
  const order = admin.orders.saveAdminOrder(input(admin, "delivery"), cart(admin, 2));
  client.sync();
  assert.equal(client.customerState.getCustomerSnapshot().orders[0].customer.id, client.authState.getAuthSnapshot().session.userId);
  admin.orders.acceptOrder(order.id, "Administrador");
  assert.throws(() => admin.orders.deleteAdminOrder(order.id), /pendientes/);
  assert.throws(() => admin.orders.saveAdminOrder(input(admin), cart(admin), order.id), /pendientes/);
  admin.orders.advanceOrderStatus(order.id);
  client.sync(); assert.equal(client.customerState.getCustomerSnapshot().orders[0].status, "preparing");
  admin.orders.advanceOrderStatus(order.id);
  client.sync(); assert.equal(client.customerState.getCustomerSnapshot().orders[0].status, "prepared");
  delivery.orders.advanceOrderStatus(order.id);
  client.sync(); assert.equal(client.customerState.getCustomerSnapshot().orders[0].status, "on_the_way");
  assert.equal(delivery.orders.verifyOrder(order.id, "wrong"), null);
  delivery.orders.verifyOrder(order.id, order.securityCode);
  client.sync(); assert.equal(client.customerState.getCustomerSnapshot().orders[0].status, "delivered");
  assert.equal(admin.authState.getAuthSnapshot().session.role, "admin");
  assert.equal(client.authState.getAuthSnapshot().session.role, "customer");
  assert.equal(client.customerState.getCustomerSnapshot().inventory[admin.products[0].id], 98);
});

test("pickup follows its own states and an unknown client cannot be selected", () => {
  const app = runtime(); loginAdmin(app);
  assert.throws(() => app.orders.saveAdminOrder({ ...input(app), customer: { id: "unknown" } }, cart(app)), /registrado/);
  const order = app.orders.saveAdminOrder(input(app), cart(app));
  app.orders.advanceOrderStatus(order.id);
  app.orders.advanceOrderStatus(order.id);
  app.orders.advanceOrderStatus(order.id);
  assert.equal(app.orders.loadOrders()[0].status, "ready_for_pickup");
  app.orders.verifyOrder(order.id, order.securityCode);
  assert.equal(app.orders.loadOrders()[0].status, "picked_up");
  assert.equal(app.orders.advanceOrderStatus(order.id), null);
});

test("logical deletion preserves the order, blocks editing and restores without double stock changes", () => {
  const app = runtime(); loginAdmin(app);
  const order = app.orders.saveAdminOrder(input(app), cart(app, 3));
  app.orders.deleteAdminOrder(order.id);
  app.orders.deleteAdminOrder(order.id);
  assert.equal(app.orders.loadOrders().length, 1);
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 100);
  assert.throws(() => app.orders.saveAdminOrder(input(app), cart(app, 2), order.id), /Restaura/);
  assert.equal(app.orders.acceptOrder(order.id, "Admin"), null);
  assert.equal(app.orders.advanceOrderStatus(order.id), null);
  app.orders.restoreAdminOrder(order.id);
  app.orders.restoreAdminOrder(order.id);
  const restored = app.orders.loadOrders()[0];
  assert.equal(restored.id, order.id);
  assert.equal(restored.securityCode, order.securityCode);
  assert.equal(restored.active, true);
  assert.equal(restored.deactivatedAt, undefined);
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 97);
  app.orders.saveAdminOrder(input(app), cart(app, 4), order.id);
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 96);
});

test("restoration checks stock atomically and is only available to admin", () => {
  const app = runtime(); loginAdmin(app);
  const order = app.orders.saveAdminOrder(input(app), cart(app, 4));
  app.orders.deleteAdminOrder(order.id);
  app.orders.updateStock(app.products[0].id, 2);
  const before = app.shared.get("yalaza:order-data:v2");
  assert.throws(() => app.orders.restoreAdminOrder(order.id), /Stock insuficiente/);
  assert.equal(app.shared.get("yalaza:order-data:v2"), before);
  assert.equal(app.orders.loadOrders()[0].active, false);
  app.auth.login({role: "customer", email: "cliente01@yalaza.test", password: "cliente123"});
  assert.throws(() => app.orders.restoreAdminOrder(order.id), /administrador/);
});

test("startup seeds five customer orders once and never reactivates an inactive example", () => {
  const app = runtime(new Map()); loginAdmin(app);
  const examples = app.orders.loadOrders();
  assert.equal(examples.length, 5);
  assert.equal(new Set(examples.map(order => order.customer.id)).size, 5);
  assert.equal(examples[4].customer.lastName, "Herrera Albino");
  assert.equal(app.customerState.getCustomerSnapshot().inventory[app.products[0].id], 99);
  assert.equal(runtime(app.shared).orders.loadOrders().length, 5);
  app.orders.deleteAdminOrder("YZ-DEMO-001");
  const before = app.shared.get("yalaza:order-data:v2");
  const reloaded = runtime(app.shared);
  assert.equal(reloaded.orders.loadOrders().length, 5);
  assert.equal(reloaded.orders.loadOrders().find(order => order.id === "YZ-DEMO-001").active, false);
  assert.equal(app.shared.get("yalaza:order-data:v2"), before);
});
