import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toContainText('Welcome back,');
	await expect(page.getByRole('main')).toContainText('Recently updated collections');
});
