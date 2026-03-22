import { test, expect } from "@playwright/test";
import { loginAs, loginAsUser, registerAs } from "./helpers/auth.js";
import {
  E2E_USER_NAME,
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  E2E_USER_PHONE,
  E2E_USER_ADDRESS,
} from "./helpers/globalSetup.js";

test("E2E-PROFILE-01: Profile preloads seeded user information", async ({ page }) => {
  await loginAsUser(page);
  await page.waitForURL("/", { timeout: 10000 });

  await page.goto("/dashboard/user/profile");
  await expect(page.getByRole("heading", { name: /user profile/i })).toBeVisible({ timeout: 10000 });

  await expect(page.getByPlaceholder(/enter your name/i)).toHaveValue(E2E_USER_NAME);
  await expect(page.getByPlaceholder(/enter your email/i)).toHaveValue(E2E_USER_EMAIL);
  await expect(page.getByPlaceholder(/enter your phone/i)).toHaveValue(E2E_USER_PHONE);
  await expect(page.getByPlaceholder(/enter your address/i)).toHaveValue(E2E_USER_ADDRESS);
});

test("E2E-PROFILE-02: Email field is not editable", async ({ page }) => {
  await loginAsUser(page);
  await page.waitForURL("/", { timeout: 10000 });

  await page.goto("/dashboard/user/profile");
  const emailInput = page.getByPlaceholder(/enter your email/i);

  await expect(emailInput).toBeDisabled();
  await expect(emailInput).toHaveValue(E2E_USER_EMAIL);
});

test("E2E-PROFILE-03a: User can update name/address/phone and sees updates on profile + header", async ({ page }) => {
  const uniqueEmail = `e2e.profile.03a.${Date.now()}@test.com`;
  const updatedName = `E2E Profile 03a ${Date.now()}`;
  const updatedAddress = `03a Updated ${Date.now()} Test St`;
  const updatedPhone = "912345678"
  const password = "Profile@123";
  await registerAs(page, {
    name: "E2E Profile User 03a",
    email: uniqueEmail,
    password: password,
    phone: "9000000001",
    address: "03a Initial St",
    dob: "2000-01-01",
    answer: "football",
  });
  await loginAs(page, uniqueEmail, password);
  await page.waitForURL("/", { timeout: 10000 });

  await page.goto("/dashboard/user/profile");
  await page.getByPlaceholder(/enter your name/i).fill(updatedName);
  await page.getByPlaceholder(/enter your phone/i).fill(updatedPhone);
  await page.getByPlaceholder(/enter your address/i).fill(updatedAddress);
  await page.getByRole("button", { name: /^UPDATE$/i }).click();

  await expect(page.getByPlaceholder(/enter your name/i)).toHaveValue(updatedName, { timeout: 8000 });
  await expect(page.getByPlaceholder(/enter your phone/i)).toHaveValue(updatedPhone, { timeout: 8000 });
  await expect(page.getByPlaceholder(/enter your address/i)).toHaveValue(updatedAddress, { timeout: 8000 });
  await expect(page.getByRole("navigation")).toContainText(updatedName, { timeout: 8000 });
});

test("E2E-PROFILE-03b: Updated profile data persists on /dashboard/user", async ({ page }) => {
  const uniqueEmail = `e2e.profile.03b.${Date.now()}@test.com`;
  const updatedName = `E2E Profile 03b ${Date.now()}`;
  const updatedAddress = `03b Updated ${Date.now()} Test St`;
  const password = "Profile@123";
  await registerAs(page, {
    name: "E2E Profile User 03b",
    email: uniqueEmail,
    password,
    phone: "9000000002",
    address: "03b Initial St",
    dob: "2000-01-01",
    answer: "football",
  });
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  await loginAs(page, uniqueEmail, password);
  await page.waitForURL("/", { timeout: 10000 });
  
  await page.goto("/dashboard/user/profile");
  await page.getByPlaceholder(/enter your name/i).fill(updatedName);
  await page.getByPlaceholder(/enter your address/i).fill(updatedAddress);
  await page.getByRole("button", { name: /^UPDATE$/i }).click();

  await page.goto("/dashboard/user");
  await expect(page.getByText(`Name: ${updatedName}`)).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(`Address: ${updatedAddress}`)).toBeVisible();
});

