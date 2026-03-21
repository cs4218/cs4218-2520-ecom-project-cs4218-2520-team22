/**
 * Song Yichao, A0255686M
 * Sprint 3 E2E tests for user dashboard and search flows
 */

import { test, expect } from "@playwright/test";
import { loginAsUser } from "./helpers/auth.js";

// Song Yichao, A0255686M
test("E2E-SONG-01: Login -> Dashboard -> Profile update -> refresh persists", async ({ page }) => {
  await loginAsUser(page);

  await page.goto("/dashboard/user/profile");

  const nameInput = page.getByPlaceholder(/Enter Your Name/i);
  const emailInput = page.getByPlaceholder(/Enter Your Email/i);
  const phoneInput = page.getByPlaceholder(/Enter Your Phone/i);
  const addressInput = page.getByPlaceholder(/Enter Your Address/i);

  const newName = `Song E2E ${Date.now()}`;
  const newPhone = "91234567";
  const newAddress = `Address ${Date.now()}`;

  await expect(nameInput).toBeVisible();
  await expect(emailInput).toBeDisabled();

  await nameInput.fill(newName);
  await phoneInput.fill(newPhone);
  await addressInput.fill(newAddress);

  const updateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/auth/profile") &&
      response.request().method() === "PUT"
  );

  await page.getByRole("button", { name: /update/i }).click();

  const updateResponse = await updateResponsePromise;
  expect(updateResponse.ok()).toBeTruthy();

  await page.reload();

  await expect(nameInput).toHaveValue(newName);
  await expect(phoneInput).toHaveValue(newPhone);
  await expect(addressInput).toHaveValue(newAddress);
});
