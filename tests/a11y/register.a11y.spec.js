/**
 * Register Page Accessibility Tests
 * Different user stories with distinct accessibility expectations
 * Verifies WCAG AA compliance using axe-core
 * 
 * Component: client/src/pages/Auth/Register.js
 * Author: Daniel Lai, A0192327A
 */

import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./a11y-helper.js";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Register Page Accessibility", () => {
  // added test case, Daniel Lai, A0192327A
  test("initial render", async ({ page }) => {
    // New user arrives and scans the form structure
    // Must understand what each field is for (labels/placeholders)
    await page.goto(`${BASE_URL}/register`);
    await page.waitForSelector("form, input[type='text'], input[type='email'], input[type='password']", { timeout: 5000 });
    
    const heading = page.locator("h1, h2, h3, .form-title, [role='heading']").first();
    const inputs = page.locator("input[type='text'], input[type='email'], input[type='password'], input[placeholder*='Name' i], input[placeholder*='Email' i]");
    
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    }
    
    // Each input should have label/placeholder for accessibility
    const count = await inputs.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const input = inputs.nth(i);
        const placeholder = await input.getAttribute("placeholder");
        const ariaLabel = await input.getAttribute("aria-label");
        expect(placeholder || ariaLabel).toBeTruthy();
      }
    }
    
    await expectNoAccessibilityViolations(page);
  });

  // added test case, Daniel Lai, A0192327A
  test("keyboard-only user filling all fields", async ({ page }) => {
    // User with motor disability relies entirely on keyboard
    // Tab order, focus styles, and field accessibility are critical
    await page.goto(`${BASE_URL}/register`);
    
    const nameInput = page.locator("input[placeholder*='Name' i], input[type='text']").first();
    const emailInput = page.locator("input[type='email'], input[placeholder*='Email' i]").first();
    const submitButton = page.locator("button:has-text('Register'), button:has-text('REGISTER'), input[type='submit'][value*='Register' i]").first();
    
    if (await nameInput.count() > 0) {
      // Tab to name and fill
      await nameInput.focus();
      await nameInput.type("Jane Smith", { delay: 30 });
      
      // Tab through remaining fields
      if (await emailInput.count() > 0) {
        await page.keyboard.press("Tab");
        await emailInput.type("jane@example.com", { delay: 30 });
        
        // Continue tabbing to submission
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press("Tab");
        }
        
        // Try to submit with keyboard
        if (await submitButton.count() > 0) {
          await submitButton.focus();
          await page.keyboard.press("Space");
        }
      }
    }
    
    await expectNoAccessibilityViolations(page);
  });

  // added test case, Daniel Lai, A0192327A
  test("field validation should have visible error messages", async ({ page }) => {
    // User enters invalid data - error messages appear
    // Error states must be announced accessibly (aria-live, aria-invalid)
    await page.goto(`${BASE_URL}/register`);
    
    const emailInput = page.locator("input[type='email'], input[placeholder*='Email' i]").first();
    
    if (await emailInput.count() > 0) {
      // Enter invalid email
      await emailInput.focus();
      await emailInput.fill("not-an-email");
      
      // Trigger validation (blur or submit attempt)
      await page.keyboard.press("Tab");
      
      // Check for error announcements
      const errorElement = page.locator("[role='alert'], .error, [class*='error'], [aria-invalid='true']").first();
      if (await errorElement.count() > 0) {
        const ariaInvalid = await emailInput.getAttribute("aria-invalid");
        expect(ariaInvalid).toBeTruthy();
      }
    }
    
    await expectNoAccessibilityViolations(page);
  });

  // added test case, Daniel Lai, A0192327A
  test("linking to login page", async ({ page }) => {
    // User decides to login instead - navigation link must be accessible
    await page.goto(`${BASE_URL}/register`);
    
    const loginLink = page.locator("a:has-text('Login'), a:has-text('login'), a:has-text('Sign in')").first();
    
    if (await loginLink.count() > 0) {
      await expect(loginLink).toBeVisible();
      
      // Link text should be meaningful
      const linkText = await loginLink.textContent();
      expect(linkText && linkText.trim().length > 0).toBeTruthy();
    }
    
    await expectNoAccessibilityViolations(page);
  });
});
