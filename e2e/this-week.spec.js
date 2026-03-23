import { test, expect } from '@playwright/test'
import { resetAppState, createCycle, goToTab } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await resetAppState(page)
})

test('shows Rest Week header when only a future cycle exists', async ({ page }) => {
  // Create a cycle starting next week
  const nextMonday = getNextMonday()
  await createCycle(page, { name: 'Operator', startDate: nextMonday })
  await goToTab(page, 'This Week')

  await expect(page.getByText('Rest Week')).toBeVisible()
})

test('shows upcoming cycle banner with Preview button', async ({ page }) => {
  const nextMonday = getNextMonday()
  await createCycle(page, { name: 'Operator', startDate: nextMonday })
  await goToTab(page, 'This Week')

  await expect(page.getByText(/Operator starts/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Preview →' })).toBeVisible()
})

test('Preview button jumps to cycle first week', async ({ page }) => {
  const nextMonday = getNextMonday()
  await createCycle(page, { name: 'Operator', startDate: nextMonday })
  await goToTab(page, 'This Week')

  await page.getByRole('button', { name: 'Preview →' }).click()
  await expect(page.getByText(/Wave Week/)).toBeVisible()
})

test('Back to current week returns to Rest Week', async ({ page }) => {
  const nextMonday = getNextMonday()
  await createCycle(page, { name: 'Operator', startDate: nextMonday })
  await goToTab(page, 'This Week')

  await page.getByRole('button', { name: 'Preview →' }).click()
  await page.getByRole('button', { name: 'Back to current week' }).click()
  await expect(page.getByText('Rest Week')).toBeVisible()
})

test('shows 7 rest day cards on Rest Week', async ({ page }) => {
  const nextMonday = getNextMonday()
  await createCycle(page, { name: 'Operator', startDate: nextMonday })
  await goToTab(page, 'This Week')

  const restLabels = page.getByText('Rest Day')
  await expect(restLabels).toHaveCount(7)
})

test('shows wave week content when cycle has started', async ({ page }) => {
  const today = new Date().toISOString().split('T')[0]
  await createCycle(page, { name: 'Active', startDate: today })
  await goToTab(page, 'This Week')

  await expect(page.getByText(/Wave Week/)).toBeVisible()
  // Should NOT show the Rest Week banner
  await expect(page.getByText('Rest Week')).not.toBeVisible()
})

// ─── helpers ─────────────────────────────────────────────────────────────────

function getNextMonday() {
  const d = new Date()
  const daysUntilMonday = (8 - d.getDay()) % 7 || 7
  d.setDate(d.getDate() + daysUntilMonday)
  return d.toISOString().split('T')[0]
}
