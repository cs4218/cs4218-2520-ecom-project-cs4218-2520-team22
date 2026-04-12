/**
 * Sprint 3 — E2E Authentication Journey Tests
 * Stories: E2E-AUTH-01 through E2E-AUTH-06
 * Approach: Full-stack E2E via Playwright (browser → React → Express → MongoDB)
 *
 * QINZHE Wang, A0337880U
 */

import { test, expect, beforeAll } from "@playwright/test";
import {
  loginAs,
  loginAsUser,
  registerAs,
  resetPassword,
  E2E_USER_EMAIL,
  E2E_USER_PASSWORD,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_PASSWORD,
} from "./helpers/auth.js";

// Reset E2E user profile before auth tests run (in case it was modified by other test suites)
beforeAll(async ({ browser }) => {
  if (!browser) return; // Skip if no browser context available
  
  // Create a new context to make a request as the E2E user
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login to get token for the profile update
    const loginResponse = await page.request.post("http://localhost:6060/api/v1/auth/login", {
      data: { email: E2E_USER_EMAIL, password: E2E_USER_PASSWORD }
    });
    
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      // Update profile back to original values
      await page.request.put("http://localhost:6060/api/v1/auth/profile", {
        headers: { Authorization: loginData.token },
        data: {
          name: "E2E User",
          email: E2E_USER_EMAIL,
          phone: "0000000002",
          address: "2 E2E User St, Test City"
        }
      });
      console.log("[AUTH-SETUP] Reset E2E user profile to original values");
    }
  } catch (error) {
    console.log("[AUTH-SETUP] Warning: Could not reset E2E user profile:", error.message);
  } finally {
    await context.close();
  }
});

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

/// Below tests are all added by Daniel Lai, A0192327A
/// They are targeted towards different trofos todos when combined.

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-07: Login with nonexistent user fails", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Enter Your Email").fill("nonexistent@example.com");
  await page.getByPlaceholder("Enter Your Password").fill("DoesntMatter123");

  await page.getByRole("button", { name: "LOGIN" }).click();

  // Error toast should appear and page stays on /login
  await expect(page.getByText(/Something went wrong/i)).toBeVisible({ timeout: 8000 });
  await expect(page).toHaveURL(/\/login/);
});

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-08: Register and then login successfully with the new account", async ({ page }) => {
  const uniqueEmail = `e2e.reg.manual${Date.now()}@test.com`;
  const password = "Test@1234";
  await registerAs(page, {
    name: "E2E Manual User",
    email: uniqueEmail,
    password,
    phone: "9876543210",
    address: "2 Test Street",
    dob: "1999-05-20",
    answer: "basketball",
  });

  await loginAs(page, uniqueEmail, password);
  await page.waitForURL("/", { timeout: 10000 });

  // Navigate to home page, user name should be in header,
  // login/register links should be hidden since it is not needed anymore
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("navigation")).toContainText("E2E Manual User", { timeout: 8000 });
  await expect(page.getByRole("link", { name: "Login" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).not.toBeVisible();
});

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-09a: Login persists after browser refresh", async ({ page }) => {
  await loginAsUser(page);

  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("navigation")).toContainText("E2E User", { timeout: 8000 });
  await expect(page.getByRole("link", { name: "Login" })).not.toBeVisible();
});

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-09b: Clearing auth cache logs user out", async ({ page }) => {
  await loginAsUser(page);
  await page.waitForURL("/", { timeout: 10000 });

  await page.evaluate(() => localStorage.removeItem("auth"));
  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("link", { name: "Login" })).toBeVisible({ timeout: 8000 });
});

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-10a: Forgot password with wrong answer shows error", async ({ page }) => {
  const uniqueEmail = `e2e.forgot.wrong.${Date.now()}@test.com`;
  const originalPassword = "Test@1234";
  await registerAs(page, {
    name: "E2E Forgot Wrong",
    email: uniqueEmail,
    password: originalPassword,
    answer: "football",
  });

  await resetPassword(page, {
    email: uniqueEmail,
    answer: "chess",
    newPassword: "NewPass@123",
  });

  // Failed reset should stay on forgot-password page (successful reset navigates to /login)
  await expect(page.getByText("Something went wrong")).toBeVisible({ timeout: 8000 });
  await expect(page).toHaveURL(/\/forgot-password/, { timeout: 8000 });
});

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-10b: Wrong-answer reset does not invalidate old password", async ({ page }) => {
  const uniqueEmail = `e2e.forgot.keepold.${Date.now()}@test.com`;
  const originalPassword = "Test@1234";
  await registerAs(page, {
    name: "E2E Keep Old",
    email: uniqueEmail,
    password: originalPassword,
    answer: "football",
  });
  await resetPassword(page, {
    email: uniqueEmail,
    answer: "wrong-answer",
    newPassword: "NewPass@123",
  });

  await loginAs(page, uniqueEmail, originalPassword);
  await page.waitForURL("/", { timeout: 10000 });

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("navigation")).toContainText("E2E Keep Old", { timeout: 8000 });
});

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-11: Forgot password with nonexistent user fails", async ({
  page,
}) => {
  await resetPassword(page, {
    email: `e2e.missing.${Date.now()}@test.com`,
    answer: "football",
    newPassword: "NewPass@123",
  });

  await expect(page).toHaveURL(/\/forgot-password/, { timeout: 8000 });
  await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
});

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-12a: Correct-answer reset navigates back to login", async ({ page }) => {
  const uniqueEmail = `e2e.forgot.backlogin.${Date.now()}@test.com`;
  const originalPassword = "Test@1234";
  const newPassword = "NewPass@123";

  await registerAs(page, {
    name: "E2E Back Login",
    email: uniqueEmail,
    password: originalPassword,
    answer: "football",
  });

  await resetPassword(page, {
    email: uniqueEmail,
    answer: "football",
    newPassword,
  });

  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
});

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-12b: Correct-answer reset allows login with new password", async ({ page }) => {
  const uniqueEmail = `e2e.forgot.newok.${Date.now()}@test.com`;
  const originalPassword = "Test@1234";
  const newPassword = "NewPass@123";
  await registerAs(page, {
    name: "E2E New Password",
    email: uniqueEmail,
    password: originalPassword,
    answer: "football",
  });
  await resetPassword(page, {
    email: uniqueEmail,
    answer: "football",
    newPassword,
  });

  await loginAs(page, uniqueEmail, newPassword);

  await expect(page.getByRole("navigation")).toContainText("E2E New Password", { timeout: 8000 });
});

// added the test case, Daniel Lai, A0192327A
test("E2E-AUTH-12c: After successful password reset, old password fails to login", async ({ page }) => {
  const uniqueEmail = `e2e.forgot.oldfail.${Date.now()}@test.com`;
  const originalPassword = "Test@1234";
  const newPassword = "NewPass@123";
  await registerAs(page, {
    name: "E2E Old Fail",
    email: uniqueEmail,
    password: originalPassword,
    answer: "football",
  });
  await resetPassword(page, {
    email: uniqueEmail,
    answer: "football",
    newPassword,
  });

  await loginAs(page, uniqueEmail, originalPassword);

  await expect(page.getByText(/Invalid Password/i)).toBeVisible({ timeout: 8000 });
  await expect(page).toHaveURL(/\/login/);
});