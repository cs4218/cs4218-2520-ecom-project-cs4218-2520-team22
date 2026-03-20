import { test, expect } from '@playwright/test';
import { E2E_PREFIX } from "./helpers/globalSetup.js";

const GREENSHIRT = `${E2E_PREFIX}Green Shirt`;
const USERNAME = `${E2E_PREFIX}User`;

test("Make payment successfully for items added to cart", async({page}) => {
    await page.goto('/');
    // Add the product to cart
    const greenShirtCard = await page.locator(".card.m-2", { hasText: GREENSHIRT });
    await greenShirtCard.getByRole("button", { name: "ADD TO CART" }).click();
    await expect(page.getByText('Item Added to cart')).toBeVisible();

    // Navigate to Cart Page
    await page.getByRole('link', { name: 'Cart' }).click();

    // Login from Cart Page
    await page.getByRole('button', { name: 'Please login to checkout' }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).fill("e2e.user@test.com"); // Use test account
    await page.getByRole("textbox", { name: "Enter Your Password" }).fill("User@e2e123");
    await page.getByRole("button", { name: "Login" }).click();

    // Navigate back to Cart Page
    await page.getByRole('link', { name: 'Cart' }).click();

    // Wait for payment option to load
    await expect(page.getByText("Choose a way to pay")).toBeVisible();
    
    // Keying in card details
    await page.getByRole('button', { name: 'Paying with Card' }).click();
    await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('4111 1111 1111 1111');
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('1126');
    await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('111');

    // Proceed and make payment
    await page.getByRole('button', { name: 'Make Payment' }).click();

    // Check that the user is directed to order page
    await expect(page).toHaveURL('http://localhost:3000/dashboard/user/orders');
    await expect(page.getByText('All Orders')).toBeVisible({ timeout: 5000 });

    // Check that order information that is just placed is visible
    await expect(page.getByRole('main')).toContainText(GREENSHIRT);
    await expect(page.getByRole('main')).toContainText('a few seconds ago');
    await expect(page.getByRole('main')).toContainText(USERNAME);

    // Navigate back to Cart Page to ensure that the cart is emptied
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.getByText(/Your Cart Is Empty/)).toBeVisible({ timeout: 5000 });
});