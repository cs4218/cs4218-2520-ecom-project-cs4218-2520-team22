import { check, sleep } from "k6";
import http from "k6/http";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const SOAK_DURATION = __ENV.SOAK_DURATION || "2h";
const TARGET_VUS = Number(__ENV.TARGET_VUS || 50);
const RAMP_UP = __ENV.RAMP_UP || "10m";
const RAMP_DOWN = __ENV.RAMP_DOWN || "10m";

const AUTH_EMAIL = __ENV.AUTH_EMAIL || "";
const AUTH_PASSWORD = __ENV.AUTH_PASSWORD || "";

const PRODUCT_KEYWORDS = ["book", "phone", "shirt", "laptop"];

const transactionSuccessRate = new Rate("transaction_success_rate");
const transactionDuration = new Trend("transaction_duration", true);

export const options = {
  scenarios: {
    soak_api: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: RAMP_UP, target: TARGET_VUS },
        { duration: SOAK_DURATION, target: TARGET_VUS },
        { duration: RAMP_DOWN, target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500", "p(99)<2000"],
    http_req_waiting: ["p(95)<1500"],
    http_req_connecting: ["p(95)<100"],
    checks: ["rate>0.99"],
    transaction_success_rate: ["rate>0.99"],
    transaction_duration: ["p(95)<1500"],
    "http_req_duration{endpoint:get_products}": ["p(95)<850"],
    "http_req_duration{endpoint:get_categories}": ["p(95)<850"],
    "http_req_duration{endpoint:search_products}": ["p(95)<1000"],
    "http_req_duration{endpoint:product_filters}": ["p(95)<1200"],
    "http_req_duration{endpoint:auth_orders}": ["p(95)<1200"],
  },
};

function randomKeyword() {
  return PRODUCT_KEYWORDS[Math.floor(Math.random() * PRODUCT_KEYWORDS.length)];
}

export function setup() {
  if (!AUTH_EMAIL || !AUTH_PASSWORD) {
    return { authToken: null };
  }

  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
    {
      headers: {
        "Content-Type": "application/json",
      },
      tags: { endpoint: "auth_login" },
    },
  );

  const ok = check(loginRes, {
    "login status is 200": (res) => res.status === 200,
    "login returned token": (res) => {
      const data = res.json();
      return !!data && !!data.token;
    },
  });

  if (!ok) {
    return { authToken: null };
  }

  return { authToken: loginRes.json("token") };
}

export default function (data) {
  const txStart = Date.now();
  let txOk = true;
  const roll = Math.random();

  // 70% browse traffic
  if (roll < 0.7) {
    const browseChoice = Math.random();

    if (browseChoice < 0.5) {
      const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`, {
        tags: { endpoint: "get_products" },
      });

      check(productsRes, {
        "get-product status is 200": (res) => res.status === 200,
      });
      txOk = txOk && productsRes.status === 200;
    } else {
      const categoriesRes = http.get(
        `${BASE_URL}/api/v1/category/get-category`,
        {
          tags: { endpoint: "get_categories" },
        },
      );

      check(categoriesRes, {
        "get-category status is 200": (res) => res.status === 200,
      });
      txOk = txOk && categoriesRes.status === 200;
    }
  }

  // 20% search/filter traffic
  if (roll >= 0.7 && roll < 0.9) {
    const searchChoice = Math.random();

    if (searchChoice < 0.5) {
      const keyword = randomKeyword();
      const searchRes = http.get(
        `${BASE_URL}/api/v1/product/search/${keyword}`,
        {
          tags: { endpoint: "search_products" },
        },
      );

      check(searchRes, {
        "search status is 200": (res) => res.status === 200,
      });
      txOk = txOk && searchRes.status === 200;
    } else {
      const filtersRes = http.post(
        `${BASE_URL}/api/v1/product/product-filters`,
        JSON.stringify({ checked: [], radio: [] }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          tags: { endpoint: "product_filters" },
        },
      );

      check(filtersRes, {
        "filters status is 200": (res) => res.status === 200,
      });
      txOk = txOk && filtersRes.status === 200;
    }
  }

  // 10% authenticated traffic if token is available
  if (roll >= 0.9 && data.authToken) {
    const ordersRes = http.get(`${BASE_URL}/api/v1/auth/orders`, {
      headers: {
        Authorization: data.authToken,
      },
      tags: { endpoint: "auth_orders" },
    });

    check(ordersRes, {
      "orders status is 200": (res) => res.status === 200,
    });
    txOk = txOk && ordersRes.status === 200;
  }

  transactionSuccessRate.add(txOk);
  transactionDuration.add(Date.now() - txStart);

  sleep(1);
}
