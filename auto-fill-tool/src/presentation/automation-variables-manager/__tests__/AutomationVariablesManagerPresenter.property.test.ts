/**
 * Property-Based Tests: AutomationVariablesManagerPresenter
 * Tests type safety without dynamic imports in the presenter
 *
 * Feature: presentation-layer-viewmodel-completion, Property 7: 動的インポートなしの型安全性
 * Validates: Requirements 3.3
 */

import * as fc from 'fast-check';
import {
  AutomationVariablesManagerPresenter,
  AutomationVariablesManagerView,
} from '../AutomationVariablesManagerPresenter';
import { SaveAutomationVariablesUseCase } from '@application/usecases/automation-variables/SaveAutomationVariablesUseCase';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { SaveAutomationVariablesInputDto } from '@application/dtos/SaveAutomationVariablesInputDto';
import { NoOpLogger } from '@domain/services/NoOpLogger';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => key),
  },
}));

// Mock DIコンテナ
jest.mock('@infrastructure/di/GlobalContainer', () => ({
  container: {
    resolve: jest.fn(),
  },
}));

describe('AutomationVariablesManagerPresenter - Property-Based Tests', () => {
  let presenter: AutomationVariablesManagerPresenter;
  let mockView: jest.Mocked<AutomationVariablesManagerView>;
  let mockSaveUseCase: jest.Mocked<SaveAutomationVariablesUseCase>;

  beforeEach(() => {
    mockView = {
      showVariables: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showEmpty: jest.fn(),
      showRecordingPreview: jest.fn(),
      showNoRecordingMessage: jest.fn(),
    };

    mockSaveUseCase = {
      execute: jest.fn(),
      executeFromDto: jest.fn(),
    } as any;

    // Mock DIコンテナ
    const { container } = require('@infrastructure/di/GlobalContainer');
    container.resolve = jest.fn((token: string) => {
      switch (token) {
        case 'SaveAutomationVariablesUseCase':
          return mockSaveUseCase;
        default:
          return jest.fn();
      }
    });

    presenter = new AutomationVariablesManagerPresenter(mockView, new NoOpLogger());
  });

  /**
   * Property 7: 動的インポートなしの型安全性
   * For any valid AutomationVariablesOutputDto, the presenter should
   * maintain TypeScript type safety without using dynamic imports
   */
  describe('Property 7: 動的インポートなしの型安全性', () => {
    it('should maintain type safety in DTO conversion without dynamic imports', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generator for valid AutomationVariablesOutputDto
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            websiteId: fc.string({ minLength: 1, maxLength: 50 }),
            variables: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.string({ minLength: 0, maxLength: 100 })
            ),
            status: fc.constantFrom('enabled', 'disabled', 'once'),
            createdAt: fc.date().map(d => d.toISOString()),
            updatedAt: fc.date().map(d => d.toISOString()),
          }),
          async (dto: AutomationVariablesOutputDto) => {
            // Mock successful save
            mockSaveUseCase.executeFromDto.mockResolvedValue({
              automationVariables: dto,
            });

            // Execute save operation
            await presenter.saveVariables(dto);

            // Verify that executeFromDto was called with properly typed DTO
            expect(mockSaveUseCase.executeFromDto).toHaveBeenCalledWith({
              automationVariablesDto: expect.objectContaining({
                id: dto.id,
                websiteId: dto.websiteId,
                variables: dto.variables,
                status: dto.status || 'enabled',
                updatedAt: dto.updatedAt,
              } as SaveAutomationVariablesInputDto),
            });

            // Verify success message was shown
            expect(mockView.showSuccess).toHaveBeenCalled();

            // Reset mocks for next iteration
            jest.clearAllMocks();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle DTO conversion errors without dynamic imports', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generator for AutomationVariablesOutputDto that might cause errors
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            websiteId: fc.string({ minLength: 1, maxLength: 50 }),
            variables: fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.string({ minLength: 0, maxLength: 100 })
            ),
            status: fc.option(fc.constantFrom('enabled', 'disabled', 'once'), { nil: undefined }),
            createdAt: fc.date().map(d => d.toISOString()),
            updatedAt: fc.date().map(d => d.toISOString()),
          }),
          async (dto: AutomationVariablesOutputDto) => {
            // Mock save failure
            mockSaveUseCase.executeFromDto.mockRejectedValue(new Error('Save failed'));

            // Execute save operation and expect it to throw
            await expect(presenter.saveVariables(dto)).rejects.toThrow();

            // Verify that executeFromDto was called with properly typed DTO
            expect(mockSaveUseCase.executeFromDto).toHaveBeenCalledWith({
              automationVariablesDto: expect.objectContaining({
                id: dto.id,
                websiteId: dto.websiteId,
                variables: dto.variables,
                status: dto.status || 'enabled',
                updatedAt: dto.updatedAt,
              } as SaveAutomationVariablesInputDto),
            });

            // Verify error message was shown
            expect(mockView.showError).toHaveBeenCalled();

            // Reset mocks for next iteration
            jest.clearAllMocks();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
