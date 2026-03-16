import { test, expect } from '@playwright/test';
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";
import orderModel from '../models/orderModel';

dotenv.config();

const BASE_URL = "http://localhost:3000";

let user

test.beforeEach(async ({ page }) => {
    await mongoose.connect(process.env.MONGO_URL);

    const hashedPassword = "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";

    user = await new userModel({
        name: "Test",
        email: "test@yahoo.com",
        phone: "81234567",
        address: "test",
        password: hashedPassword,
        answer: "password is cs4218@test.com",
    }).save(); 
});

test.afterEach(async () => {
    await userModel.deleteMany({ email: "test@yahoo.com" });
    await orderModel.deleteMany({ buyer: user._id });
    await mongoose.disconnect();
});

test("Make payment successfully for items added to cart", async({page}) => {
    await page.goto(BASE_URL);
    // Add the first product to cart
    await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
    await expect(page.getByText('Item Added to cart')).toBeVisible();

    // Navigate to Cart Page
    await page.getByRole('link', { name: 'Cart' }).click();

    // Login from Cart Page
    await page.getByRole('button', { name: 'Please login to checkout' }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).fill("test@yahoo.com");
    await page.getByRole("textbox", { name: "Enter Your Password" }).fill("cs4218@test.com");
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
    await expect(page.getByRole('main')).toContainText('Novel');
    await expect(page.getByRole('main')).toContainText('a few seconds ago');
    await expect(page.getByRole('main')).toContainText('Test');

    // Navigate back to Cart Page to ensure that the cart is emptied
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.getByText(/Your Cart Is Empty/)).toBeVisible({ timeout: 5000 });
});