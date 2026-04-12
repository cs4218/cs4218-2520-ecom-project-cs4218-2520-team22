/**
 * Forgot Password Page Accessibility Tests
 * Different user stories with distinct accessibility expectations
 * Verifies WCAG AA compliance using axe-core
 * 
 * Component: client/src/pages/Auth/ForgotPassword.js
 * Author: Daniel Lai, A0192327A
 */

import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./a11y-helper.js";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Forgot Password Page Accessibility", () => {
  // added test case, Daniel Lai, A0192327A
  test("initiate password reset", async ({ page }) => {
    // User lands on forgot password and needs to understand the flow
    // Form structure must be clear: what input is needed and why
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.waitForSelector("form, input[type='email'], input[placeholder*='Email' i]", { timeout: 5000 }).catch(() => {});
    
    const emailInput = page.locator("input[type='email'], input[placeholder*='Email' i]").first();
    const heading = page.locator("h1, h2, h3, [role='heading']").first();
    
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    }
    
    if (await emailInput.count() > 0) {
      await expect(emailInput).toBeVisible();
      const placeholder = await emailInput.getAttribute("placeholder");
      const ariaLabel = await emailInput.getAttribute("aria-label");
      expect(placeholder || ariaLabel).toBeTruthy();
    }
    
    await expectNoAccessibilityViolations(page);
  });

  // added test case, Daniel Lai, A0192327A
  test("keyboard-only user form completion", async ({ page }) => {
    // User answers security question to verify identity
    // Keyboard navigation through multi-part form is critical
    await page.goto(`${BASE_URL}/forgot-password`);
    
    const emailInput = page.locator("input[type='email'], input[placeholder*='Email' i]").first();
    const answerInput = page.locator("input[placeholder*='Answer' i], input[placeholder*='answer' i], input[placeholder*='Security' i]").first();
    const passwordInput = page.locator("input[type='password'], input[placeholder*='Password' i]").first();
    
    if (await emailInput.count() > 0) {
      // Tab and fill email
      await emailInput.focus();
      await emailInput.type("user@example.com", { delay: 30 });
      
      // Tab to security answer if present
      await page.keyboard.press("Tab");
      if (await answerInput.count() > 0) {
        await answerInput.type("security answer", { delay: 30 });
        
        // Tab to new password
        await page.keyboard.press("Tab");
        if (await passwordInput.count() > 0) {
          await passwordInput.type("NewPassword123!", { delay: 30 });
          
          // Tab to submit and trigger
          await page.keyboard.press("Tab");
          const submitBtn = page.locator("button:has-text('Reset'), button:has-text('RESET'), button:has-text('Submit'), input[type='submit']").first();
          if (await submitBtn.count() > 0) {
            await submitBtn.focus();
            await page.keyboard.press("Space");
          }
        }
      }
    }
    
    await expectNoAccessibilityViolations(page);
  });

  // added test case, Daniel Lai, A0192327A
  test("announcement when security question fails", async ({ page }) => {
    // User enters wrong security answer
    // Error message must be announced accessibly
    await page.goto(`${BASE_URL}/forgot-password`);
    
    const emailInput = page.locator("input[type='email'], input[placeholder*='Email' i]").first();
    const answerInput = page.locator("input[placeholder*='Answer' i], input[placeholder*='answer' i]").first();
    const submitBtn = page.locator("button:has-text('Reset'), button:has-text('Submit'), input[type='submit']").first();
    
    if (await emailInput.count() > 0 && await answerInput.count() > 0 && await submitBtn.count() > 0) {
      // Enter email and wrong answer
      await emailInput.fill("user@example.com");
      await answerInput.fill("wrong answer");
      await submitBtn.click();
      
      // Wait for error message
      await page.waitForTimeout(500);
      
      // Check for error announcements
      const errorElement = page.locator("[role='alert'], .error, [class*='error']").first();
      if (await errorElement.count() > 0) {
        const ariaLive = await errorElement.getAttribute("aria-live");
        const role = await errorElement.getAttribute("role");
        expect(ariaLive || role).toBeTruthy();
      }
    }
    
    await expectNoAccessibilityViolations(page);
  });
});
