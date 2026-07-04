import { test, expect } from '@playwright/test'
import { resetAppState, createCycle, goToTab } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await resetAppState(page)
})

test('assigns AB Triad in Settings and shows it on This Week', async ({ page }) => {
  const today = new Date().toISOString().split('T')[0]
  await createCycle(page, { name: 'Core Cycle', startDate: today })

  // The new cycle is auto-expanded after creation; open Core Work Schedule
  await page.getByRole('button', { name: 'Core Work Schedule' }).click()

  // Assign to the first day row (Sun) on week 1
  await page.getByRole('button', { name: '+ Assign' }).first().click()
  await page.getByRole('button', { name: /AB Triad Plank, Shank/ }).click()
  await page.getByRole('button', { name: 'Save' }).click()

  // Row now shows the assignment
  await expect(page.getByText('AB Triad · 3×')).toBeVisible()

  // Shows up on This Week
  await goToTab(page, 'This Week')
  await expect(page.getByText('AB Triad')).toBeVisible()
  await expect(page.getByText('Plank')).toBeVisible()
  await expect(page.getByText('Wheel Rollout')).toBeVisible()
  await expect(page.getByText('3 rounds · 2 min rest')).toBeVisible()
})

test('assigns AB Triad 2 with toe-to-bar movements', async ({ page }) => {
  const today = new Date().toISOString().split('T')[0]
  await createCycle(page, { name: 'Core Cycle 2', startDate: today })

  await page.getByRole('button', { name: 'Core Work Schedule' }).click()
  await page.getByRole('button', { name: '+ Assign' }).first().click()
  await page.getByRole('button', { name: /AB Triad 2/ }).click()
  await page.getByRole('button', { name: 'Save' }).click()

  await goToTab(page, 'This Week')
  await expect(page.getByText('AB Triad 2')).toBeVisible()
  await expect(page.getByText('Hanging Leg Raises')).toBeVisible()
})

test('removes an assignment', async ({ page }) => {
  const today = new Date().toISOString().split('T')[0]
  await createCycle(page, { name: 'Core Cycle 3', startDate: today })

  await page.getByRole('button', { name: 'Core Work Schedule' }).click()
  await page.getByRole('button', { name: '+ Assign' }).first().click()
  await page.getByRole('button', { name: /Bird Dogs & Side Planks/ }).click()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Bird Dogs & Side Planks · 3×')).toBeVisible()

  await page.getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByText('Bird Dogs & Side Planks · 3×')).not.toBeVisible()
})
