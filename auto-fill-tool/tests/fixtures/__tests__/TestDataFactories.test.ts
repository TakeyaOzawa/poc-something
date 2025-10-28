/**
 * Test: Test Data Factories
 * Verifies that the test data factories work correctly.
 */

import {
  createTestXPath,
  createTestXPaths,
  createTestWebsite,
  createTestWebsites,
  createTestVariables,
  XPathPresets,
  WebsitePresets,
} from '../TestDataFactories';
import { ACTION_TYPE } from '@domain/constants/ActionType';

describe('TestDataFactories', () => {
  describe('createTestXPath', () => {
    it('should create an XPath with default values', () => {
      const xpath = createTestXPath();

      expect(xpath.id).toMatch(/^xpath-/);
      expect(xpath.websiteId).toBe('test-website');
      expect(xpath.value).toBe('test-value');
      expect(xpath.actionType).toBe(ACTION_TYPE.TYPE);
      expect(xpath.executionOrder).toBe(100);
    });

    it('should allow overriding default values', () => {
      const xpath = createTestXPath({
        id: 'custom-id',
        value: 'custom-value',
        executionOrder: 500,
      });

      expect(xpath.id).toBe('custom-id');
      expect(xpath.value).toBe('custom-value');
      expect(xpath.executionOrder).toBe(500);
      // Other fields should still have defaults
      expect(xpath.websiteId).toBe('test-website');
    });
  });

  describe('createTestXPaths', () => {
    it('should create multiple XPaths with sequential execution orders', () => {
      const xpaths = createTestXPaths(3);

      expect(xpaths).toHaveLength(3);
      expect(xpaths[0].executionOrder).toBe(100);
      expect(xpaths[1].executionOrder).toBe(200);
      expect(xpaths[2].executionOrder).toBe(300);
    });

    it('should apply base overrides to all XPaths', () => {
      const xpaths = createTestXPaths(2, { websiteId: 'my-website' });

      expect(xpaths).toHaveLength(2);
      expect(xpaths[0].websiteId).toBe('my-website');
      expect(xpaths[1].websiteId).toBe('my-website');
    });
  });

  describe('createTestWebsite', () => {
    it('should create a website with default values', () => {
      const website = createTestWebsite();

      expect(website.id).toMatch(/^website-/);
      expect(website.name).toBe('Test Website');
      expect(website.startUrl).toBe('https://example.com');
      expect(website.editable).toBe(true);
      expect(website.updatedAt).toBeDefined();
    });

    it('should allow overriding default values', () => {
      const website = createTestWebsite({
        name: 'Custom Website',
        editable: false,
      });

      expect(website.name).toBe('Custom Website');
      expect(website.editable).toBe(false);
    });
  });

  describe('createTestWebsites', () => {
    it('should create multiple websites', () => {
      const websites = createTestWebsites(3);

      expect(websites).toHaveLength(3);
      expect(websites[0].name).toBe('Test Website 1');
      expect(websites[1].name).toBe('Test Website 2');
      expect(websites[2].name).toBe('Test Website 3');
    });
  });

  describe('createTestVariables', () => {
    it('should create default variables', () => {
      const variables = createTestVariables();

      expect(variables.username).toBe('testuser');
      expect(variables.password).toBe('testpass');
    });

    it('should allow overriding and adding variables', () => {
      const variables = createTestVariables({
        username: 'customuser',
        email: 'test@example.com',
      });

      expect(variables.username).toBe('customuser');
      expect(variables.email).toBe('test@example.com');
      expect(variables.password).toBe('testpass');
    });
  });

  describe('XPathPresets', () => {
    it('should create username input preset', () => {
      const xpath = XPathPresets.usernameInput();

      expect(xpath.id).toBe('username-input');
      expect(xpath.value).toBe('{{username}}');
      expect(xpath.actionType).toBe(ACTION_TYPE.TYPE);
      expect(xpath.executionOrder).toBe(100);
    });

    it('should create password input preset', () => {
      const xpath = XPathPresets.passwordInput();

      expect(xpath.id).toBe('password-input');
      expect(xpath.value).toBe('{{password}}');
      expect(xpath.actionType).toBe(ACTION_TYPE.TYPE);
      expect(xpath.executionOrder).toBe(200);
    });

    it('should create submit button preset', () => {
      const xpath = XPathPresets.submitButton();

      expect(xpath.id).toBe('submit-button');
      expect(xpath.value).toBe('');
      expect(xpath.actionType).toBe(ACTION_TYPE.CLICK);
      expect(xpath.executionOrder).toBe(300);
    });

    it('should create login flow', () => {
      const flow = XPathPresets.loginFlow('my-website');

      expect(flow).toHaveLength(3);
      expect(flow[0].websiteId).toBe('my-website');
      expect(flow[1].websiteId).toBe('my-website');
      expect(flow[2].websiteId).toBe('my-website');
      expect(flow[0].executionOrder).toBe(100);
      expect(flow[1].executionOrder).toBe(200);
      expect(flow[2].executionOrder).toBe(300);
    });
  });

  describe('WebsitePresets', () => {
    it('should create editable website preset', () => {
      const website = WebsitePresets.editable();

      expect(website.editable).toBe(true);
    });

    it('should create non-editable website preset', () => {
      const website = WebsitePresets.nonEditable();

      expect(website.editable).toBe(false);
    });
  });
});
