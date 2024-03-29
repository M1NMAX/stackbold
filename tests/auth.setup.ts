import { test as setup, expect } from '@playwright/test';
import 'dotenv/config';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
	setup.setTimeout(60000);
	const email = process.env.PW_TEST_EMAIL as string;
	const password = process.env.PW_TEST_PWD as string;

	await page.goto('/signin');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL('/');
	await expect(page.locator('h1')).toContainText('Welcome!');

	await page.context().storageState({ path: authFile });
});
