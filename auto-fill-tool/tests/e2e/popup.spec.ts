/**
 * E2E Tests for Popup Page
 *
 * Tests the main functionality of the Auto Fill Tool popup:
 * - Website list display
 * - Add website modal
 * - Edit website modal
 * - Delete website
 * - Navigation to other pages
 */

import { test, expect } from '@playwright/test';
import { loadExtension, closeExtension, ExtensionContext } from './helpers/extension-loader';

test.describe('Popup Page - Main Functionality', () => {
  let extension: ExtensionContext;

  test.beforeEach(async () => {
    // Load extension before each test
    extension = await loadExtension();
  });

  test.afterEach(async () => {
    // Close extension after each test
    await closeExtension(extension);
  });

  test('should display popup title', async () => {
    const { popupPage } = extension;

    // Check that the page title is correct
    const title = await popupPage.locator('h1').textContent();
    expect(title).toContain('自動入力ツール');
  });

  test('should display control buttons', async () => {
    const { popupPage } = extension;

    // Check that all control buttons are visible
    const addWebsiteBtn = popupPage.locator('#addWebsiteBtn');
    const xpathManagerBtn = popupPage.locator('#xpathManagerBtn');
    const automationVariablesManagerBtn = popupPage.locator('#automationVariablesManagerBtn');
    const dataSyncBtn = popupPage.locator('#dataSyncBtn');
    const settingsBtn = popupPage.locator('#settingsBtn');

    await expect(addWebsiteBtn).toBeVisible();
    await expect(xpathManagerBtn).toBeVisible();
    await expect(automationVariablesManagerBtn).toBeVisible();
    await expect(dataSyncBtn).toBeVisible();
    await expect(settingsBtn).toBeVisible();
  });

  test('should show empty state when no websites registered', async () => {
    const { popupPage } = extension;

    // Check if empty state message is visible
    const emptyState = popupPage.locator('.empty-state');
    const emptyStateText = await emptyState.textContent();
    expect(emptyStateText).toContain('Webサイトが登録されていません');
  });

  test('should open add website modal when clicking add button', async () => {
    const { popupPage } = extension;

    // Click add website button
    const addWebsiteBtn = popupPage.locator('#addWebsiteBtn');
    await addWebsiteBtn.click();

    // Wait for modal to appear
    await popupPage.waitForTimeout(300); // Wait for animation

    // Check that modal is visible
    const modal = popupPage.locator('#editModal');
    await expect(modal).toBeVisible();

    // Check modal header
    const modalHeader = popupPage.locator('.modal-header');
    const headerText = await modalHeader.textContent();
    expect(headerText).toContain('Webサイト設定');
  });

  test('should close modal when clicking cancel button', async () => {
    const { popupPage } = extension;

    // Open modal
    const addWebsiteBtn = popupPage.locator('#addWebsiteBtn');
    await addWebsiteBtn.click();
    await popupPage.waitForTimeout(300);

    // Click cancel button
    const cancelBtn = popupPage.locator('#cancelBtn');
    await cancelBtn.click();

    // Wait for modal to close
    await popupPage.waitForTimeout(300);

    // Check that modal is hidden (Alpine.js controls visibility via x-show directive)
    const modal = popupPage.locator('#editModal');
    await expect(modal).toBeHidden();
  });

  test('should add variable field when clicking add variable button', async () => {
    const { popupPage } = extension;

    // Open modal
    const addWebsiteBtn = popupPage.locator('#addWebsiteBtn');
    await addWebsiteBtn.click();
    await popupPage.waitForTimeout(300);

    // Click add variable button
    const addVariableBtn = popupPage.locator('#addVariableBtn');
    await addVariableBtn.click();

    // Wait for variable field to appear
    await popupPage.waitForTimeout(200);

    // Check that variable field was added
    const variablesList = popupPage.locator('#variablesList');
    const variableFields = variablesList.locator('.variable-item');
    const count = await variableFields.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should validate required fields in add modal', async () => {
    const { popupPage } = extension;

    // Open modal
    const addWebsiteBtn = popupPage.locator('#addWebsiteBtn');
    await addWebsiteBtn.click();
    await popupPage.waitForTimeout(300);

    // Try to submit without filling required fields
    const editForm = popupPage.locator('#editForm');

    // Submit form (will trigger validation)
    const submitBtn = editForm.locator('button[type="submit"]');
    await submitBtn.click();

    // Check that form validation prevents submission
    const nameInput = popupPage.locator('#editName');
    const isInvalid = await nameInput.evaluate((input: HTMLInputElement) => {
      return !input.validity.valid;
    });
    expect(isInvalid).toBe(true);
  });

  test('should open XPath manager in new tab', async () => {
    const { popupPage, extensionId } = extension;

    // Get initial page count
    const context = popupPage.context();
    const initialPageCount = context.pages().length;

    // Click XPath manager button
    const xpathManagerBtn = popupPage.locator('#xpathManagerBtn');
    await xpathManagerBtn.click();

    // Wait for new page to open
    await popupPage.waitForTimeout(1000);

    // Check that new page was opened
    const newPageCount = context.pages().length;
    expect(newPageCount).toBe(initialPageCount + 1);

    // Check that the new page is XPath manager
    const newPage = context.pages()[newPageCount - 1];
    const url = newPage.url();
    expect(url).toContain('xpath-manager.html');

    await newPage.close();
  });

  test('should open automation variables manager in new tab', async () => {
    const { popupPage } = extension;

    // Get initial page count
    const context = popupPage.context();
    const initialPageCount = context.pages().length;

    // Click automation variables manager button
    const automationVariablesBtn = popupPage.locator('#automationVariablesManagerBtn');
    await automationVariablesBtn.click();

    // Wait for new page to open
    await popupPage.waitForTimeout(1000);

    // Check that new page was opened
    const newPageCount = context.pages().length;
    expect(newPageCount).toBe(initialPageCount + 1);

    // Check that the new page is automation variables manager
    const newPage = context.pages()[newPageCount - 1];
    const url = newPage.url();
    expect(url).toContain('automation-variables-manager.html');

    await newPage.close();
  });

  test('should open system settings in new tab', async () => {
    const { popupPage } = extension;

    // Get initial page count
    const context = popupPage.context();
    const initialPageCount = context.pages().length;

    // Click settings button
    const settingsBtn = popupPage.locator('#settingsBtn');
    await settingsBtn.click();

    // Wait for new page to open
    await popupPage.waitForTimeout(1000);

    // Check that new page was opened
    const newPageCount = context.pages().length;
    expect(newPageCount).toBe(initialPageCount + 1);

    // Check that the new page is system settings
    const newPage = context.pages()[newPageCount - 1];
    const url = newPage.url();
    expect(url).toContain('system-settings.html');

    await newPage.close();
  });

  test('should have proper accessibility attributes', async () => {
    const { popupPage } = extension;

    // Check that buttons have proper labels
    const addWebsiteBtn = popupPage.locator('#addWebsiteBtn');
    const btnText = await addWebsiteBtn.textContent();
    expect(btnText).toBeTruthy();
    expect(btnText!.length).toBeGreaterThan(0);

    // Check that form inputs have labels
    await addWebsiteBtn.click();
    await popupPage.waitForTimeout(300);

    const nameInput = popupPage.locator('#editName');
    const nameLabel = popupPage.locator('label[for="editName"]');
    await expect(nameLabel).toBeVisible();
  });

  test('should apply i18n translations', async () => {
    const { popupPage } = extension;

    // Check that elements with data-i18n attribute have translated text
    const titleElement = popupPage.locator('h1[data-i18n="popupTitle"]');
    const titleText = await titleElement.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText!.trim()).not.toBe('popupTitle'); // Should not be the key itself
  });
});

