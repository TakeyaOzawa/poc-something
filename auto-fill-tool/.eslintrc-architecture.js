/**
 * Custom ESLint rules for Clean Architecture enforcement
 * These rules ensure proper layer separation and dependency flow
 */

module.exports = {
  rules: {
    // Domain layer rules
    'domain-layer-purity': {
      create(context) {
        return {
          ImportDeclaration(node) {
            const filename = context.getFilename();
            const importPath = node.source.value;
            
            // Check if we're in domain layer
            if (filename.includes('/src/domain/')) {
              // Domain layer cannot import from other layers
              if (importPath.includes('infrastructure') || 
                  importPath.includes('presentation') || 
                  importPath.includes('usecases')) {
                context.report({
                  node,
                  message: `Domain layer cannot import from ${importPath}. Domain must remain pure.`
                });
              }
              
              // Domain layer cannot import external libraries directly (except specific allowed ones)
              const allowedExternalLibraries = ['uuid']; // Will be flagged by no-restricted-imports
              if (!importPath.startsWith('.') && 
                  !importPath.startsWith('@domain') && 
                  !importPath.startsWith('@/domain') &&
                  !allowedExternalLibraries.includes(importPath)) {
                context.report({
                  node,
                  message: `Domain layer should not import external library '${importPath}' directly. Use port interfaces instead.`
                });
              }
            }
          }
        };
      }
    // Infrastructure layer rules
    'infrastructure-adapter-pattern': {
      create(context) {
        return {
          ClassDeclaration(node) {
            const filename = context.getFilename();
            
            // Check if we're in infrastructure layer
            if (filename.includes('/src/infrastructure/')) {
              const className = node.id?.name;
              
              if (className) {
                // Infrastructure classes should end with Adapter, Repository, or Factory
                if (!className.endsWith('Adapter') && 
                    !className.endsWith('Repository') && 
                    !className.endsWith('Factory') &&
                    !className.endsWith('Mapper') &&
                    !className.endsWith('Decorator')) {
                  
                  // Special check for Service suffix
                  if (className.endsWith('Service')) {
                    context.report({
                      node,
                      message: `Infrastructure layer should use Adapter pattern instead of Service pattern. Rename "${className}" to "${className.replace('Service', 'Adapter')}".`
                    });
                  } else {
                    context.report({
                      node,
                      message: `Infrastructure layer class "${className}" should end with Adapter, Repository, Factory, Mapper, or Decorator to follow architectural patterns.`
                    });
                  }
                }
              }
            }
          },
          
          // Check file naming
          Program(node) {
            const filename = context.getFilename();
            
            if (filename.includes('/src/infrastructure/') && filename.endsWith('.ts')) {
              const baseName = filename.split('/').pop()?.replace('.ts', '');
              
              if (baseName && 
                  !baseName.endsWith('Adapter') && 
                  !baseName.endsWith('Repository') && 
                  !baseName.endsWith('Factory') &&
                  !baseName.endsWith('Mapper') &&
                  !baseName.endsWith('Decorator') &&
                  baseName !== 'index') {
                
                if (baseName.endsWith('Service')) {
                  context.report({
                    node,
                    message: `Infrastructure layer file "${baseName}.ts" should be renamed to "${baseName.replace('Service', 'Adapter')}.ts" to follow Adapter pattern.`
                  });
                }
              }
            }
          }
        };
      }
    },
      create(context) {
        return {
          ImportDeclaration(node) {
            const filename = context.getFilename();
            const importPath = node.source.value;
            
            // Check if we're in usecases layer
            if (filename.includes('/src/usecases/')) {
              // Usecases can only import from domain layer
              if (importPath.includes('infrastructure') || 
                  importPath.includes('presentation')) {
                context.report({
                  node,
                  message: `Use case layer cannot import from ${importPath}. Use cases should only depend on domain layer.`
                });
              }
            }
          }
        };
      }
    }
  }
};
