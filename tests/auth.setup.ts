import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
	await page.goto('/signin');
	await page.getByLabel('Email').fill('john@email.com');
	await page.getByLabel('Password').fill('password');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL('/');
	await expect(page.locator('h1')).toContainText('Welcome back,');
	await expect(page.getByRole('main')).toContainText('Recently updated collections');

	await page.context().storageState({ path: authFile });
});
