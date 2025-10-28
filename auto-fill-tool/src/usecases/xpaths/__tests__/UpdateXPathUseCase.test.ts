/**
 * Unit Tests: UpdateXPathUseCase
 */

import { UpdateXPathUseCase } from '../UpdateXPathUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { Result } from '@domain/values/result.value';

describe('UpdateXPathUseCase', () => {
  let useCase: UpdateXPathUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };

    useCase = new UpdateXPathUseCase(mockRepository);
  });

  it('should update XPath properties', async () => {
    let collection = new XPathCollection();
    collection = collection.add(
      createTestXPathData({
        websiteId: 'website_123',
        value: 'Original Value',
        executionOrder: 1,
      })
    );
    const allXPaths = collection.getAll();
    const original = allXPaths[allXPaths.length - 1];

    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const result = await useCase.execute({
      id: original.id,
      value: 'Updated Value',
      executionOrder: 2,
    });

    expect(result).not.toBeNull();
    expect(result?.xpath?.value).toBe('Updated Value');
    expect(result?.xpath?.executionOrder).toBe(2);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should preserve websiteId when not provided in update', async () => {
    let collection = new XPathCollection();
    collection = collection.add(
      createTestXPathData({
        websiteId: 'website_123',
        value: 'Original Value',
        executionOrder: 1,
      })
    );
    const allXPaths = collection.getAll();
    const original = allXPaths[allXPaths.length - 1];

    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const result = await useCase.execute({
      id: original.id,
      value: 'Updated Value',
      executionOrder: 5,
    });

    expect(result).not.toBeNull();
    expect(result?.xpath?.websiteId).toBe('website_123'); // Should preserve original websiteId
    expect(result?.xpath?.value).toBe('Updated Value');
    expect(result?.xpath?.executionOrder).toBe(5);
  });

  it('should not overwrite websiteId with empty string', async () => {
    let collection = new XPathCollection();
    collection = collection.add(
      createTestXPathData({
        websiteId: 'website_123',
        value: 'Original Value',
        executionOrder: 1,
      })
    );
    const allXPaths = collection.getAll();
    const original = allXPaths[allXPaths.length - 1];

    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    // Simulate the bug: passing empty websiteId
    const result = await useCase.execute({
      id: original.id,
      websiteId: '', // This should NOT overwrite the original websiteId
      value: 'Updated Value',
      executionOrder: 5,
    });

    expect(result).not.toBeNull();
    // This test currently FAILS because UpdateXPathUseCase.execute doesn't protect against websiteId overwrite
    // After fix, this should pass
    expect(result?.xpath?.websiteId).toBe('website_123'); // Should preserve original websiteId
  });

  it('should return null when XPath not found', async () => {
    const collection = new XPathCollection();
    mockRepository.load.mockResolvedValue(Result.success(collection));

    const result = await useCase.execute({
      id: 'non-existent-id',
      value: 'Updated Value',
    });

    expect(result.xpath).toBeNull();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
