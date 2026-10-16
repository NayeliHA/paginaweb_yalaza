const pickupAddress =
  process.env.NEXT_PUBLIC_YALAZA_PICKUP_ADDRESS ??
  "Yalaza, Imperial, Cañete, Perú";

export const businessConfig = Object.freeze({
  pickupAddress,
  whatsappNumber: process.env.NEXT_PUBLIC_YALAZA_WHATSAPP_NUMBER ?? "51947228198",
  yapePhone: process.env.NEXT_PUBLIC_YALAZA_YAPE_PHONE ?? "999999999",
  yapeOwner: process.env.NEXT_PUBLIC_YALAZA_YAPE_OWNER ?? "Yalaza",
});
