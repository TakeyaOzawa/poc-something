import { DataTransformer, DataTransformerData } from '../DataTransformer';

describe('DataTransformer', () => {
  const validData: DataTransformerData = {
    id: 'transformer-1',
    name: 'Test Transformer',
    description: 'Test description',
    enabled: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  it('should create a DataTransformer with valid data', () => {
    const transformer = DataTransformer.create(validData);
    
    expect(transformer.getId()).toBe('transformer-1');
    expect(transformer.getName()).toBe('Test Transformer');
    expect(transformer.isEnabled()).toBe(true);
  });

  it('should create from data using fromData method', () => {
    const transformer = DataTransformer.fromData(validData);
    
    expect(transformer.getId()).toBe('transformer-1');
    expect(transformer.getName()).toBe('Test Transformer');
  });

  it('should return correct data when calling toData', () => {
    const transformer = DataTransformer.create(validData);
    const data = transformer.toData();
    
    expect(data).toEqual(validData);
  });
});
