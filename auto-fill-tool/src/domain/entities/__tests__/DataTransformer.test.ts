/**
 * Domain Entity Test: Data Transformer
 * Tests for data transformation rules entity
 */

import {
  DataTransformer,
  DataTransformerData,
  FieldTransformationRule,
  ValidationRule,
} from '../DataTransformer';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('DataTransformer Entity', () => {
  const validRules: FieldTransformationRule[] = [
    {
      sourceField: 'name',
      targetField: 'fullName',
      type: 'string',
      required: true,
    },
    {
      sourceField: 'age',
      targetField: 'userAge',
      type: 'number',
    },
  ];

  const validData: DataTransformerData = {
    id: 'transformer-123',
    name: 'Test Transformer',
    description: 'A test transformer',
    transformationRules: validRules,
    enabled: true,
    createdAt: '2025-01-16T00:00:00.000Z',
    updatedAt: '2025-01-16T00:00:00.000Z',
  };

  describe('factory method: create', () => {
    beforeEach(() => {
      // Mock Date.now() for consistent ID generation
      jest.spyOn(Date, 'now').mockReturnValue(1737011234567);
      // Mock Math.random() for consistent ID generation
      jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create DataTransformer with valid params', () => {
      const transformer = DataTransformer.create({
        name: 'My Transformer',
        description: 'Test description',
        transformationRules: validRules,
        enabled: true,
      });

      expect(transformer.getName()).toBe('My Transformer');
      expect(transformer.getDescription()).toBe('Test description');
      expect(transformer.getTransformationRules()).toEqual(validRules);
      expect(transformer.isEnabled()).toBe(true);
      expect(transformer.getId()).toMatch(/^transformer-\d+-[a-z0-9]{7}$/);
      expect(transformer.getCreatedAt()).toBeTruthy();
      expect(transformer.getUpdatedAt()).toBeTruthy();
    });

    it('should create DataTransformer with minimal params', () => {
      const transformer = DataTransformer.create({
        name: 'Minimal Transformer',
      });

      expect(transformer.getName()).toBe('Minimal Transformer');
      expect(transformer.getDescription()).toBeUndefined();
      expect(transformer.getTransformationRules()).toEqual([]);
      expect(transformer.isEnabled()).toBe(true);
    });

    it('should create DataTransformer with enabled false', () => {
      const transformer = DataTransformer.create({
        name: 'Disabled Transformer',
        enabled: false,
      });

      expect(transformer.isEnabled()).toBe(false);
    });

    it('should generate unique IDs for different instances', () => {
      jest.restoreAllMocks();

      const transformer1 = DataTransformer.create({ name: 'Transformer 1' });
      const transformer2 = DataTransformer.create({ name: 'Transformer 2' });

      expect(transformer1.getId()).not.toBe(transformer2.getId());
    });
  });

  describe('factory method: fromData', () => {
    it('should restore DataTransformer from valid data', () => {
      const transformer = DataTransformer.fromData(validData);

      expect(transformer.getId()).toBe('transformer-123');
      expect(transformer.getName()).toBe('Test Transformer');
      expect(transformer.getDescription()).toBe('A test transformer');
      expect(transformer.getTransformationRules()).toEqual(validRules);
      expect(transformer.isEnabled()).toBe(true);
      expect(transformer.getCreatedAt()).toBe('2025-01-16T00:00:00.000Z');
      expect(transformer.getUpdatedAt()).toBe('2025-01-16T00:00:00.000Z');
    });

    it('should restore DataTransformer without optional fields', () => {
      const minimalData: DataTransformerData = {
        id: 'transformer-456',
        name: 'Minimal',
        transformationRules: [],
        enabled: true,
        createdAt: '2025-01-16T00:00:00.000Z',
        updatedAt: '2025-01-16T00:00:00.000Z',
      };

      const transformer = DataTransformer.fromData(minimalData);

      expect(transformer.getDescription()).toBeUndefined();
      expect(transformer.getTransformationRules()).toEqual([]);
    });
  });

  describe('getters', () => {
    let transformer: DataTransformer;

    beforeEach(() => {
      transformer = DataTransformer.fromData(validData);
    });

    it('should get id', () => {
      expect(transformer.getId()).toBe('transformer-123');
    });

    it('should get name', () => {
      expect(transformer.getName()).toBe('Test Transformer');
    });

    it('should get description', () => {
      expect(transformer.getDescription()).toBe('A test transformer');
    });

    it('should get transformation rules', () => {
      expect(transformer.getTransformationRules()).toEqual(validRules);
    });

    it('should return a copy of transformation rules (immutability)', () => {
      const rules1 = transformer.getTransformationRules();
      const rules2 = transformer.getTransformationRules();

      expect(rules1).toEqual(rules2);
      expect(rules1).not.toBe(rules2);

      // Mutating returned array should not affect entity
      rules1.push({
        sourceField: 'test',
        targetField: 'test',
      });

      expect(transformer.getTransformationRules()).toEqual(validRules);
    });

    it('should get enabled status', () => {
      expect(transformer.isEnabled()).toBe(true);
    });

    it('should get createdAt', () => {
      expect(transformer.getCreatedAt()).toBe('2025-01-16T00:00:00.000Z');
    });

    it('should get updatedAt', () => {
      expect(transformer.getUpdatedAt()).toBe('2025-01-16T00:00:00.000Z');
    });
  });

  describe('setters (immutability)', () => {
    let transformer: DataTransformer;

    beforeEach(() => {
      transformer = DataTransformer.fromData(validData);
    });

    it('should set name and return new instance', () => {
      const updated = transformer.setName('New Name');

      expect(updated).not.toBe(transformer);
      expect(updated.getName()).toBe('New Name');
      expect(transformer.getName()).toBe('Test Transformer'); // Original unchanged
    });

    it('should set description and return new instance', () => {
      const updated = transformer.setDescription('New Description');

      expect(updated).not.toBe(transformer);
      expect(updated.getDescription()).toBe('New Description');
      expect(transformer.getDescription()).toBe('A test transformer'); // Original unchanged
    });

    it('should set transformation rules and return new instance', () => {
      const newRules: FieldTransformationRule[] = [
        { sourceField: 'email', targetField: 'userEmail', type: 'string' },
      ];

      const updated = transformer.setTransformationRules(newRules);

      expect(updated).not.toBe(transformer);
      expect(updated.getTransformationRules()).toEqual(newRules);
      expect(transformer.getTransformationRules()).toEqual(validRules); // Original unchanged
    });

    it('should add transformation rule and return new instance', () => {
      const newRule: FieldTransformationRule = {
        sourceField: 'email',
        targetField: 'userEmail',
        type: 'string',
      };

      const updated = transformer.addTransformationRule(newRule);

      expect(updated).not.toBe(transformer);
      expect(updated.getTransformationRules()).toHaveLength(3);
      expect(updated.getTransformationRules()[2]).toEqual(newRule);
      expect(transformer.getTransformationRules()).toHaveLength(2); // Original unchanged
    });

    it('should remove transformation rule and return new instance', () => {
      const updated = transformer.removeTransformationRule('name');

      expect(updated).not.toBe(transformer);
      expect(updated.getTransformationRules()).toHaveLength(1);
      expect(updated.getTransformationRules()[0].sourceField).toBe('age');
      expect(transformer.getTransformationRules()).toHaveLength(2); // Original unchanged
    });

    it('should set enabled status and return new instance', () => {
      const updated = transformer.setEnabled(false);

      expect(updated).not.toBe(transformer);
      expect(updated.isEnabled()).toBe(false);
      expect(transformer.isEnabled()).toBe(true); // Original unchanged
    });

    it('should update updatedAt when setting properties', () => {
      const originalUpdatedAt = transformer.getUpdatedAt();

      // Mock a later time
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-17T00:00:00.000Z');

      const updated = transformer.setName('Updated Name');

      expect(updated.getUpdatedAt()).not.toBe(originalUpdatedAt);
      expect(updated.getUpdatedAt()).toBe('2025-01-17T00:00:00.000Z');

      jest.restoreAllMocks();
    });
  });

  describe('method: transform', () => {
    it('should transform data with type conversions', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'name', targetField: 'userName', type: 'string' },
        { sourceField: 'age', targetField: 'userAge', type: 'number' },
        { sourceField: 'active', targetField: 'isActive', type: 'boolean' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const sourceData = {
        name: 'John Doe',
        age: '30',
        active: 'true',
      };

      const result = transformer.transform(sourceData);

      expect(result).toEqual({
        userName: 'John Doe',
        userAge: 30,
        isActive: true,
      });
    });

    it('should handle nested source fields with dot notation', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'user.profile.name', targetField: 'fullName', type: 'string' },
        { sourceField: 'user.profile.age', targetField: 'age', type: 'number' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const sourceData = {
        user: {
          profile: {
            name: 'Jane Doe',
            age: 25,
          },
        },
      };

      const result = transformer.transform(sourceData);

      expect(result).toEqual({
        fullName: 'Jane Doe',
        age: 25,
      });
    });

    it('should handle nested target fields with dot notation', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'name', targetField: 'user.profile.fullName', type: 'string' },
        { sourceField: 'age', targetField: 'user.profile.age', type: 'number' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const sourceData = {
        name: 'John Doe',
        age: 30,
      };

      const result = transformer.transform(sourceData);

      expect(result).toEqual({
        user: {
          profile: {
            fullName: 'John Doe',
            age: 30,
          },
        },
      });
    });

    it('should use default value for missing optional fields', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'name', targetField: 'userName', defaultValue: 'Unknown' },
        { sourceField: 'age', targetField: 'userAge', defaultValue: 0 },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const sourceData = {};

      const result = transformer.transform(sourceData);

      expect(result).toEqual({
        userName: 'Unknown',
        userAge: 0,
      });
    });

    it('should throw error for missing required fields without default', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'name', targetField: 'userName', required: true },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const sourceData = {};

      expect(() => transformer.transform(sourceData)).toThrow("Required field 'name' is missing");
    });

    it('should use default value for missing required fields', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'name', targetField: 'userName', required: true, defaultValue: 'Default' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const sourceData = {};

      const result = transformer.transform(sourceData);

      expect(result).toEqual({
        userName: 'Default',
      });
    });

    it('should skip transformation when disabled', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'name', targetField: 'userName', type: 'string' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
        enabled: false,
      });

      const sourceData = { name: 'John' };

      const result = transformer.transform(sourceData);

      expect(result).toBe(sourceData); // Returns original data
    });

    it('should handle empty transformation rules', () => {
      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: [],
      });

      const sourceData = { name: 'John', age: 30 };

      const result = transformer.transform(sourceData);

      expect(result).toEqual({});
    });
  });

  describe('method: transformArray', () => {
    it('should transform array of data', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'name', targetField: 'userName', type: 'string' },
        { sourceField: 'age', targetField: 'userAge', type: 'number' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const sourceDataArray = [
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' },
        { name: 'Bob', age: '35' },
      ];

      const result = transformer.transformArray(sourceDataArray);

      expect(result).toEqual([
        { userName: 'John', userAge: 30 },
        { userName: 'Jane', userAge: 25 },
        { userName: 'Bob', userAge: 35 },
      ]);
    });

    it('should handle empty array', () => {
      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: validRules,
      });

      const result = transformer.transformArray([]);

      expect(result).toEqual([]);
    });
  });

  describe('type transformations', () => {
    describe('string type', () => {
      it('should convert to string', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'value', targetField: 'result', type: 'string' },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.transform({ value: 123 })).toEqual({ result: '123' });
        expect(transformer.transform({ value: true })).toEqual({ result: 'true' });
        expect(transformer.transform({ value: null })).toEqual({ result: 'null' });
      });
    });

    describe('number type', () => {
      it('should convert to number', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'value', targetField: 'result', type: 'number' },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.transform({ value: '123' })).toEqual({ result: 123 });
        expect(transformer.transform({ value: '45.67' })).toEqual({ result: 45.67 });
        expect(transformer.transform({ value: true })).toEqual({ result: 1 });
        expect(transformer.transform({ value: false })).toEqual({ result: 0 });
      });

      it('should return 0 for invalid numbers', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'value', targetField: 'result', type: 'number' },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.transform({ value: 'invalid' })).toEqual({ result: 0 });
        expect(transformer.transform({ value: 'NaN' })).toEqual({ result: 0 });
      });
    });

    describe('boolean type', () => {
      it('should convert to boolean', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'value', targetField: 'result', type: 'boolean' },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.transform({ value: true })).toEqual({ result: true });
        expect(transformer.transform({ value: false })).toEqual({ result: false });
        expect(transformer.transform({ value: 'true' })).toEqual({ result: true });
        expect(transformer.transform({ value: 'TRUE' })).toEqual({ result: true });
        expect(transformer.transform({ value: '1' })).toEqual({ result: true });
        expect(transformer.transform({ value: 'false' })).toEqual({ result: false });
        expect(transformer.transform({ value: '0' })).toEqual({ result: false });
        expect(transformer.transform({ value: '' })).toEqual({ result: false });
        expect(transformer.transform({ value: 1 })).toEqual({ result: true });
        expect(transformer.transform({ value: 0 })).toEqual({ result: false });
      });
    });

    describe('date type', () => {
      it('should convert to ISO date string', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'value', targetField: 'result', type: 'date' },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const date = new Date('2025-01-16T00:00:00.000Z');
        expect(transformer.transform({ value: date })).toEqual({
          result: '2025-01-16T00:00:00.000Z',
        });

        expect(transformer.transform({ value: '2025-01-16' })).toEqual({
          result: new Date('2025-01-16').toISOString(),
        });

        expect(transformer.transform({ value: 1737011234567 })).toEqual({
          result: new Date(1737011234567).toISOString(),
        });
      });
    });

    describe('array type', () => {
      it('should convert to array', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'value', targetField: 'result', type: 'array' },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.transform({ value: [1, 2, 3] })).toEqual({ result: [1, 2, 3] });
        expect(transformer.transform({ value: 'test' })).toEqual({ result: ['test'] });
        expect(transformer.transform({ value: 123 })).toEqual({ result: [123] });
      });
    });

    describe('object type', () => {
      it('should convert to object', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'value', targetField: 'result', type: 'object' },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const obj = { key: 'value' };
        expect(transformer.transform({ value: obj })).toEqual({ result: obj });
        expect(transformer.transform({ value: 'test' })).toEqual({ result: { value: 'test' } });
        expect(transformer.transform({ value: 123 })).toEqual({ result: { value: 123 } });
      });
    });
  });

  describe('method: validate', () => {
    describe('required validation', () => {
      it('should pass validation for required fields with values', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'name', targetField: 'userName', required: true },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({ name: 'John' });

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should fail validation for missing required fields', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'name', targetField: 'userName', required: true },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({});

        expect(result.valid).toBe(false);
        expect(result.errors).toEqual(["Field 'name' is required"]);
      });

      it('should fail validation for null required fields', () => {
        const rules: FieldTransformationRule[] = [
          { sourceField: 'name', targetField: 'userName', required: true },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({ name: null });

        expect(result.valid).toBe(false);
        expect(result.errors).toEqual(["Field 'name' is required"]);
      });
    });

    describe('minLength validation', () => {
      it('should pass validation for strings meeting minLength', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'name',
            targetField: 'userName',
            validationRules: [{ type: 'minLength', value: 3 }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.validate({ name: 'John' }).valid).toBe(true);
        expect(transformer.validate({ name: 'Bob' }).valid).toBe(true);
      });

      it('should fail validation for strings below minLength', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'name',
            targetField: 'userName',
            validationRules: [{ type: 'minLength', value: 5 }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({ name: 'Bob' });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('at least 5 characters');
      });
    });

    describe('maxLength validation', () => {
      it('should pass validation for strings meeting maxLength', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'name',
            targetField: 'userName',
            validationRules: [{ type: 'maxLength', value: 10 }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.validate({ name: 'John' }).valid).toBe(true);
        expect(transformer.validate({ name: 'JohnSmith' }).valid).toBe(true);
      });

      it('should fail validation for strings exceeding maxLength', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'name',
            targetField: 'userName',
            validationRules: [{ type: 'maxLength', value: 5 }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({ name: 'Jonathan' });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('at most 5 characters');
      });
    });

    describe('min validation', () => {
      it('should pass validation for numbers meeting min', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'age',
            targetField: 'userAge',
            validationRules: [{ type: 'min', value: 18 }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.validate({ age: 18 }).valid).toBe(true);
        expect(transformer.validate({ age: 25 }).valid).toBe(true);
      });

      it('should fail validation for numbers below min', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'age',
            targetField: 'userAge',
            validationRules: [{ type: 'min', value: 18 }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({ age: 16 });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('at least 18');
      });
    });

    describe('max validation', () => {
      it('should pass validation for numbers meeting max', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'age',
            targetField: 'userAge',
            validationRules: [{ type: 'max', value: 100 }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.validate({ age: 100 }).valid).toBe(true);
        expect(transformer.validate({ age: 50 }).valid).toBe(true);
      });

      it('should fail validation for numbers exceeding max', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'age',
            targetField: 'userAge',
            validationRules: [{ type: 'max', value: 100 }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({ age: 120 });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('at most 100');
      });
    });

    describe('pattern validation', () => {
      it('should pass validation for strings matching pattern', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'email',
            targetField: 'userEmail',
            validationRules: [{ type: 'pattern', value: '^[a-z]+@[a-z]+\\.[a-z]+$' }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.validate({ email: 'test@example.com' }).valid).toBe(true);
      });

      it('should fail validation for strings not matching pattern', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'email',
            targetField: 'userEmail',
            validationRules: [{ type: 'pattern', value: '^[a-z]+@[a-z]+\\.[a-z]+$' }],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({ email: 'invalid-email' });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('does not match the required pattern');
      });
    });

    describe('multiple validation rules', () => {
      it('should apply all validation rules', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'password',
            targetField: 'userPassword',
            validationRules: [
              { type: 'required' },
              { type: 'minLength', value: 8 },
              { type: 'pattern', value: '^(?=.*[A-Z])(?=.*[0-9])' },
            ],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        expect(transformer.validate({ password: 'Password123' }).valid).toBe(true);
      });

      it('should collect all validation errors', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'password',
            targetField: 'userPassword',
            validationRules: [
              { type: 'minLength', value: 8 },
              { type: 'maxLength', value: 6 }, // Contradictory for testing
            ],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({ password: 'short' });

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1); // Only minLength fails
      });
    });

    describe('custom error messages', () => {
      it('should use custom error message when provided', () => {
        const rules: FieldTransformationRule[] = [
          {
            sourceField: 'age',
            targetField: 'userAge',
            validationRules: [
              { type: 'min', value: 18, errorMessage: 'You must be at least 18 years old' },
            ],
          },
        ];

        const transformer = DataTransformer.create({
          name: 'Test',
          transformationRules: rules,
        });

        const result = transformer.validate({ age: 16 });

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toBe('You must be at least 18 years old');
      });
    });

    it('should skip validation for missing optional fields', () => {
      const rules: FieldTransformationRule[] = [
        {
          sourceField: 'optional',
          targetField: 'optionalField',
          validationRules: [{ type: 'minLength', value: 5 }],
        },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const result = transformer.validate({});

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('method: toData', () => {
    it('should convert to plain data object', () => {
      const transformer = DataTransformer.fromData(validData);
      const data = transformer.toData();

      expect(data).toEqual(validData);
    });

    it('should return a copy (immutability)', () => {
      const transformer = DataTransformer.fromData(validData);
      const data1 = transformer.toData();
      const data2 = transformer.toData();

      expect(data1).toEqual(data2);
      expect(data1).not.toBe(data2);

      // Mutating returned data should not affect entity
      data1.name = 'Modified';
      expect(transformer.getName()).toBe('Test Transformer');
    });

    it('should include all fields', () => {
      const transformer = DataTransformer.fromData(validData);
      const data = transformer.toData();

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('transformationRules');
      expect(data).toHaveProperty('enabled');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });
  });

  describe('edge cases', () => {
    it('should handle deeply nested source fields', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'a.b.c.d.e', targetField: 'result', type: 'string' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const sourceData = {
        a: {
          b: {
            c: {
              d: {
                e: 'deep value',
              },
            },
          },
        },
      };

      const result = transformer.transform(sourceData);

      expect(result).toEqual({ result: 'deep value' });
    });

    it('should handle deeply nested target fields', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'value', targetField: 'a.b.c.d.e', type: 'string' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const result = transformer.transform({ value: 'test' });

      expect(result).toEqual({
        a: {
          b: {
            c: {
              d: {
                e: 'test',
              },
            },
          },
        },
      });
    });

    it('should return undefined for missing nested fields', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'user.profile.name', targetField: 'userName' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const result = transformer.transform({ user: {} });

      expect(result).toEqual({});
    });

    it('should handle empty source data', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'name', targetField: 'userName', defaultValue: 'Unknown' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const result = transformer.transform({});

      expect(result).toEqual({ userName: 'Unknown' });
    });

    it('should handle transformation with no rules', () => {
      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: [],
      });

      const result = transformer.transform({ name: 'John', age: 30 });

      expect(result).toEqual({});
    });

    it('should handle validation with no rules', () => {
      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: [],
      });

      const result = transformer.validate({ name: 'John' });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle multiple transformations on same transformer', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'name', targetField: 'userName', type: 'string' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const result1 = transformer.transform({ name: 'John' });
      const result2 = transformer.transform({ name: 'Jane' });

      expect(result1).toEqual({ userName: 'John' });
      expect(result2).toEqual({ userName: 'Jane' });
    });

    it('should handle special characters in field names', () => {
      const rules: FieldTransformationRule[] = [
        { sourceField: 'user-name', targetField: 'userName', type: 'string' },
      ];

      const transformer = DataTransformer.create({
        name: 'Test',
        transformationRules: rules,
      });

      const result = transformer.transform({ 'user-name': 'John Doe' });

      expect(result).toEqual({ userName: 'John Doe' });
    });
  });
});
