import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Borrow Flow E2E', () => {
  test.beforeEach(() => {
    // Reset demo user's borrowings so they can borrow without hitting limits or duplicates
    execSync('node tests/e2e/reset-demo-user.mjs', { stdio: 'inherit' });
  });

  test('Siswa can login, search, and borrow a book', async ({ page }) => {
    // 1. Go to Login Page
    await page.goto('/login');
    
    // Check if demo mode is enabled in the UI.
    const demoButton = page.locator('#demo-login-siswa');
    await expect(demoButton).toBeVisible({ timeout: 10000 });
    
    // 2. Click demo login for Siswa
    await demoButton.click();
    
    // 3. Wait for dashboard
    await expect(page).toHaveURL(/\/siswa\/dashboard/, { timeout: 15000 });
    
    // 4. Navigate to Catalog
    await page.goto('/siswa/buku');
    await expect(page).toHaveURL(/\/siswa\/buku/);
    
    // 5. Search for a book (e.g., Laskar Pelangi)
    const searchInput = page.locator('#search-buku-siswa');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Laskar Pelangi');
    await page.keyboard.press('Enter');
    
    // Wait for search results to load
    await page.waitForTimeout(2000);
    
    // 6. Click the first book in the list
    const firstBook = page.locator('a[id^="buku-card-"]').first();
    await expect(firstBook).toBeVisible();
    await firstBook.click();
    
    // Wait for detail page
    await expect(page).toHaveURL(/\/siswa\/buku\/\d+/);
    
    // 7. Click Pinjam
    const pinjamBtn = page.locator('button:has-text("Ajukan Pinjam Buku")').first();
    await expect(pinjamBtn).toBeVisible();
    await pinjamBtn.click();
    
    // 8. Submit modal
    const submitBtn = page.locator('button:has-text("Kirim Pengajuan")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
    
    // 9. Verify Success Toast or Redirect
    const successToast = page.locator('text=/Pengajuan peminjaman berhasil/');
    await expect(successToast).toBeVisible({ timeout: 10000 });
  });
});