test("E2E-PROFILE-03c: Updated profile data persists after logout and login", async ({ page }) => {
  const uniqueEmail = `e2e.profile.03c.${Date.now()}@test.com`;
  const updatedName = `E2E Profile 03c ${Date.now()}`;
  const updatedAddress = `03c Updated ${Date.now()} Test St`;
  const updatedPhone = "923456789"
  const password = "Profile@123";
  await registerAs(page, {
    name: "E2E Profile User 03c",
    email: uniqueEmail,
    password,
    phone: "9000000003",
    address: "03c Initial St",
    dob: "2000-01-01",
    answer: "football",
  });
  await loginAs(page, uniqueEmail, password);
  await page.waitForURL("/", { timeout: 10000 });

  // Act: Update profile info and logout/login
  await page.goto("/dashboard/user/profile");
  await page.getByPlaceholder(/enter your name/i).fill(updatedName);
  await page.getByPlaceholder(/enter your phone/i).fill(updatedPhone);
  await page.getByPlaceholder(/enter your address/i).fill(updatedAddress);
  await page.getByRole("button", { name: /^UPDATE$/i }).click();
  
  await page.getByRole("navigation").getByText(updatedName).click();
  await page.getByRole("link", { name: "Logout" }).click();
  await page.waitForURL(/\/login/, { timeout: 10000 });

  await loginAs(page, uniqueEmail, password);
  await page.waitForURL("/", { timeout: 10000 });
  await page.goto("/dashboard/user/profile");

  await expect(page.getByPlaceholder(/enter your name/i)).toHaveValue(updatedName);
  await expect(page.getByPlaceholder(/enter your phone/i)).toHaveValue(updatedPhone);
  await expect(page.getByPlaceholder(/enter your address/i)).toHaveValue(updatedAddress);
});

test("E2E-PROFILE-04a: Changing password works and persists after logout/login", async ({ page }) => {
  const uniqueEmail = `e2e.profile.04a.${Date.now()}@test.com`;
  const password = "Profile@123";
  const newPassword = "Profile@123New";
  const displayName = `E2E Profile 04a ${Date.now()}`;
  await registerAs(page, {
    name: displayName,
    email: uniqueEmail,
    password,
    phone: "9000000004",
    address: "04a Initial St",
    dob: "2000-01-01",
    answer: "football",
  });
  await loginAs(page, uniqueEmail, password);
  await page.waitForURL("/", { timeout: 10000 });

  // Act: Change password, logout/login with new password
  await page.goto("/dashboard/user/profile");
  await page.getByPlaceholder(/enter your password/i).fill(newPassword);
  await page.getByRole("button", { name: /^UPDATE$/i }).click();

  await page.getByRole("navigation").getByText(displayName).click();
  await page.getByRole("link", { name: "Logout" }).click();
  await page.waitForURL(/\/login/, { timeout: 10000 });

  await loginAs(page, uniqueEmail, newPassword);
  await page.waitForURL("/", { timeout: 10000 });
  
  await expect(page.getByRole("navigation")).toContainText(displayName, { timeout: 8000 });
});

test("E2E-PROFILE-04b: Old password fails after changing password", async ({ page }) => {
  const uniqueEmail = `e2e.profile.04b.${Date.now()}@test.com`;
  const password = "Profile@123";
  const newPassword = "Profile@123New";
  const displayName = `E2E Profile 04b ${Date.now()}`;
  await registerAs(page, {
    name: displayName,
    email: uniqueEmail,
    password,
    phone: "9000000005",
    address: "04b Initial St",
    dob: "2000-01-01",
    answer: "football",
  });
  await loginAs(page, uniqueEmail, password);
  await page.waitForURL("/", { timeout: 10000 });

  // Act: Change password, logout/login with old password
  await page.goto("/dashboard/user/profile");
  await page.getByPlaceholder(/enter your password/i).fill(newPassword);
  await page.getByRole("button", { name: /^UPDATE$/i }).click();

  await page.getByRole("navigation").getByText(displayName).click();
  await page.getByRole("link", { name: "Logout" }).click();
  await page.waitForURL(/\/login/, { timeout: 10000 });

  await loginAs(page, uniqueEmail, password);
  await page.waitForURL(/\/login/, { timeout: 10000 });
  
  await expect(page.getByText(/invalid password/i)).toBeVisible({ timeout: 8000 });
  await expect(page).toHaveURL(/\/login/);
});
