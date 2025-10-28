# Clean Architecture Analysis - UseCase Layer

## Summary

This document analyzes the UseCase implementations from a Clean Architecture perspective and identifies areas where processing should be delegated to the domain layer.

## Key Findings

### 1. Dependency Rule Violations (HIGH PRIORITY)

#### Issue: UseCases Depending on Infrastructure Layer Mappers

**Affected Files:**
- `src/usecases/ExportXPathsUseCase.ts`
- `src/usecases/ImportXPathsUseCase.ts`
- `src/usecases/ExportWebsitesUseCase.ts`
- `src/usecases/ImportWebsitesUseCase.ts`
- `src/usecases/ExportAutomationVariablesUseCase.ts`
- `src/usecases/ImportAutomationVariablesUseCase.ts`

**Problem:**
```typescript
// ❌ BAD: UseCase depending on Infrastructure layer
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';

export class ExportXPathsUseCase {
  async execute(): Promise<string> {
    const collection = await this.xpathRepository.load();
    const xpaths = collection.getAll();
    return XPathCollectionMapper.arrayToCSV(xpaths); // Infrastructure dependency
  }
}
```

**Why it's wrong:**
- Violates the Dependency Rule: Outer layers (infrastructure) should depend on inner layers (application/domain), not vice versa
- Makes UseCases tightly coupled to specific infrastructure implementations
- Reduces testability and flexibility

**Recommended Solution:**
Move mappers to domain layer as domain services or inject them as dependencies.

```typescript
// ✅ GOOD: UseCase depending on Domain service
import { ICSVConverter } from '@domain/services/ICSVConverter';

export class ExportXPathsUseCase {
  constructor(
    private xpathRepository: IXPathRepository,
    private csvConverter: ICSVConverter
  ) {}

  async execute(): Promise<string> {
    const collection = await this.xpathRepository.load();
    const xpaths = collection.getAll();
    return this.csvConverter.toCSV(xpaths); // Domain interface
  }
}
```

**Alternative Solution:**
Move mappers to domain/services directory since they contain business logic for data transformation.

### 2. Business Logic in UseCases (MEDIUM PRIORITY)

#### Issue: Execution Order Calculation in SaveXPathUseCase

**File:** `src/usecases/SaveXPathUseCase.ts` (lines 32-38)

**Current Code:**
```typescript
const sameWebsiteXPaths = collection.getByWebsiteId(websiteId);
const maxOrder =
  sameWebsiteXPaths.length > 0
    ? Math.max(...sameWebsiteXPaths.map((x) => x.executionOrder))
    : 0;
```

**Problem:**
- This calculation logic belongs in the domain layer (either in XPathCollection entity or a domain service)
- UseCases should orchestrate, not implement business rules

**Recommended Solution:**
Add a method to XPathCollection entity:

```typescript
// In XPathCollection entity
public getNextExecutionOrder(websiteId: string): number {
  const sameWebsiteXPaths = this.getByWebsiteId(websiteId);
  const maxOrder =
    sameWebsiteXPaths.length > 0
      ? Math.max(...sameWebsiteXPaths.map((x) => x.executionOrder))
      : 0;
  return maxOrder + 100;
}

// In SaveXPathUseCase
const collection = await this.xpathRepository.load();
const executionOrder = collection.getNextExecutionOrder(websiteId);
```

## Prioritized Refactoring Plan

### Priority 1: Fix Dependency Rule Violations (Export/Import UseCases)
**Impact:** HIGH - This is a fundamental architecture violation
**Effort:** MEDIUM - Requires creating interfaces and updating 6 UseCases

**Steps:**
1. Create `ICSVConverter` interface in domain layer
2. Move mapper logic to domain services or inject mappers through interfaces
3. Update all 6 export/import UseCases
4. Update dependency injection in presentation layer

**Affected Files:**
- `src/usecases/ExportXPathsUseCase.ts`
- `src/usecases/ImportXPathsUseCase.ts`
- `src/usecases/ExportWebsitesUseCase.ts`
- `src/usecases/ImportWebsitesUseCase.ts`
- `src/usecases/ExportAutomationVariablesUseCase.ts`
- `src/usecases/ImportAutomationVariablesUseCase.ts`

### Priority 2: Move Business Logic to Domain Layer
**Impact:** MEDIUM - Improves code organization and testability
**Effort:** LOW - Simple method extraction

**Steps:**
1. Add `getNextExecutionOrder()` method to XPathCollection
2. Update SaveXPathUseCase to use the new method
3. Add tests for the new domain method

**Affected Files:**
- `src/domain/entities/XPathCollection.ts`
- `src/usecases/SaveXPathUseCase.ts`

## Conclusion

The main architectural issue is the violation of the Dependency Rule where UseCases depend on infrastructure layer mappers. This should be addressed as the highest priority. The business logic in UseCases is a secondary concern but should also be refactored to improve code organization.
