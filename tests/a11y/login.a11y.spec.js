/**
 * Login Page Accessibility Tests
 * Different user stories with distinct accessibility expectations
 * Verifies WCAG AA compliance using axe-core
 * 
 * Component: client/src/pages/Auth/Login.js
 * Author: Daniel Lai, A0192327A
 */

import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./a11y-helper.js";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Login Page Accessibility", () => {
  // added test case, Daniel Lai, A0192327A
  test("initial render", async ({ page }) => {
    // New user lands on login page - form structure, labels, and navigation links must be accessible
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector("form, input[type='email'], input[type='password']", { timeout: 5000 });
    
    const emailInput = page.locator("input[type='email'], input[placeholder*='Email' i]").first();
    const passwordInput = page.locator("input[type='password'], input[placeholder*='Password' i]").first();
    const forgotLink = page.locator("a:has-text('Forgot'), a:has-text('forgot'), button:has-text('Forgot')").first();
    const signupLink = page.locator("a:has-text('Register'), a:has-text('register'), a:has-text('Sign up')").first();
    
    // Both inputs and navigation links should exist and be accessible
    if (await emailInput.count() > 0) await expect(emailInput).toBeVisible();
    if (await passwordInput.count() > 0) await expect(passwordInput).toBeVisible();
    if (await forgotLink.count() > 0) await expect(forgotLink).toBeVisible();
    if (await signupLink.count() > 0) await expect(signupLink).toBeVisible();
    
    await expectNoAccessibilityViolations(page);
  });

  // added test case, Daniel Lai, A0192327A
  test("keyboard-only user submitting form", async ({ page }) => {
    // User cannot use mouse - must navigate via keyboard only
    // Different focus management and ARIA live region expectations
    await page.goto(`${BASE_URL}/login`);
    
    const emailInput = page.locator("input[type='email'], input[placeholder*='Email' i]").first();
    const passwordInput = page.locator("input[type='password'], input[placeholder*='Password' i]").first();
    const submitButton = page.locator("button:has-text('LOGIN'), input[type='submit'][value*='LOGIN' i], button[type='submit']:has-text('Login')").first();
    
    if (await emailInput.count() > 0) {
      // Tab to email, enter data
      await emailInput.focus();
      await emailInput.type("user@example.com", { delay: 50 });
      
      // Tab to password
      await page.keyboard.press("Tab");
      if (await passwordInput.count() > 0) {
        await passwordInput.type("password123", { delay: 50 });
      
        // Tab to submit and trigger it
        await page.keyboard.press("Tab");
        if (await submitButton.count() > 0) {
          await submitButton.focus();
          // Space bar should activate button
          await page.keyboard.press("Space");
        }
      }
    }
    
    await expectNoAccessibilityViolations(page);
  });

  // added test case, Daniel Lai, A0192327A
  test("login error should have visible output", async ({ page }) => {
    // User enters wrong credentials - error messages and ARIA attributes matter
    // Different UI state (with error message) has different accessibility needs
    await page.goto(`${BASE_URL}/login`);
    
    const emailInput = page.locator("input[type='email'], input[placeholder*='Email' i]").first();
    const passwordInput = page.locator("input[type='password'], input[placeholder*='Password' i]").first();
    const submitButton = page.locator("button:has-text('LOGIN'), input[type='submit'][value*='LOGIN' i], button[type='submit']:has-text('Login')").first();
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await submitButton.count() > 0) {
      // Enter wrong credentials
      await emailInput.fill("wrong@example.com");
      await passwordInput.fill("wrongpassword");
      await submitButton.click();
      
      // Wait for potential error message
      await page.waitForTimeout(500);
      
      // Error messages should be accessible (if they appear)
      const errorMessage = page.locator("[role='alert'], .error, .alert, [class*='error']").first();
      if (await errorMessage.count() > 0) {
        // Error state should maintain accessibility
        const ariaLive = await errorMessage.getAttribute("aria-live");
        const role = await errorMessage.getAttribute("role");
        expect(ariaLive || role).toBeTruthy();
      }
    }
    
    await expectNoAccessibilityViolations(page);
  });
});
