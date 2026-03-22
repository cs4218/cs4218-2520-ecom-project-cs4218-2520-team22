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
 * Navigate to /login, fill credentials, and wait for the redirect away from /login.
 */
export const loginAs = async (page, email, password) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
  // do not wait for redirect, login may not be successful
};

export const loginAsUser = (page) =>
  loginAs(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);

export const loginAsAdmin = (page) =>
  loginAs(page, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD);

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
