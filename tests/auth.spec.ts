import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
	await page.goto('http://localhost:5173/signin');
	await page.getByLabel('Email').click();
	await page.getByLabel('Email').fill('john@email.com');
	await page.getByLabel('Email').press('Tab');
	await page.getByLabel('Password').fill('password');
	await page.getByLabel('Password').press('Enter');
	await page.waitForURL('http://localhost:5173/');
	await expect(page.locator('h1')).toContainText('Welcome back,');
	await expect(page.getByRole('main')).toContainText('Recently updated collections');
});
