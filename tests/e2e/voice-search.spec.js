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

    // Verify touch action and no harsh sticky blue
    await micBtn.tap();

    const styles = await micBtn.evaluate(el => {
      const s = window.getComputedStyle(el);
      return {
        outlineColor: s.outlineColor,
        outlineStyle: s.outlineStyle,
      };
    });

    // Should not have any jarring blue outline
    expect(styles.outlineStyle === 'none' || styles.outlineColor !== 'rgb(37, 99, 235)').toBeTruthy();
  });
});
