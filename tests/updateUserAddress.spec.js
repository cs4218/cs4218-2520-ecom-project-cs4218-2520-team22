import { test, expect } from '@playwright/test';
import dotenv from "dotenv";
import mongoose from "mongoose";
import userModel from "../models/userModel";

dotenv.config();

const BASE_URL = "http://localhost:3000";

test.beforeEach(async ({ page }) => {
    await mongoose.connect(process.env.MONGO_URL);

    const hashedPassword = "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy";

    await new userModel({
        name: "Test",
        email: "test@email.com",
        phone: "81234567",
        address: "test",
        password: hashedPassword,
        answer: "password is cs4218@test.com",
    }).save(); 
});

test.afterEach(async () => {
    await userModel.deleteMany({ email: "test@email.com" });
    await mongoose.disconnect();
});

test('Update user address successfully while navigating from Cart Page -> Login Page -> Profile Page', async ({ page }) => {
    await page.goto(BASE_URL);

    // Navigate to Cart Page through Header
    await page.getByRole('link', { name: 'Cart' }).click();
    
    // Login from Cart Page
    await page.getByRole('button', { name: 'Please login to checkout' }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).fill("test@email.com");
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