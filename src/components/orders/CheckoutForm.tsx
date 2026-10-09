"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type {
  CustomerOrder,
  DeliveryDetails,
  FulfillmentType,
  PaymentMethod,
} from "@/models";
import { useAuth } from "@/components/auth/AuthProvider";
import { useOrder } from "@/components/orders/OrderProvider";
import { Container } from "@/components/ui/Container";
import { businessConfig } from "@/lib/business-config";
import { formatPrice } from "@/lib/format";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import { paymentMethodLabels } from "@/patterns/structural/payment-adapter";

const pickupMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessConfig.pickupAddress)}`;

export function CheckoutForm() {
  const { cart, hydrated, subtotal, submitOrder } = useOrder();
  const { session } = useAuth();
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [name, setName] = useState(session?.name ?? "");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [coordinates, setCoordinates] = useState<Pick<DeliveryDetails, "latitude" | "longitude"> | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<CustomerOrder | null>(null);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Este navegador no permite compartir ubicación.");
      return;
    }
    setLocationMessage("Solicitando ubicación...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationMessage("Ubicación actual agregada al pedido.");
      },
      () => setLocationMessage("No se pudo obtener la ubicación. Puedes ingresar la dirección manualmente."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const delivery =
        fulfillmentType === "delivery"
          ? {
              district: district.trim(),
              address: address.trim(),
              reference: reference.trim(),
              ...(coordinates ?? {}),
            }
          : undefined;
      const order = submitOrder({
        customer: {
          id: session?.userId,
          name: session?.name ?? name,
          lastName: session?.lastName,
          email: session?.email,
          phone,
        },
        fulfillmentType,
        paymentMethod,
        delivery,
      });
      setConfirmedOrder(order);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "No se pudo registrar el pedido.",
      );
    }
  }

  if (!hydrated) {
    return <p className="py-14 text-center text-muted">Cargando pedido...</p>;
  }

  if (!session || session.role !== "customer") {
    return (
      <section className="py-14">
        <Container>
          <div className="max-w-2xl border border-cream/10 bg-card p-7 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ember">
              Identifícate primero
            </p>
            <h1 className="mt-3 font-display text-6xl leading-none text-cream">
              Acceso de cliente
            </h1>
            <p className="mt-4 text-muted">
              Regístrate o inicia sesión como cliente para que tu pedido tenga
              código de verificación y quede asociado a tu cuenta.
            </p>
            <Link
              href="/ingresar"
              className="mt-7 inline-flex rounded-full bg-ember px-5 py-3 text-sm font-bold uppercase text-ink hover:bg-flame"
            >
              Ingresar como cliente
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  if (confirmedOrder) {
    const whatsappUrl = buildWhatsAppOrderUrl(confirmedOrder);
    return (
      <section className="py-14">
        <Container>
          <div className="max-w-2xl border border-cream/10 bg-card p-7 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ember">
              Pedido registrado localmente
            </p>
            <h1 className="mt-3 font-display text-6xl leading-none text-cream">
              Gracias, {confirmedOrder.customer.name}
            </h1>
            <p className="mt-4 text-muted">
              Tu código de seguridad es{" "}
              <strong className="text-gold">{confirmedOrder.securityCode}</strong>.
              Díselo solo al delivery o al administrador cuando recibas el pedido.
            </p>
            <div className="mt-7 border-y border-cream/10 py-5">
              <p className="text-xs font-semibold uppercase text-muted">Resumen</p>
              <ul className="mt-3 space-y-2 text-sm text-cream">
                {confirmedOrder.items.map((item) => (
                  <li key={item.productId} className="flex justify-between gap-4">
                    <span>{item.quantity} × {item.name}</span>
                    <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex justify-between font-semibold text-gold">
                <span>Total de productos</span>
                <span>{formatPrice(confirmedOrder.total)}</span>
              </p>
              <p className="mt-2 flex justify-between text-sm text-muted">
                <span>Método de pago</span>
                <span className="text-cream">{confirmedOrder.paymentLabel}</span>
              </p>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              El pedido está guardado solo en este navegador; todavía no se envía a un sistema del local.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-ember px-5 py-3 text-sm font-bold uppercase text-ink hover:bg-flame"
                >
                  Abrir pedido en WhatsApp
                </a>
              ) : (
                <p className="self-center text-sm text-muted">
                  WhatsApp está pendiente de configurar.
                </p>
              )}
              <Link
                href="/menu"
                className="rounded-full border border-cream/20 px-5 py-3 text-sm font-semibold uppercase text-cream hover:border-ember"
              >
                Volver al menú
              </Link>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (cart.length === 0) {
    return (
      <section className="py-14">
        <Container>
          <h1 className="font-display text-6xl text-cream">Pedido</h1>
          <p className="mt-4 text-muted">Agrega productos al carrito antes de continuar.</p>
          <Link href="/menu" className="mt-6 inline-flex rounded-full bg-ember px-5 py-3 text-sm font-bold uppercase text-ink">
            Ir al menú
          </Link>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-14">
      <Container>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-ember">
          Último paso
        </p>
        <h1 className="mt-2 font-display text-6xl leading-none text-cream">Datos del pedido</h1>
        <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_360px]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <fieldset className="space-y-4">
              <legend className="font-display text-3xl text-cream">Contacto</legend>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase text-muted">Nombre</span>
                <input
                  required
                  minLength={2}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={Boolean(session)}
                  className="w-full rounded-lg border border-cream/15 bg-card px-4 py-3 text-cream outline-none focus:border-ember"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase text-muted">Celular</span>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="9[0-9]{8}"
                  maxLength={9}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                  placeholder="9 dígitos"
                  className="w-full rounded-lg border border-cream/15 bg-card px-4 py-3 text-cream outline-none placeholder:text-muted/70 focus:border-ember"
                />
              </label>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-display text-3xl text-cream">Pago</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["cash", "yape", "card"] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center justify-center border px-4 py-3 text-sm font-semibold transition ${paymentMethod === method ? "border-gold bg-gold/10 text-cream" : "border-cream/15 text-muted hover:border-cream/40"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="sr-only"
                    />
                    {paymentMethodLabels[method]}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="font-display text-3xl text-cream">Entrega</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["delivery", "Delivery"],
                  ["pickup", "Recojo en local"],
                ] as const).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm font-semibold transition ${fulfillmentType === value ? "border-ember bg-ember/10 text-cream" : "border-cream/15 text-muted hover:border-cream/40"}`}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      value={value}
                      checked={fulfillmentType === value}
                      onChange={() => setFulfillmentType(value)}
                      className="accent-[#ff4d1a]"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {fulfillmentType === "delivery" ? (
                <div className="space-y-4 border-l-2 border-ember/50 pl-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase text-muted">Distrito</span>
                    <input
                      required
                      autoComplete="address-level2"
                      value={district}
                      onChange={(event) => setDistrict(event.target.value)}
                      placeholder="Escribe tu distrito"
                      className="w-full rounded-lg border border-cream/15 bg-card px-4 py-3 text-cream outline-none placeholder:text-muted/70 focus:border-ember"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase text-muted">Dirección</span>
                    <input
                      required
                      autoComplete="street-address"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Avenida, calle, número..."
                      className="w-full rounded-lg border border-cream/15 bg-card px-4 py-3 text-cream outline-none placeholder:text-muted/70 focus:border-ember"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase text-muted">Referencia</span>
                    <input
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      placeholder="Cerca de..., color de puerta..."
                      className="w-full rounded-lg border border-cream/15 bg-card px-4 py-3 text-cream outline-none placeholder:text-muted/70 focus:border-ember"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="rounded-full border border-cream/20 px-4 py-2 text-xs font-semibold uppercase text-cream hover:border-ember"
                  >
                    Usar mi ubicación actual
                  </button>
                  {locationMessage ? <p className="text-sm text-muted" role="status">{locationMessage}</p> : null}
                </div>
              ) : (
                <div className="border-l-2 border-gold/60 pl-4">
                  <p className="text-sm text-muted">Recoge tu pedido en:</p>
                  <p className="mt-1 font-semibold text-cream">{businessConfig.pickupAddress}</p>
                  <a
                    href={pickupMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-gold underline underline-offset-4"
                  >
                    Ver ubicación en Google Maps
                  </a>
                </div>
              )}
            </fieldset>
            {error ? <p className="text-sm font-semibold text-flame" role="alert">{error}</p> : null}
            <button
              type="submit"
              className="rounded-full bg-ember px-6 py-3 text-sm font-bold uppercase text-ink transition hover:bg-flame"
            >
              Confirmar pedido
            </button>
          </form>

          <aside className="h-fit border border-cream/10 bg-card p-6">
            <h2 className="font-display text-3xl text-cream">Resumen del pedido</h2>
            <ul className="mt-5 space-y-3 border-y border-cream/10 py-5 text-sm">
              {cart.map(({ product, quantity }) => (
                <li key={product.id} className="flex justify-between gap-4 text-muted">
                  <span>{quantity} × {product.name}</span>
                  <span className="shrink-0 text-cream">{formatPrice(product.price * quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="mt-3 flex justify-between font-semibold text-gold">
              <span>Total de productos</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="mt-3 flex justify-between text-sm text-muted">
              <span>Pago</span>
              <span className="text-cream">{paymentMethodLabels[paymentMethod]}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              La tarifa de delivery aún no está configurada; el total no la incluye.
            </p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
