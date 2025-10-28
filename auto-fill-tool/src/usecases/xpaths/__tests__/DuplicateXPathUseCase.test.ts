/**
 * Unit Tests: DuplicateXPathUseCase
 */

import { DuplicateXPathUseCase } from '../DuplicateXPathUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { Result } from '@domain/values/result.value';

describe('DuplicateXPathUseCase', () => {
  let useCase: DuplicateXPathUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };

    useCase = new DuplicateXPathUseCase(mockRepository);
  });

  it('should duplicate an existing XPath with "_copy" suffix', async () => {
    let collection = new XPathCollection();
    collection = collection.add(
      createTestXPathData({
        value: 'Test Value',
        executionOrder: 100,
      })
    );
    const allXPaths = collection.getAll();
    const original = allXPaths[allXPaths.length - 1];

    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const result = await useCase.execute({ id: original.id });

    expect(result).not.toBeNull();
    expect(result?.xpath?.value).toBe('Test Value_copy');
    expect(result?.xpath?.url).toBe(original.url);
    expect(result?.xpath?.pathShort).toBe(original.pathShort);
    expect(result?.xpath?.executionOrder).toBe(200);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should return null when XPath not found', async () => {
    const collection = new XPathCollection();
    mockRepository.load.mockResolvedValue(Result.success(collection));

    const result = await useCase.execute({ id: 'non-existent-id' });

    expect(result.xpath).toBeNull();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should assign new execution order at the end', async () => {
    let collection = new XPathCollection();

    collection = collection.add(
      createTestXPathData({
        value: 'Value 1',
        executionOrder: 100,
      })
    );

    collection = collection.add(
      createTestXPathData({
        value: 'Value 2',
        executionOrder: 200,
      })
    );
    const allXPaths = collection.getAll();
    const second = allXPaths[allXPaths.length - 1];

    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const result = await useCase.execute({ id: second.id });

    expect(result).not.toBeNull();
    expect(result?.xpath?.executionOrder).toBe(300); // max(100, 200) + 100
  });

  it('should preserve websiteId when duplicating', async () => {
    let collection = new XPathCollection();
    collection = collection.add(
      createTestXPathData({
        websiteId: 'website_123',
        value: 'Test Value',
        executionOrder: 100,
      })
    );
    const allXPaths = collection.getAll();
    const original = allXPaths[allXPaths.length - 1];

    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const result = await useCase.execute({ id: original.id });

    expect(result).not.toBeNull();
    expect(result?.xpath?.websiteId).toBe('website_123');
    expect(result?.xpath?.value).toBe('Test Value_copy');
  });

  it('should assign execution_order scoped to websiteId when duplicating', async () => {
    let collection = new XPathCollection();

    // Add XPaths for different websites
    collection = collection.add(
      createTestXPathData({
        websiteId: 'website_A',
        value: 'XPath A1',
        executionOrder: 100,
      })
    );

    collection = collection.add(
      createTestXPathData({
        websiteId: 'website_A',
        value: 'XPath A2',
        executionOrder: 200,
      })
    );
    const allXPathsA = collection.getAll();
    const originalA2 = allXPathsA[allXPathsA.length - 1];

    collection = collection.add(
      createTestXPathData({
        websiteId: 'website_B',
        value: 'XPath B1',
        executionOrder: 300,
      })
    );

    mockRepository.load.mockResolvedValue(Result.success(collection));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const result = await useCase.execute({ id: originalA2.id });

    expect(result).not.toBeNull();
    expect(result?.xpath?.websiteId).toBe('website_A');
    // Should be 300 (max of website_A's executionOrder: 200, plus 100)
    // NOT 400 (which would be global max + 100)
    expect(result?.xpath?.executionOrder).toBe(300);
  });
});
