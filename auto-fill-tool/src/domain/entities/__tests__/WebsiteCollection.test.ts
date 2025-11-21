import { Website, WebsiteData } from '../Website';
import { WebsiteCollection } from '../WebsiteCollection';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('WebsiteCollection Entity', () => {
  const website1Data: WebsiteData = {
    id: 'website_001',
    name: 'Website 1',
    updatedAt: '2025-10-07T00:00:00.000Z',
    editable: true,
  };

  const website2Data: WebsiteData = {
    id: 'website_002',
    name: 'Website 2',
    updatedAt: '2025-10-07T01:00:00.000Z',
    editable: true,
  };

  const website1 = new Website(website1Data);
  const website2 = new Website(website2Data);

  describe('constructor', () => {
    it('should create an empty collection', () => {
      const collection = new WebsiteCollection();
      expect(collection.getAll()).toEqual([]);
    });

    it('should create a collection with websites', () => {
      const collection = new WebsiteCollection([website1, website2]);
      expect(collection.getAll()).toHaveLength(2);
    });
  });

  describe('add', () => {
    it('should add a website to the collection', () => {
      const collection = new WebsiteCollection();
      const updated = collection.add(website1);

      expect(updated.getAll()).toHaveLength(1);
      expect(updated.getById('website_001')).toBeDefined();
      expect(collection.getAll()).toHaveLength(0); // original unchanged
    });

    it('should replace website if same id exists', () => {
      const collection = new WebsiteCollection([website1]);
      const updatedWebsite1 = website1.setStartUrl('https://updated.com');
      const updated = collection.add(updatedWebsite1);

      expect(updated.getAll()).toHaveLength(1);
      expect(updated.getById('website_001')?.getStartUrlValue()).toBe('https://updated.com/');
    });
  });

  describe('update', () => {
    it('should update an existing website', () => {
      const collection = new WebsiteCollection([website1, website2]);
      const updatedWebsite1 = website1.setStartUrl('https://updated.com');
      const updated = collection.update('website_001', updatedWebsite1);

      expect(updated.getById('website_001')?.getStartUrlValue()).toBe('https://updated.com/');
      expect(collection.getById('website_001')?.getStartUrlValue()).toBeUndefined();
    });

    it('should throw error if website not found', () => {
      const collection = new WebsiteCollection([website1]);
      expect(() => collection.update('nonexistent', website2)).toThrow(
        'Website not found: nonexistent'
      );
    });
  });

  describe('delete', () => {
    it('should delete a website from the collection', () => {
      const collection = new WebsiteCollection([website1, website2]);
      const updated = collection.delete('website_001');

      expect(updated.getAll()).toHaveLength(1);
      expect(updated.getById('website_001')).toBeUndefined();
      expect(updated.getById('website_002')).toBeDefined();
      expect(collection.getAll()).toHaveLength(2); // original unchanged
    });

    it('should throw error when deleting non-existent website', () => {
      const collection = new WebsiteCollection([website1]);
      expect(() => collection.delete('nonexistent')).toThrow('Website not found: nonexistent');
    });
  });

  describe('getById', () => {
    it('should return website by id', () => {
      const collection = new WebsiteCollection([website1, website2]);
      const found = collection.getById('website_001');

      expect(found).toBeDefined();
      expect(found?.getIdValue()).toBe('website_001');
      expect(found?.getName()).toBe('Website 1');
    });

    it('should return undefined if not found', () => {
      const collection = new WebsiteCollection([website1]);
      const found = collection.getById('nonexistent');

      expect(found).toBeUndefined();
    });

    it('should return a clone', () => {
      const collection = new WebsiteCollection([website1]);
      const found = collection.getById('website_001');

      expect(found).not.toBe(website1);
      expect(found?.toData()).toEqual(website1.toData());
    });
  });

  describe('getAll', () => {
    it('should return all websites', () => {
      const collection = new WebsiteCollection([website1, website2]);
      const all = collection.getAll();

      expect(all).toHaveLength(2);
      expect(all[0].getIdValue()).toBe('website_001');
      expect(all[1].getIdValue()).toBe('website_002');
    });

    it('should return clones', () => {
      const collection = new WebsiteCollection([website1]);
      const all = collection.getAll();

      expect(all[0]).not.toBe(website1);
      expect(all[0].toData()).toEqual(website1.toData());
    });
  });

  describe('getAllSortedByUpdatedAt', () => {
    it('should return websites sorted by updatedAt descending', () => {
      const collection = new WebsiteCollection([website1, website2]);
      const sorted = collection.getAllSortedByUpdatedAt();

      expect(sorted[0].getIdValue()).toBe('website_002'); // newer
      expect(sorted[1].getIdValue()).toBe('website_001'); // older
    });
  });

  describe('getEditableWebsites', () => {
    it('should return only editable websites', () => {
      const nonEditableData = { ...website1Data, id: 'website_003', editable: false };
      const nonEditable = new Website(nonEditableData);
      const collection = new WebsiteCollection([website1, website2, nonEditable]);

      const editable = collection.getEditableWebsites();

      expect(editable).toHaveLength(2);
      expect(editable.every((w) => w.isEditable())).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize collection to JSON string', () => {
      const collection = new WebsiteCollection([website1, website2]);
      const json = collection.toJSON();

      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('website_001');
      expect(parsed[1].id).toBe('website_002');
    });
  });

  describe('fromJSON', () => {
    it('should deserialize collection from JSON string', () => {
      const json = JSON.stringify([website1Data, website2Data]);
      const collection = WebsiteCollection.fromJSON(json);

      expect(collection.getAll()).toHaveLength(2);
      expect(collection.getById('website_001')).toBeDefined();
      expect(collection.getById('website_002')).toBeDefined();
    });

    it('should return empty collection on invalid JSON', () => {
      const collection = WebsiteCollection.fromJSON('invalid json');
      expect(collection.getAll()).toHaveLength(0);
    });

    it('should return empty collection on null', () => {
      const collection = WebsiteCollection.fromJSON('null');
      expect(collection.getAll()).toHaveLength(0);
    });
  });

  describe('empty', () => {
    it('should create an empty collection', () => {
      const collection = WebsiteCollection.empty();
      expect(collection.getAll()).toHaveLength(0);
    });
  });
});
