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

// Song Yichao, A0255686M
test("E2E-SONG-02: Search -> results -> add to cart -> cart shows item", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("Search").fill("E2E Laptop");
  await page.getByRole("button", { name: "Search" }).click();

  await page.waitForURL(/\/search/, { timeout: 8000 });

  const firstCard = page.locator(".card.m-2").first();
  await expect(firstCard).toBeVisible({ timeout: 8000 });

  const productName = (await firstCard.locator(".card-title").textContent()).trim();

  await firstCard.getByRole("button", { name: /add to cart/i }).click();

  await page.goto("/cart");

  await expect(page.getByText(productName)).toBeVisible({ timeout: 8000 });
});

// Song Yichao, A0255686M
test("E2E-SONG-03: Search -> More Details -> product detail page loads correct product", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("Search").fill("E2E Laptop");
  await page.getByRole("button", { name: "Search" }).click();

  await page.waitForURL(/\/search/, { timeout: 8000 });

  const firstCard = page.locator(".card.m-2").first();
  await expect(firstCard).toBeVisible({ timeout: 8000 });

  const productName = (await firstCard.locator(".card-title").textContent()).trim();

  await firstCard.getByRole("button", { name: /more details/i }).click();

  await page.waitForURL(/\/product\//, { timeout: 8000 });

  await expect(page.getByText(productName)).toBeVisible({ timeout: 8000 });
});
