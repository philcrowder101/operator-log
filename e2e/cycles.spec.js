import { test, expect } from '@playwright/test'
import { resetAppState, createCycle, goToTab } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await resetAppState(page)
})

test('shows "No cycles yet" on This Week when no cycles exist', async ({ page }) => {
  await expect(page.getByText('No cycles yet')).toBeVisible()
})

test('creates a cycle and shows it in Settings', async ({ page }) => {
  await createCycle(page, { name: 'Alpha Cycle' })
  await expect(page.getByText('Alpha Cycle')).toBeVisible()
})

test('creates a cycle with today as start date and shows active week view', async ({ page }) => {
  const today = new Date().toISOString().split('T')[0]
  await createCycle(page, { name: 'Active Cycle', startDate: today })
  await goToTab(page, 'This Week')
  // Active cycle should show Wave Week header
  await expect(page.getByText(/Wave Week/)).toBeVisible()
})

test('deletes a cycle', async ({ page }) => {
  await createCycle(page, { name: 'Temp Cycle' })
  // Accept the confirm() dialog that the delete button triggers
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByTitle('Delete cycle').click()
  await expect(page.getByText('Temp Cycle')).not.toBeVisible()
})
