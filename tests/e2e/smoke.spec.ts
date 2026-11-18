import { expect, test } from "@playwright/test";

test("home renders the hero and navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /see performance/i })).toBeVisible();
});

test("unknown pages show the themed 404", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText(/stopped out/i)).toBeVisible();
});

test("every public route responds", async ({ request }) => {
  const routes = ["/performance", "/accounts", "/payouts", "/journal", "/journal?view=days", "/strategies", "/tools", "/firms", "/toolkit", "/insights", "/about", "/contact", "/disclaimer", "/privacy", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest"];
  for (const r of routes) {
    const res = await request.get(r);
    expect(res.status(), r).toBe(200);
  }
});

test("admin redirects to login when signed out", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: /admin sign in/i })).toBeVisible();
});

test("admin sub-pages also require sign-in", async ({ page }) => {
  await page.goto("/admin/trades/quick");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("ingest endpoint rejects unsigned requests", async ({ request }) => {
  const res = await request.post("/api/ingest/trade", { data: { symbol: "X" } });
  expect([401, 503]).toContain(res.status());
});

// Requires a Supabase project + admin credentials: set E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
test("quick-add trade flow", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, "Admin credentials not provided");
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/trades/quick");
  await page.getByPlaceholder(/e\.g\. 450/).fill("123.45");
  await page.getByRole("button", { name: /save trade/i }).click();
  await expect(page.getByText(/trade saved/i)).toBeVisible();
});
