import { createHash, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { AuthSession, CartItem, CreateOrderInput, CustomerOrder, RegisteredUser } from "@/models";
import { getProducts } from "@/repositories/catalog.repository";
import { demoCustomers } from "@/lib/demo-customers";
import { createDemoOrders } from "@/lib/demo-orders";
import { businessConfig } from "@/lib/business-config";
import { readAnalyticsSettings, type AnalyticsSettings } from "@/lib/business-analytics";
import { quoteDelivery, readDeliverySettings, type DeliverySettings } from "@/lib/delivery-settings";
import { getNextOrderStatus } from "@/patterns/behavioral/order-state";
import { ageOn, birthdayDiscount, isBirthday, BIRTHDAY_DISCOUNT_PERCENT } from "@/lib/birthday";

type User = Omit<RegisteredUser, "password"> & { passwordHash: string };
export interface SharedData {
  users: User[];
  sessions: { hash: string; userId: string; expires: number }[];
  orders: CustomerOrder[];
  inventory: Record<string, number>;
  deliverySettings: DeliverySettings;
  analyticsSettings: AnalyticsSettings;
  receipts: { key: string; userId: string; result: unknown }[];
}
export type Command = { action: string; args?: unknown[]; requestId?: string };
export class DomainError extends Error { constructor(message: string, public status = 400) { super(message); } }
const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function passwordMatches(password: string, saved: string) {
  const [salt, hash] = saved.split(":");
  const expected = Buffer.from(hash, "hex");
  return timingSafeEqual(scryptSync(password, salt, 64), expected);
}
export function initialData(): SharedData {
  const base = { lastName: "Yalaza", age: 25, createdAt: new Date().toISOString() };
  const users: RegisteredUser[] = [
    { ...base, id: "user-admin", role: "admin", name: "Administrador", email: "admin@yalaza.pe", phone: "999999991", password: process.env.YALAZA_ADMIN_PASSWORD || "admin123" },
    { ...base, id: "user-delivery", role: "delivery", name: "Delivery", email: "delivery@yalaza.pe", phone: "999999992", password: process.env.YALAZA_DELIVERY_PASSWORD || "delivery123" },
    ...demoCustomers,
  ];
  const orders = createDemoOrders(users, getProducts());
  const inventory = Object.fromEntries(getProducts().map(p => [p.id, 100]));
  for (const order of orders) for (const item of order.items) inventory[item.productId] -= item.quantity;
  const hashes = new Map<string, string>();
  return { users: users.map(({ password, ...user }) => {
    if (!hashes.has(password)) hashes.set(password, hashPassword(password));
    return { ...user, passwordHash: hashes.get(password)! };
  }), orders, inventory, sessions: [], receipts: [], deliverySettings: readDeliverySettings(null), analyticsSettings: readAnalyticsSettings(null) };
}
function sessionFor(user: User): AuthSession {
  return { userId: user.id, role: user.role, name: user.name, lastName: user.lastName, email: user.email, birthDate: user.birthDate, age: ageOn(user.birthDate), birthdayToday: isBirthday(user.birthDate) };
}
export function currentUser(data: SharedData, token: string): User | undefined {
  const session = data.sessions.find(s => s.hash === hashToken(token) && s.expires > Date.now());
  return data.users.find(u => u.id === session?.userId);
}
export function publicSnapshot(data: SharedData, token: string) {
  const user = currentUser(data, token);
  const orders = !user ? [] : data.orders.filter(order => user.role === "admin" || (user.role === "delivery" ? order.fulfillmentType === "delivery" && order.active !== false : order.customer.id === user.id));
  return {
    session: user ? sessionFor(user) : null,
    users: user?.role === "admin" ? data.users.filter(u => u.role === "customer").map(({ passwordHash: _, ...u }) => ({ ...u, age: ageOn(u.birthDate), password: "" })) : [],
    orders: orders.map(order => user?.role === "delivery" ? { ...order, securityCode: "" } : order),
    inventory: data.inventory, deliverySettings: data.deliverySettings,
    analyticsSettings: user?.role === "admin" ? data.analyticsSettings : readAnalyticsSettings(null),
  };
}
function text(value: unknown, label: string, min = 1, max = 250): string {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) throw new DomainError(`Revisa ${label}.`);
  return value.trim();
}
function requireRole(user: User | undefined, ...roles: string[]): asserts user is User {
  if (!user) throw new DomainError("Inicia sesión para continuar.", 401);
  if (!roles.includes(user.role)) throw new DomainError("No tienes permiso para esta operación.", 403);
}
function buildOrder(data: SharedData, user: User, raw: unknown, rawCart: unknown): CustomerOrder {
  const input = raw as CreateOrderInput;
  if (!input || !["delivery", "pickup"].includes(input.fulfillmentType) || !["cash", "yape", "card"].includes(input.paymentMethod)) throw new DomainError("Modalidad o pago inválido.");
  const customer = user.role === "customer" ? user : data.users.find(u => u.id === input.customer?.id && u.role === "customer");
  if (!customer) throw new DomainError("Selecciona un cliente registrado.");
  const customRecipient = user.role === "customer" && input.customer?.name !== undefined;
  const recipientName = customRecipient ? text(input.customer.name, "el nombre para el pedido", 2, 100) : customer.name;
  const phone = user.role === "customer" ? text(input.customer?.phone, "el celular").replace(/\D/g, "") : customer.phone;
  if (!/^9\d{8}$/.test(phone)) throw new DomainError("Ingresa un celular válido de 9 dígitos.");
  if (!Array.isArray(rawCart) || !rawCart.length || rawCart.length > 100) throw new DomainError("Agrega productos al pedido.");
  const seen = new Set<string>();
  const items = (rawCart as CartItem[]).map(item => {
    const product = getProducts().find(p => p.id === item?.product?.id && p.available);
    if (!product || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || seen.has(product.id)) throw new DomainError("Productos o cantidades inválidas.");
    seen.add(product.id);
    return { productId: product.id, name: product.name, unitPrice: product.price, quantity: item.quantity };
  });
  const subtotal = money(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const discount = birthdayDiscount(subtotal, customer.birthDate);
  const deliveryFee = input.fulfillmentType === "delivery" ? quoteDelivery(text(input.delivery?.district, "el distrito"), data.deliverySettings).fee : 0;
  const common = { id: `YZ-${randomUUID().slice(0, 12).toUpperCase()}`, securityCode: String(randomInt(1000, 10000)), active: true,
    customer: { id: customer.id, name: recipientName, lastName: customRecipient ? undefined : customer.lastName, email: customer.email, phone },
    items, subtotal, discount, ...(discount ? { promotionLabel: `Cumpleaños: ${BIRTHDAY_DISCOUNT_PERCENT}% en productos` } : {}), deliveryFee, total: money(subtotal - discount + deliveryFee), paymentMethod: input.paymentMethod,
    paymentLabel: { cash: "Efectivo", yape: "Yape", card: "Tarjeta" }[input.paymentMethod], status: "pending" as const, createdAt: new Date().toISOString() };
  if (input.fulfillmentType === "pickup") return { ...common, fulfillmentType: "pickup", fulfillment: { location: businessConfig.pickupAddress } };
  const d = input.delivery!;
  const fulfillment = { district: text(d.district, "el distrito"), address: text(d.address, "la dirección"), reference: typeof d.reference === "string" ? d.reference.slice(0, 500) : "",
    ...(typeof d.latitude === "number" && typeof d.longitude === "number" && Number.isFinite(d.latitude) && Number.isFinite(d.longitude) && Math.abs(d.latitude) <= 90 && Math.abs(d.longitude) <= 180 ? { latitude: d.latitude, longitude: d.longitude } : {}) };
  return { ...common, fulfillmentType: "delivery", fulfillment };
}
function reserve(data: SharedData, order: CustomerOrder | null, previous?: CustomerOrder) {
  const inventory = { ...data.inventory };
  if (previous?.active !== false) for (const item of previous?.items ?? []) inventory[item.productId] += item.quantity;
  for (const item of order?.items ?? []) {
    if ((inventory[item.productId] ?? 0) < item.quantity) throw new DomainError(`Stock insuficiente de ${item.name}: quedan ${inventory[item.productId] ?? 0} unidades.`, 409);
    inventory[item.productId] -= item.quantity;
  }
  data.inventory = inventory;
}
export function executeCommand(data: SharedData, token: string, command: Command): { result?: unknown; token?: string } {
  const args = command.args ?? [];
  const user = currentUser(data, token);
  if (command.action === "login" || command.action === "register") {
    const input = args[0] as Record<string, unknown>;
    if (!input) throw new DomainError("Faltan los datos de acceso.");
    const email = text(input.email, "el correo").toLowerCase();
    const password = text(input.password, "la contraseña", 6, 128);
    let found: User | undefined;
    if (command.action === "register") {
      if (data.users.some(u => u.email === email)) throw new DomainError("Ese correo ya está registrado.");
      const phone = text(input.phone, "el celular");
      const birthDate = text(input.birthDate, "la fecha de nacimiento");
      const age = ageOn(birthDate);
      if (age === undefined || age < 13 || age > 120) throw new DomainError("Ingresa una fecha de nacimiento válida. Debes tener al menos 13 años.");
      if (!/^9\d{8}$/.test(phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError("Revisa el correo y celular.");
      found = { id: `USR-${randomUUID()}`, role: "customer", name: text(input.name, "el nombre", 2), lastName: text(input.lastName, "el apellido", 2), email, phone, birthDate, createdAt: new Date().toISOString(), passwordHash: hashPassword(password) };
      data.users.push(found);
    } else {
      found = data.users.find(u => u.email === email && u.role === input.role);
      // Do comparable work for unknown accounts too.
      const valid = passwordMatches(password, found?.passwordHash ?? data.users[0].passwordHash);
      if (!found || !valid) throw new DomainError("Correo, contraseña o rol incorrecto.", 401);
    }
    const nextToken = randomBytes(32).toString("hex");
    data.sessions = data.sessions.filter(s => s.expires > Date.now()).slice(-499);
    data.sessions.push({ hash: hashToken(nextToken), userId: found.id, expires: Date.now() + 86400000 });
    return { result: sessionFor(found), token: nextToken };
  }
  requireRole(user, "admin", "delivery", "customer");
  if (command.action === "logout") { data.sessions = data.sessions.filter(s => s.hash !== hashToken(token)); return {}; }
  if (!command.requestId || !/^[a-zA-Z0-9-]{8,100}$/.test(command.requestId)) throw new DomainError("Falta el identificador de la operación.");
  const receipt = data.receipts.find(r => r.key === command.requestId && r.userId === user.id);
  if (receipt) return { result: receipt.result };
  let result: unknown;
  if (command.action === "setBirthDate") {
    requireRole(user, "customer");
    if (user.birthDate) throw new DomainError("La fecha de nacimiento ya fue registrada.");
    const birthDate = text(args[0], "la fecha de nacimiento");
    const age = ageOn(birthDate);
    if (age === undefined || age < 13 || age > 120) throw new DomainError("Ingresa una fecha válida y una edad de al menos 13 años.");
    user.birthDate = birthDate;
    delete user.age;
    result = sessionFor(user);
  } else if (command.action === "saveDeliverySettings" || command.action === "saveAnalyticsSettings") {
    requireRole(user, "admin");
    if (command.action === "saveDeliverySettings") {
      const raw = JSON.stringify(args[0]); const settings = readDeliverySettings(raw);
      if (JSON.stringify(settings) !== raw || settings.zones.length > 100) throw new DomainError("Revisa las tarifas de delivery.");
      data.deliverySettings = settings;
    } else data.analyticsSettings = readAnalyticsSettings(JSON.stringify(args[0]));
  } else if (command.action === "updateStock") {
    requireRole(user, "admin");
    const id = text(args[0], "el producto"); const quantity = args[1];
    if (!(id in data.inventory) || !Number.isSafeInteger(quantity) || Number(quantity) < 0 || Number(quantity) > 1000000) throw new DomainError("Ingresa un stock entero de cero o más.");
    data.inventory[id] = Number(quantity);
  } else if (command.action === "createOrder" || command.action === "saveAdminOrder") {
    requireRole(user, command.action === "createOrder" ? "customer" : "admin");
    const previous = args[2] ? data.orders.find(o => o.id === args[2]) : undefined;
    if (args[2] && !previous) throw new DomainError("El pedido no existe.");
    if (previous && (previous.status !== "pending" || previous.active === false)) throw new DomainError("Solo se pueden editar pedidos pendientes activos.");
    let order = buildOrder(data, user, args[0], args[1]);
    if (previous) order = { ...order, id: previous.id, securityCode: previous.securityCode, createdAt: previous.createdAt };
    reserve(data, order, previous);
    data.orders = [order, ...data.orders.filter(o => o.id !== previous?.id)]; result = order;
  } else {
    const order = data.orders.find(o => o.id === args[0]);
    if (!order) throw new DomainError("El pedido no existe.", 404);
    if (command.action === "deleteAdminOrder" || command.action === "restoreAdminOrder") {
      requireRole(user, "admin");
      if (order.status !== "pending") throw new DomainError("Solo se pueden desactivar o restaurar pedidos pendientes.");
      const restore = command.action === "restoreAdminOrder";
      if (restore && order.active === false) { reserve(data, order); order.active = true; delete order.deactivatedAt; }
      if (!restore && order.active !== false) { reserve(data, null, order); order.active = false; order.deactivatedAt = new Date().toISOString(); }
    } else {
      if (order.active === false) throw new DomainError("Este pedido está inactivo.");
      if (command.action === "rateOrder") {
        requireRole(user, "customer");
        if (order.customer.id !== user.id || !["delivered", "picked_up"].includes(order.status) || !["yes", "no"].includes(String(args[1]))) throw new DomainError("No puedes calificar este pedido.", 403);
        order.customerRating = args[1] as "yes" | "no";
      } else {
        requireRole(user, "admin", "delivery");
        if (user.role === "delivery" && order.fulfillmentType !== "delivery") throw new DomainError("Este pedido es para recojo.", 403);
        switch (command.action) {
          case "acceptOrder": if (order.status !== "pending") throw new DomainError("El pedido ya fue aceptado.", 409); order.status = "accepted"; order.acceptedBy = user.name; break;
          case "advanceOrderStatus": {
            const next = getNextOrderStatus(order.status, order.fulfillmentType);
            if (!next || ["delivered", "picked_up"].includes(next)) throw new DomainError("Confirma la entrega con el código del cliente.");
            order.status = next; break;
          }
          case "verifyOrder":
            if (!["on_the_way", "ready_for_pickup"].includes(order.status) || order.securityCode !== String(args[1]).trim()) throw new DomainError("Código incorrecto o pedido todavía no listo.");
            order.status = order.fulfillmentType === "delivery" ? "delivered" : "picked_up"; order.verifiedAt = new Date().toISOString(); break;
          case "markArrived": if (order.status !== "on_the_way") throw new DomainError("El pedido debe estar en camino."); order.arrivedAt = new Date().toISOString(); break;
          case "rateCustomer": if (order.status !== "delivered" || !["good", "regular", "bad"].includes(String(args[1]))) throw new DomainError("Calificación inválida."); order.deliveryRating = args[1] as "good" | "regular" | "bad"; break;
          default: throw new DomainError("Operación desconocida.");
        }
      }
    }
    result = user.role === "delivery" ? { ...order, securityCode: "" } : order;
  }
  data.receipts = [...data.receipts.slice(-199), { key: command.requestId, userId: user.id, result: result ?? null }];
  return { result };
}
