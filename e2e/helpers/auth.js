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

export { E2E_USER_EMAIL, E2E_USER_PASSWORD, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD };

/**
 * Navigate to /login, fill credentials, and wait for the redirect away from /login.
 */
export const loginAs = async (page, email, password) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  // Wait for redirect away from /login on success
  await page.waitForURL((url) => !url.toString().includes("/login"), {
    timeout: 10000,
  });
};

export const loginAsUser = (page) =>
  loginAs(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);

export const loginAsAdmin = (page) =>
  loginAs(page, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD);
