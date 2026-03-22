/**
 * Sprint 3 — E2E Authentication Journey Tests
 * Stories: E2E-AUTH-01 through E2E-AUTH-06
 * Approach: Full-stack E2E via Playwright (browser → React → Express → MongoDB)
 *
 * QINZHE Wang, A0337880U
 */

import { test, expect } from "@playwright/test";
import {
  loginAs,
  loginAsUser,
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
} from "./helpers/auth.js";

// E2E-AUTH-01
test("E2E-AUTH-01: Successful registration navigates to login page", async ({ page }) => {
  // Mark Wang, A0337880U
  const uniqueEmail = `e2e.reg${Date.now()}@test.com`;

  await page.goto("/register");
  await page.getByPlaceholder("Enter Your Name").fill("E2E Tester");
  await page.getByPlaceholder("Enter Your Email").fill(uniqueEmail);
  await page.getByPlaceholder("Enter Your Password").fill("Test@1234");
  await page.getByPlaceholder("Enter Your Phone").fill("9999999999");
  await page.getByPlaceholder("Enter Your Address").fill("1 Test Street");
  await page.locator('input[type="Date"]').fill("2000-01-01");
  await page.getByPlaceholder("What is Your Favorite sports").fill("football");
  await page.getByRole("button", { name: "REGISTER" }).click();

  // After successful registration the app navigates to /login
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
});

// E2E-AUTH-02
test("E2E-AUTH-02: Register with existing email shows error message", async ({ page }) => {
  // Mark Wang, A0337880U
  await page.goto("/register");
  await page.getByPlaceholder("Enter Your Name").fill("Duplicate User");
  await page.getByPlaceholder("Enter Your Email").fill(E2E_USER_EMAIL); // already seeded
  await page.getByPlaceholder("Enter Your Password").fill("Test@1234");
  await page.getByPlaceholder("Enter Your Phone").fill("8888888888");
  await page.getByPlaceholder("Enter Your Address").fill("2 Test Street");
  await page.locator('input[type="Date"]').fill("1990-06-15");
  await page.getByPlaceholder("What is Your Favorite sports").fill("chess");
  await page.getByRole("button", { name: "REGISTER" }).click();

  // Error toast should appear; URL should NOT move to /login
  await expect(page.getByText(/already registered/i)).toBeVisible({ timeout: 8000 });
  await expect(page).toHaveURL(/\/register/);
});

// E2E-AUTH-03
test("E2E-AUTH-03: Successful login shows user name in header", async ({ page }) => {
  // Mark Wang, A0337880U
  await loginAsUser(page);

  // After login, the header shows the logged-in user's name
  await expect(page.getByRole("navigation")).toContainText("E2E User", { timeout: 8000 });
  // Register / Login links should no longer be visible
  await expect(page.getByRole("link", { name: "Login" })).not.toBeVisible();
});

// E2E-AUTH-04
test("E2E-AUTH-04: Login with wrong password shows error message", async ({ page }) => {
  // Mark Wang, A0337880U
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill(E2E_USER_EMAIL);
  await page.getByPlaceholder("Enter Your Password").fill("WrongPassword!");
  await page.getByRole("button", { name: "LOGIN" }).click();

  // Error toast should appear and page stays on /login
  await expect(page.getByText(/invalid password/i)).toBeVisible({ timeout: 8000 });
  await expect(page).toHaveURL(/\/login/);
});

// E2E-AUTH-05
test("E2E-AUTH-05: Logout redirects to home with Login link visible", async ({ page }) => {
  // Mark Wang, A0337880U
  await loginAsUser(page);

  // Open user dropdown and click Logout
  await page.getByRole("navigation").getByText("E2E User").click();
  await page.getByRole("link", { name: "Logout" }).click();

  // After logout, should be on /login and Register/Login nav links should appear
  await page.waitForURL(/\/login/, { timeout: 8000 });
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
});

// E2E-AUTH-06
test("E2E-AUTH-06: Access protected /dashboard/user without login redirects away", async ({
  page,
}) => {
  // Mark Wang, A0337880U
  // PrivateRoute shows a 3-second countdown Spinner, then navigates to "/"
  await page.goto("/dashboard/user");

  // Spinner message should appear
  await expect(page.getByText(/redirecting to you in/i)).toBeVisible({ timeout: 5000 });

  // After spinner countdown, URL changes away from /dashboard/user
  await page.waitForURL((url) => !url.toString().includes("/dashboard/user"), {
    timeout: 10000,
  });
  expect(page.url()).not.toContain("/dashboard/user");
});
