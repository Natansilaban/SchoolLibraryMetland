import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['Pixel 7'],
  colorScheme: 'dark',
  permissions: ['microphone'],
});

test.describe('Mobile Voice Search UX & Geometry Regression', () => {

  test('VoiceSearchButton fits seamlessly inside search input without overflow or stuck highlight', async ({ page }) => {
    await page.goto('/login');
    await page.click('#demo-login-siswa');
    await page.waitForURL(/\/siswa\/dashboard/);

    await page.goto('/siswa/buku');
    await page.waitForSelector('#search-buku-siswa');

    const searchInput = page.locator('#search-buku-siswa');
    const micBtn = page.locator('#btn-voice-search');

    await expect(searchInput).toBeVisible();
    await expect(micBtn).toBeVisible();

    const inputBounds = await searchInput.boundingBox();
    const micBounds = await micBtn.boundingBox();

    expect(inputBounds).not.toBeNull();
    expect(micBounds).not.toBeNull();

    // Verify button fits within input boundaries (no overflow)
    expect(micBounds.y).toBeGreaterThanOrEqual(inputBounds.y);
    expect(micBounds.y + micBounds.height).toBeLessThanOrEqual(inputBounds.y + inputBounds.height);
    expect(micBounds.x + micBounds.width).toBeLessThanOrEqual(inputBounds.x + inputBounds.width);

    // Tap mic button to open voice modal
    await micBtn.tap();

    // Verify modal opens upon tap
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Pencarian Suara')).toBeVisible();

    // Verify closing modal via escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
