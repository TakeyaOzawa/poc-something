/**
 * HTML Template Loader Utility
 * Provides centralized template loading and caching for presentation layer components
 *
 * This utility enables HTML/CSS separation from TypeScript by:
 * - Loading HTML templates from DOM <template> elements
 * - Caching templates for performance
 * - Providing a consistent API for all presentation components
 *
 * @example
 * ```typescript
 * // In HTML file:
 * // <template id="my-component-template">
 * //   <div class="my-component">...</div>
 * // </template>
 *
 * // In TypeScript:
 * const fragment = TemplateLoader.load('my-component-template');
 * const element = fragment.querySelector('.my-component') as HTMLElement;
 * container.appendChild(element);
 * ```
 */
export class TemplateLoader {
  /**
   * Template cache to avoid repeated DOM queries
   * Key: template ID, Value: HTMLTemplateElement
   */
  private static cache = new Map<string, HTMLTemplateElement>();

  /**
   * Load and clone HTML template by ID
   *
   * This method:
   * 1. Checks cache for existing template
   * 2. If not cached, queries DOM for template element
   * 3. Caches the template element
   * 4. Returns a deep clone of the template content
   *
   * @param templateId - The ID of the <template> element in the DOM
   * @returns A DocumentFragment containing the cloned template content
   * @throws Error if template is not found in DOM
   *
   * @example
   * ```typescript
   * const fragment = TemplateLoader.load('xpath-card-template');
   * const card = fragment.querySelector('.xpath-item') as HTMLElement;
   * container.appendChild(card);
   * ```
   */
  public static load(templateId: string): DocumentFragment {
    // Check cache first
    if (!this.cache.has(templateId)) {
      const template = document.getElementById(templateId) as HTMLTemplateElement;

      if (!template) {
        throw new Error(
          `Template not found: ${templateId}. ` +
            `Ensure <template id="${templateId}"> exists in the HTML document.`
        );
      }

      if (!(template instanceof HTMLTemplateElement)) {
        throw new Error(
          `Element with id="${templateId}" is not a <template> element. ` +
            `Found: ${(template as HTMLElement).tagName}`
        );
      }

      // Cache the template element
      this.cache.set(templateId, template);
    }

    // Get cached template and return a deep clone of its content
    const template = this.cache.get(templateId)!;
    return template.content.cloneNode(true) as DocumentFragment;
  }

  /**
   * Check if a template with the given ID exists in the cache
   *
   * @param templateId - The template ID to check
   * @returns true if template is cached, false otherwise
   */
  public static has(templateId: string): boolean {
    return this.cache.has(templateId);
  }

  /**
   * Clear the template cache
   *
   * Use this method in tests or when templates are dynamically updated.
   * In production, templates are typically static, so clearing is rarely needed.
   *
   * @example
   * ```typescript
   * // In tests:
   * afterEach(() => {
   *   TemplateLoader.clearCache();
   * });
   * ```
   */
  public static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear a specific template from the cache
   *
   * @param templateId - The template ID to remove from cache
   * @returns true if template was in cache and removed, false otherwise
   */
  public static clearTemplate(templateId: string): boolean {
    return this.cache.delete(templateId);
  }

  /**
   * Get the size of the template cache
   *
   * @returns Number of cached templates
   */
  public static getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Preload multiple templates into cache
   *
   * Useful for preloading templates during application initialization
   * to improve performance of subsequent template loads.
   *
   * @param templateIds - Array of template IDs to preload
   * @throws Error if any template is not found
   *
   * @example
   * ```typescript
   * // Preload all component templates on page load
   * TemplateLoader.preload([
   *   'xpath-card-template',
   *   'sync-card-template',
   *   'progress-indicator-template'
   * ]);
   * ```
   */
  public static preload(templateIds: string[]): void {
    for (const templateId of templateIds) {
      if (!this.cache.has(templateId)) {
        const template = document.getElementById(templateId) as HTMLTemplateElement;

        if (!template) {
          throw new Error(
            `Template not found during preload: ${templateId}. ` +
              `Ensure <template id="${templateId}"> exists in the HTML document.`
          );
        }

        if (!(template instanceof HTMLTemplateElement)) {
          throw new Error(
            `Element with id="${templateId}" is not a <template> element during preload. ` +
              `Found: ${(template as HTMLElement).tagName}`
          );
        }

        this.cache.set(templateId, template);
      }
    }
  }
}
