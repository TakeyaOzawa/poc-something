import { Website, WebsiteData } from '../Website';

describe('Website Entity', () => {
  const validWebsiteData: WebsiteData = {
    id: 'website_001',
    name: 'Test Website',
    updatedAt: '2025-10-07T00:00:00.000Z',
    editable: true,
    startUrl: 'https://example.com',
  };

  describe('constructor', () => {
    it('should create a Website with valid data', () => {
      const website = new Website(validWebsiteData);

      expect(website.getId()).toBe('website_001');
      expect(website.getName()).toBe('Test Website');
      expect(website.isEditable()).toBe(true);
      expect(website.getStartUrl()).toBe('https://example.com');
    });

    it('should throw error if id is missing', () => {
      const invalidData = { ...validWebsiteData, id: '' };
      expect(() => new Website(invalidData)).toThrow('Website ID is required');
    });

    it('should throw error if name is missing', () => {
      const invalidData = { ...validWebsiteData, name: '' };
      expect(() => new Website(invalidData)).toThrow('Website name is required');
    });
  });

  describe('setStartUrl', () => {
    it('should update start URL', () => {
      const website = new Website(validWebsiteData);
      const updated = website.setStartUrl('https://new-url.com');

      expect(updated.getStartUrl()).toBe('https://new-url.com');
      expect(website.getStartUrl()).toBe('https://example.com');
    });
  });

  describe('toData', () => {
    it('should return a copy of website data', () => {
      const website = new Website(validWebsiteData);
      const data = website.toData();

      expect(data).toEqual(validWebsiteData);
      expect(data).not.toBe(validWebsiteData); // not same reference
    });
  });

  describe('clone', () => {
    it('should return a new Website instance with same data', () => {
      const website = new Website(validWebsiteData);
      const cloned = website.clone();

      expect(cloned.toData()).toEqual(website.toData());
      expect(cloned).not.toBe(website); // different instance
    });
  });

  describe('create static factory', () => {
    it('should create a new Website with minimal params', () => {
      const website = Website.create({ name: 'New Website' });

      expect(website.getId()).toMatch(/^website_\d+_[a-z0-9]+$/);
      expect(website.getName()).toBe('New Website');
      expect(website.isEditable()).toBe(true);
      expect(website.getStartUrl()).toBeUndefined();
    });

    it('should create a new Website with all params', () => {
      const website = Website.create({
        name: 'Test Site',
        editable: false,
        startUrl: 'https://test.com',
      });

      expect(website.getName()).toBe('Test Site');
      expect(website.isEditable()).toBe(false);
      expect(website.getStartUrl()).toBe('https://test.com');
    });

    it('should generate unique IDs', () => {
      const website1 = Website.create({ name: 'Site 1' });
      const website2 = Website.create({ name: 'Site 2' });

      expect(website1.getId()).not.toBe(website2.getId());
    });
  });
});
