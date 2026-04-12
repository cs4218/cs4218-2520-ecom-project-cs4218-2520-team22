// Lim Jun Xian A0259094U
import { test, expect } from '@playwright/test';

test('Update user address successfully while navigating from Cart Page -> Login Page -> Profile Page', async ({ page }) => {
    await page.goto('/');

    // Navigate to Cart Page through Header
    await page.getByRole('link', { name: 'Cart' }).click();
    
    // Login from Cart Page
    await page.getByRole('button', { name: 'Please login to checkout' }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).fill("e2e.user@test.com"); // Use test account
    await page.getByRole("textbox", { name: "Enter Your Password" }).fill("User@e2e123");
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL((url) => !url.toString().includes("/login"), {
        timeout: 10000,
    });

    // Navigate back to Cart Page
    await page.getByRole('link', { name: 'Cart' }).click();

    // Click on update address button
    await page.getByRole('button', { name: 'Update Address' }).click();

    // Update address
    await page.getByRole("textbox", { name: "Enter Your Address" }).fill("123 Test Road");
    await page.getByRole('button', { name: 'UPDATE' }).click();

    // Navigate back to Cart Page and ensure that address is correctly updated
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.getByText('123 Test Road')).toBeVisible({ timeout: 5000 });
});