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
  const routes = [
    "/performance",
    "/accounts",
    "/payouts",
    "/journal",
    "/strategies",
    "/tools",
    "/firms",
    "/toolkit",
    "/insights",
    "/about",
    "/contact",
    "/disclaimer",
    "/privacy",
  ];
  for (const r of routes) {
    const res = await request.get(r);
    expect(res.status(), r).toBe(200);
  }
});
