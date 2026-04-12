// Song Yichao, A0255686M

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "";

const USER_EMAIL = __ENV.USER_EMAIL || "";
const USER_PASSWORD = __ENV.USER_PASSWORD || "";

export const options = {
  scenarios: {
    stress_orders: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 5 },
        { duration: "20s", target: 10 },
        { duration: "20s", target: 20 },
        { duration: "20s", target: 40 },
        { duration: "20s", target: 60 },
        { duration: "15s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.20"],
    http_req_duration: ["p(95)<3000"],
    checks: ["rate>0.95"],
  },
};

function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "login" },
    }
  );

  const ok = check(res, {
    "login status is 200": (r) => r.status === 200,
    "login has token": (r) => {
      try {
        const body = r.json();
        return !!body.token;
      } catch {
        return false;
      }
    },
  });

  if (!ok) {
    console.log(`Login failed for ${email}. Status: ${res.status}, Body: ${res.body}`);
    return null;
  }

  return res.json("token");
}

export function setup() {
  const adminToken = login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const userToken = login(USER_EMAIL, USER_PASSWORD);

  return {
    adminToken,
    userToken,
  };
}

export default function (data) {
  const headersForAdmin = data.adminToken
    ? { Authorization: data.adminToken }
    : {};

  const headersForUser = data.userToken
    ? { Authorization: data.userToken }
    : {};

  const roll = Math.random();

  if (roll < 0.7) {
    const res = http.get(`${BASE_URL}/api/v1/auth/all-orders`, {
      headers: headersForAdmin,
      tags: { endpoint: "all_orders" },
    });

    check(res, {
      "all-orders status is 200": (r) => r.status === 200,
    });
  } else {
    const res = http.get(`${BASE_URL}/api/v1/auth/orders`, {
      headers: headersForUser,
      tags: { endpoint: "user_orders" },
    });

    check(res, {
      "orders status is 200": (r) => r.status === 200,
    });
  }

  sleep(1);
}
