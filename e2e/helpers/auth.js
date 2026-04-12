/**
 * Playwright auth helpers — reusable login/logout utilities.
 *
 * QINZHE Wang, A0337880U
 */

import {
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
} from "./globalSetup.js";

export {
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
};

/**
 * Navigate to /login, fill credentials, and click LOGIN.
 * Does NOT wait for a redirect — use this when the test itself needs to handle
 * both success and failure outcomes (e.g. testing wrong-password behaviour).
 */
export const loginAs = async (page, email, password) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
};

/**
 * Login as the seeded regular user and wait until the browser has navigated
 * away from /login (i.e. the auth token has been stored and the redirect fired).
 */
export const loginAsUser = async (page) => {
  await loginAs(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);
  // Wait for navigation away from login page
  await page.waitForURL((url) => !url.toString().includes("/login"), {
    timeout: 10000,
  });
  // Give extra time for react context to update and header to render
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
};

/**
 * Login as the seeded admin user and wait until the browser has navigated
 * away from /login (i.e. the auth token has been stored and the redirect fired).
 */
export const loginAsAdmin = async (page) => {
  await loginAs(page, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD);
  // Wait for navigation away from login page
  await page.waitForURL((url) => !url.toString().includes("/login"), {
    timeout: 10000,
  });
  // Give extra time for react context to update and header to render
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
};

export const registerAs = async (page, {
  name,
  email,
  password,
  phone = "9999999999",
  address = "1 Test Street",
  dob = "2000-01-01",
  answer,
}) => {
  await page.goto("/register");
  await page.getByPlaceholder("Enter Your Name").fill(name);
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByPlaceholder("Enter Your Phone").fill(phone);
  await page.getByPlaceholder("Enter Your Address").fill(address);
  await page.locator('input[type="date"]').fill(dob);
  await page.getByPlaceholder("What is Your Favorite sports").fill(answer);
  await page.getByRole("button", { name: "REGISTER" }).click();
};

export const resetPassword = async (page,
  {
    email,
    answer,
    newPassword
  }) => {
  await page.goto("/forgot-password");
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Favorite Sports").fill(answer);
  await page.getByPlaceholder("Enter Your New Password").fill(newPassword);
  await page.getByRole("button", { name: "RESET" }).click();
};