test.describe('Popup Page - Website Operations', () => {
  let extension: ExtensionContext;

  test.beforeEach(async () => {
    extension = await loadExtension();
  });

  test.afterEach(async () => {
    await closeExtension(extension);
  });

  test('should add a new website successfully', async () => {
    const { popupPage } = extension;

    // Open add modal
    const addWebsiteBtn = popupPage.locator('#addWebsiteBtn');
    await addWebsiteBtn.click();
    await popupPage.waitForTimeout(300);

    // Fill in form
    const nameInput = popupPage.locator('#editName');
    await nameInput.fill('Test Website');

    const statusSelect = popupPage.locator('#editStatus');
    await statusSelect.selectOption('enabled');

    const editableSelect = popupPage.locator('#editEditable');
    await editableSelect.selectOption('true');

    const startUrlInput = popupPage.locator('#editStartUrl');
    await startUrlInput.fill('https://example.com');

    // Submit form
    const submitBtn = popupPage.locator('#editForm button[type="submit"]');
    await submitBtn.click();

    // Wait for modal to close and website to be added
    await popupPage.waitForTimeout(1000);

    // Check that website appears in the list
    const websiteList = popupPage.locator('#websiteList');
    const websiteItems = websiteList.locator('.website-item');
    const count = await websiteItems.count();
    expect(count).toBeGreaterThan(0);

    // Check that empty state is hidden
    const emptyState = popupPage.locator('.empty-state');
    const isVisible = await emptyState.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});
