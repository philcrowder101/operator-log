import { test, expect } from '@playwright/test'
import { resetAppState, goToTab } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await resetAppState(page)
})

test('renders the tab bar with all three tabs', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'This Week' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Actions' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
})

test('navigates to Settings tab', async ({ page }) => {
  await goToTab(page, 'Settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})

test('navigates to Actions tab', async ({ page }) => {
  await goToTab(page, 'Actions')
  // Actions / Lifts view renders a heading
  await expect(page.getByRole('heading', { name: 'Actions' })).toBeVisible()
})

test('navigates back to This Week tab', async ({ page }) => {
  await goToTab(page, 'Settings')
  await goToTab(page, 'This Week')
  await expect(page.getByRole('heading', { name: 'This Week' }).or(
    page.getByText('No cycles yet')
  )).toBeVisible()
})
