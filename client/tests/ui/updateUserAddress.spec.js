import { test, expect } from '@playwright/test';

const BASE_URL = "http://localhost:3000";

test('Update user address successfully while navigating from Cart Page -> Login Page -> Profile Page', async ({ page }) => {
    await page.goto(BASE_URL);

    // Navigate to Cart Page through Header
    await page.getByRole('link', { name: 'Cart' }).click();
    
    // Login from Cart Page
    await page.getByRole('button', { name: 'Please login to checkout' }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).fill("cs4218@test.com"); // Use test account
    await page.getByRole("textbox", { name: "Enter Your Password" }).fill("cs4218@test.com");
    await page.getByRole("button", { name: "Login" }).click();

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