/**
 * Clear the app's IndexedDB and reload so it starts from a clean state.
 * seedIfEmpty() will re-populate templates on reload but leaves cycles/lifts empty.
 */
export async function resetAppState(page) {
  await page.evaluate(() => indexedDB.deleteDatabase('OperatorLogDB'))
  await page.reload()
  // Wait for the app to finish seeding and render the tab bar
  await page.getByRole('button', { name: 'This Week' }).waitFor()
}

/**
 * Navigate to a tab by its label.
 */
export async function goToTab(page, label) {
  await page.getByRole('button', { name: label }).click()
}

/**
 * Create a cycle via the Settings UI.
 * @param {import('@playwright/test').Page} page
 * @param {{ name?: string, startDate?: string, templateId?: string }} opts
 */
export async function createCycle(page, { name = 'Test Cycle', startDate, templateId } = {}) {
  await goToTab(page, 'Settings')
  await page.getByRole('button', { name: '+ New Cycle' }).click()

  // Name
  const nameInput = page.getByPlaceholder('Cycle name')
  await nameInput.clear()
  await nameInput.fill(name)

  // Start date (optional override) — label is not programmatically linked, use type selector
  if (startDate) {
    await page.locator('input[type="date"]').fill(startDate)
  }

  // Template (optional override)
  if (templateId) {
    await page.getByRole('combobox').selectOption(templateId)
  }

  await page.getByRole('button', { name: 'Create' }).click()
}
