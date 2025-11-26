import { expect, test, type Page, type Route } from "@playwright/test";

const ensureCanvasClick = async (page: Page, offsets: Array<[number, number]>) => {
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  for (const [offsetX, offsetY] of offsets) {
    await canvas.click({ position: { x: offsetX, y: offsetY } });
  }
};

const respondJson = (route: Route, data: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });

const stubPolygons = [
  {
    id: "stub-1",
    name: "Stub Polygon",
    points: [
      [10, 10],
      [20, 40],
      [40, 10],
    ],
  },
];

const mockPolygonsApi = async (page: Page) => {
  await page.route("**/api/polygons", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await respondJson(route, stubPolygons);
      return;
    }
    if (method === "POST") {
      const payload = JSON.parse(route.request().postData() ?? "{}");
      const polygon = { id: "server-mock", ...payload };
      await respondJson(route, polygon, 201);
      return;
    }
    await route.fallback();
  });

  await page.route("**/api/polygons/*", async (route) => {
    if (route.request().method() === "DELETE") {
      await respondJson(route, { success: true });
      return;
    }
    await route.fallback();
  });
};

test.describe("Polygon canvas experience", () => {
  test("loads polygons list and allows selection", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /canvas editor/i })).toBeVisible();
    const firstListButton = page.getByRole("button", { name: /^polygon/i }).first();
    await firstListButton.waitFor();
    await firstListButton.click();

    const deleteButton = page.getByRole("button", { name: /delete selected/i });
    await expect(deleteButton).toBeEnabled({ timeout: 15_000 });
  });

  test("completes drawing flow up to naming dialog", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /^polygon/i }).first()).toBeVisible();

    const addButton = page.getByRole("button", { name: /add polygon/i });
    await addButton.click();
    await expect(page.getByRole("button", { name: /cancel drawing/i })).toBeVisible();

    await ensureCanvasClick(page, [
      [20, 20],
      [80, 20],
      [50, 80],
    ]);

    const finishButton = page.getByRole("button", { name: /finish polygon/i });
    await expect(finishButton).toBeEnabled({ timeout: 15_000 });
    await finishButton.click();

    const namingDialogHeading = page.getByRole("heading", { name: /name your polygon/i });
    await expect(namingDialogHeading).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(namingDialogHeading).toBeHidden();
  });

  test("saves a polygon and shows success toast", async ({ page }) => {
    await mockPolygonsApi(page);
    await page.goto("/");

    const addButton = page.getByRole("button", { name: /add polygon/i });
    await addButton.click();
    await ensureCanvasClick(page, [
      [30, 30],
      [80, 30],
      [50, 80],
    ]);
    const finishButton = page.getByRole("button", { name: /finish polygon/i });
    await expect(finishButton).toBeEnabled();
    await finishButton.click();

    const nameInput = page.getByLabel(/polygon name/i);
    await nameInput.fill("Playwright Polygon");
    await page.getByRole("button", { name: /^save$/i }).click();

    const successToast = page.getByRole("alert").filter({ hasText: /polygon added/i });
    await expect(successToast).toBeVisible();
  });

  test("deletes a polygon and shows success toast", async ({ page }) => {
    await mockPolygonsApi(page);
    await page.goto("/");

    const firstPolygonButton = page.getByRole("button", { name: /stub polygon/i }).first();
    await firstPolygonButton.click();

    const deleteButton = page.getByRole("button", { name: /delete selected/i });
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    const deleteToast = page.getByRole("alert").filter({ hasText: /polygon deleted/i });
    await expect(deleteToast).toBeVisible();
  });
});
