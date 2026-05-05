import { expect, test } from '@playwright/test';

test('generate shows an SVG preview', async ({ page, request }) => {
  // Wait for API to be up too (webServer waits on :3000 only).
  const health = await request.get('http://localhost:4000/v1/health');
  expect(health.ok()).toBeTruthy();

  await page.goto('/');

  const lyric = `Hold on
Hold on
We will be fine
Hold on
We will be fine
Hold on`;

  await page.locator('#lyric-input').fill(lyric);
  await page.locator('#generate-btn').click();

  await expect(page.locator('#svg-preview svg')).toBeVisible();
});

