import { test, expect } from "@playwright/test";
import {
	loginAs,
	loginAsUser,
	E2E_USER_EMAIL,
	E2E_USER_PASSWORD,
} from "./helpers/auth.js";

const SEEDED_NAME = "E2E User";
const SEEDED_EMAIL = E2E_USER_EMAIL;
const SEEDED_PHONE = "0000000002";
const SEEDED_ADDRESS = "2 E2E User St, Test City";

const UPDATED_NAME = `E2E User Updated ${Date.now()}`;
const UPDATED_PHONE = "9123456789";
const UPDATED_ADDRESS = `Updated ${Date.now()} Test St`;
const NEW_PASSWORD = "User@e2e123New";

test("E2E-PROFILE-01: Profile preloads seeded user information", async ({ page }) => {
	await loginAsUser(page);
	await page.waitForURL("/", { timeout: 10000 });

	await page.goto("/dashboard/user/profile");
	await expect(page.getByRole("heading", { name: /user profile/i })).toBeVisible({ timeout: 10000 });

	await expect(page.getByPlaceholder(/Enter your name/i)).toHaveValue(SEEDED_NAME);
	await expect(page.getByPlaceholder(/Enter your email/i)).toHaveValue(SEEDED_EMAIL);
	await expect(page.getByPlaceholder(/Enter your phone/i)).toHaveValue(SEEDED_PHONE);
	await expect(page.getByPlaceholder(/Enter your address/i)).toHaveValue(SEEDED_ADDRESS);
});

test("E2E-PROFILE-02: Email field is not editable", async ({ page }) => {
	await loginAsUser(page);
	await page.waitForURL("/", { timeout: 10000 });

	await page.goto("/dashboard/user/profile");

	const emailInput = page.getByPlaceholder(/enter your email/i);
	await expect(emailInput).toBeDisabled();
	await expect(emailInput).toHaveValue(SEEDED_EMAIL);
});

test("E2E-PROFILE-03a: User can update name/address/phone and sees updates on profile + header", async ({ page }) => {
	await loginAsUser(page);
	await page.waitForURL("/", { timeout: 10000 });

	await page.goto("/dashboard/user/profile");

	await page.getByPlaceholder(/enter your name/i).fill(UPDATED_NAME);
	await page.getByPlaceholder(/enter your phone/i).fill(UPDATED_PHONE);
	await page.getByPlaceholder(/enter your address/i).fill(UPDATED_ADDRESS);
	await page.getByRole("button", { name: "UPDATE" }).click();

	await expect(page.getByPlaceholder(/enter your name/i)).toHaveValue(UPDATED_NAME, { timeout: 8000 });
	await expect(page.getByPlaceholder(/enter your phone/i)).toHaveValue(UPDATED_PHONE);
	await expect(page.getByPlaceholder(/enter your address/i)).toHaveValue(UPDATED_ADDRESS);
	await expect(page.getByRole("navigation")).toContainText(UPDATED_NAME, { timeout: 8000 });
});

test("E2E-PROFILE-03b: Updated profile data persists on /dashboard/user", async ({ page }) => {
	await loginAsUser(page);
	await page.waitForURL("/", { timeout: 10000 });

	await page.goto("/dashboard/user");

	await expect(page.getByText(`Name: ${UPDATED_NAME}`)).toBeVisible({ timeout: 8000 });
	await expect(page.getByText(`Address: ${UPDATED_ADDRESS}`)).toBeVisible();
});

test("E2E-PROFILE-03c: Updated profile data persists after logout and login", async ({ page }) => {
	await loginAsUser(page);
	await page.waitForURL("/", { timeout: 10000 });

	await page.getByRole("navigation").getByText(UPDATED_NAME).click();
	await page.getByRole("link", { name: "Logout" }).click();
	await page.waitForURL(/\/login/, { timeout: 10000 });

	await loginAs(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);
	await page.waitForURL("/", { timeout: 10000 });
	await page.goto("/dashboard/user/profile");

	await expect(page.getByPlaceholder(/enter your name/i)).toHaveValue(UPDATED_NAME);
	await expect(page.getByPlaceholder(/enter your phone/i)).toHaveValue(UPDATED_PHONE);
	await expect(page.getByPlaceholder(/enter your address/i)).toHaveValue(UPDATED_ADDRESS);
});

test("E2E-PROFILE-04a: Changing password works and persists after logout/login", async ({ page }) => {
	await loginAs(page, E2E_USER_EMAIL, E2E_USER_PASSWORD);
	await page.waitForURL("/", { timeout: 10000 });

	await page.goto("/dashboard/user/profile");
	await page.getByPlaceholder(/enter your password/i).fill(NEW_PASSWORD);
	await page.getByRole("button", { name: "UPDATE" }).click();

	await expect(page.getByRole("navigation")).toContainText(UPDATED_NAME, { timeout: 8000 });

	await page.getByRole("navigation").getByText(UPDATED_NAME).click();
	await page.getByRole("link", { name: "Logout" }).click();
	await page.waitForURL(/\/login/, { timeout: 10000 });

	await loginAs(page, E2E_USER_EMAIL, NEW_PASSWORD);
	await page.waitForURL("/", { timeout: 10000 });
	await expect(page.getByRole("navigation")).toContainText(UPDATED_NAME, { timeout: 8000 });
});

test("E2E-PROFILE-04b: Old password fails after password change", async ({ page }) => {
	await page.goto("/login");
	await page.getByPlaceholder("Enter Your Email").fill(E2E_USER_EMAIL);
	await page.getByPlaceholder("Enter Your Password").fill(E2E_USER_PASSWORD);
	await page.getByRole("button", { name: "LOGIN" }).click();

	await expect(page.getByText(/invalid password/i)).toBeVisible({ timeout: 8000 });
	await expect(page).toHaveURL(/\/login/);

	await loginAs(page, E2E_USER_EMAIL, NEW_PASSWORD);
	await page.waitForURL("/", { timeout: 10000 });

	await page.goto("/dashboard/user/profile");
	await page.getByPlaceholder(/enter your password/i).fill(E2E_USER_PASSWORD);
	await page.getByRole("button", { name: "UPDATE" }).click();

	await page.getByRole("navigation").getByText(UPDATED_NAME).click();
	await page.getByRole("link", { name: "Logout" }).click();
	await page.waitForURL(/\/login/, { timeout: 10000 });
});