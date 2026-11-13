import http from "k6/http";
import { check, fail } from "k6";

const baseUrl = __ENV.BASE_URL;

if (!baseUrl) fail("Define BASE_URL con la URL del entorno de pruebas.");

export const options = {
  scenarios: {
    simultaneous_logins: {
      executor: "per-vu-iterations",
      vus: 50,
      iterations: 1,
      maxDuration: "2m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
    checks: ["rate==1"],
  },
};

export default function () {
  // The project has 20 seeded demo customers; use each account 2–3 times.
  const accountNumber = ((__VU - 1) % 20) + 1;
  const user = {
    email: `cliente${String(accountNumber).padStart(2, "0")}@yalaza.test`,
    password: "cliente123",
  };
  const response = http.post(
    `${baseUrl.replace(/\/$/, "")}/api/store/`,
    JSON.stringify({
      action: "login",
      args: [{ role: "customer", email: user.email, password: user.password }],
    }),
    { headers: { "Content-Type": "application/json" }, timeout: "60s" },
  );

  check(response, {
    "login completado": (result) => result.status === 200,
  });
}
