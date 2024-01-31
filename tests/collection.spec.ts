import { test, expect } from '@playwright/test';

const COLLECTION_NAMES = ['collection one', 'collection two', 'collection three'];

test.describe('New collection', () => {
	test('should create a empty collection', async ({ page }) => {
		await page.goto('http://127.0.0.1:5173/collections');

		await expect(page.locator('h1')).toContainText('Collections');

		await page.getByRole('button', { name: 'New Collection', exact: true }).click();

		await expect(page.getByText('Name', { exact: true })).toBeVisible();

		await page.getByPlaceholder('Tasks').fill(COLLECTION_NAMES[0]);
		await page.getByRole('button', { name: 'Create' }).click();

		await page.getByRole('button', { name: /\bSort by\b/ }).click();

		await page.getByRole('menuitemcheckbox', { name: 'Recently Added' }).click();

		await expect(page.getByTestId('collection-overview').first()).toContainText(
			COLLECTION_NAMES[0]
		);
	});
});
