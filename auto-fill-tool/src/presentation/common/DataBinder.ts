/**
 * Data Binding Helper
 * Provides simple and secure data binding for HTML templates
 *
 * This utility enables separation of HTML structure from data by:
 * - Binding data to elements using data-bind attributes
 * - Binding attributes using data-bind-attr
 * - Providing XSS-safe binding methods
 * - Supporting various data types (string, number, boolean, HTML)
 *
 * @example
 * ```typescript
 * // HTML Template:
 * // <div class="card">
 * //   <h1 data-bind="title"></h1>
 * //   <p data-bind="content"></p>
 * //   <img data-bind-attr="imageUrl:src" />
 * // </div>
 *
 * // TypeScript:
 * const element = templateFragment.querySelector('.card') as HTMLElement;
 * DataBinder.bind(element, {
 *   title: 'My Card',
 *   content: 'Card content here'
 * });
 * DataBinder.bindAttributes(element, {
 *   imageUrl: 'https://example.com/image.jpg'
 * });
 * ```
 */
import { HtmlSanitizationService } from '@infrastructure/services/HtmlSanitizationService';

export class DataBinder {
  private static htmlSanitizer = new HtmlSanitizationService();

  /**
   * Bind data to elements with data-bind attributes
   *
   * This method finds all elements with [data-bind] attribute and sets their
   * content based on the provided data object. By default, uses textContent
   * for security (prevents XSS). For HTML content, use { html: '...' } format.
   *
   * @param element - The root element to search for data-bind attributes
   * @param data - Object containing data to bind (key matches data-bind value)
   *
   * @example
   * ```typescript
   * // Safe text binding (default):
   * DataBinder.bind(element, {
   *   userName: 'John <script>alert("XSS")</script>',  // Will be escaped
   *   userEmail: 'john@example.com'
   * });
   *
   * // Explicit HTML binding (use with caution):
   * DataBinder.bind(element, {
   *   content: { html: '<strong>Bold text</strong>' }  // Will render as HTML
   * });
   * ```
   */
  public static bind(element: HTMLElement, data: Record<string, unknown>): void {
    // Find all elements with data-bind attribute
    const bindableElements = element.querySelectorAll('[data-bind]');

    bindableElements.forEach((el) => {
      const bindKey = el.getAttribute('data-bind');

      if (!bindKey) {
        return;
      }

      // Check if data exists for this key
      if (!(bindKey in data)) {
        return;
      }

      const value = data[bindKey];

      // Handle different value types
      if (value === null || value === undefined) {
        // Clear content for null/undefined
        el.textContent = '';
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        // Safe: Use textContent for primitives (XSS protection)
        el.textContent = String(value);
      } else if (typeof value === 'object' && 'html' in value) {
        // Explicit HTML mode: Use innerHTML when explicitly requested
        // ✅ AUTO-SANITIZE: HTML content is automatically sanitized using DOMPurify
        el.innerHTML = DataBinder.htmlSanitizer.sanitizeHtml(value.html);
      } else {
        // Fallback: Convert to string and use textContent
        el.textContent = String(value);
      }
    });

    // Find all elements with data-bind-html attribute for HTML content
    const htmlBindableElements = element.querySelectorAll('[data-bind-html]');

    htmlBindableElements.forEach((el) => {
      const bindKey = el.getAttribute('data-bind-html');

      if (!bindKey) {
        return;
      }

      // Check if data exists for this key
      if (!(bindKey in data)) {
        return;
      }

      const value = data[bindKey];

      // Handle different value types for HTML binding
      if (value === null || value === undefined) {
        // Clear content for null/undefined
        el.innerHTML = '';
      } else if (typeof value === 'string') {
        // ✅ AUTO-SANITIZE: Use innerHTML for string values in data-bind-html
        el.innerHTML = DataBinder.htmlSanitizer.sanitizeHtml(value);
      } else if (typeof value === 'object' && 'html' in value) {
        // ✅ AUTO-SANITIZE: Support { html: '...' } format as well
        el.innerHTML = DataBinder.htmlSanitizer.sanitizeHtml(value.html);
      } else {
        // Fallback: Convert to string and sanitize
        el.innerHTML = DataBinder.htmlSanitizer.sanitizeHtml(String(value));
      }
    });
  }

  /**
   * Bind data to element attributes using data-bind-attr
   *
   * This method finds all elements with [data-bind-attr] attribute and sets
   * their attributes based on the provided data object.
   *
   * Format:
   * - Single: data-bind-attr="dataKey:attributeName"
   * - Multiple: data-bind-attr="key1:attr1,key2:attr2,key3:attr3"
   *
   * @param element - The root element to search for data-bind-attr attributes
   * @param data - Object containing data to bind to attributes
   *
   * @example
   * ```typescript
   * // Single attribute binding:
   * // HTML: <img data-bind-attr="imageUrl:src" />
   * DataBinder.bindAttributes(element, {
   *   imageUrl: 'https://example.com/photo.jpg'
   * });
   * // Result: <img src="https://example.com/photo.jpg" />
   *
   * // Multiple attribute binding:
   * // HTML: <input data-bind-attr="placeholder:placeholder,value:value" />
   * DataBinder.bindAttributes(element, {
   *   placeholder: 'Enter name',
   *   value: 'John Doe'
   * });
   * // Result: <input placeholder="Enter name" value="John Doe" />
   * ```
   */
  public static bindAttributes(element: HTMLElement, data: Record<string, unknown>): void {
    // Find all elements with data-bind-attr attribute
    const bindableElements = element.querySelectorAll('[data-bind-attr]');

    bindableElements.forEach((el) => {
      const bindAttr = el.getAttribute('data-bind-attr');

      if (!bindAttr) {
        return;
      }

      // Parse the binding format: "dataKey:attributeName" or "key1:attr1,key2:attr2,..."
      const bindings = bindAttr.split(',').map((b) => b.trim());

      for (const binding of bindings) {
        const parts = binding.split(':');
        if (parts.length !== 2) {
          console.warn(
            `Invalid data-bind-attr format: "${binding}". ` +
              `Expected format: "dataKey:attributeName"`
          );
          continue;
        }

        const [dataKey, attrName] = parts;

        // Check if dataKey exists and data exists for this key
        if (!dataKey || !attrName || !(dataKey in data)) {
          continue;
        }

        const value = data[dataKey];

        // Set attribute value
        if (value === null || value === undefined) {
          // Remove attribute for null/undefined
          el.removeAttribute(attrName);
        } else {
          // Convert to string and set attribute
          el.setAttribute(attrName, String(value));
        }
      }
    });
  }

  /**
   * Bind multiple attributes to a single element
   *
   * This is a convenience method for binding multiple attributes at once
   * without requiring data-bind-attr in the HTML.
   *
   * @param element - The element to set attributes on
   * @param attributes - Object with attribute names as keys and values
   *
   * @example
   * ```typescript
   * const img = element.querySelector('img') as HTMLImageElement;
   * DataBinder.setAttributes(img, {
   *   src: 'https://example.com/photo.jpg',
   *   alt: 'Profile photo',
   *   width: '200',
   *   height: '200'
   * });
   * ```
   */
  public static setAttributes(
    element: HTMLElement,
    attributes: Record<string, string | number | boolean | null | undefined>
  ): void {
    for (const [attrName, value] of Object.entries(attributes)) {
      if (value === null || value === undefined) {
        element.removeAttribute(attrName);
      } else {
        element.setAttribute(attrName, String(value));
      }
    }
  }

  /**
   * Bind CSS classes based on conditional data
   *
   * This method adds or removes CSS classes based on boolean values in the data object.
   *
   * @param element - The element to modify classes on
   * @param classes - Object with class names as keys and boolean values
   *
   * @example
   * ```typescript
   * DataBinder.bindClasses(element, {
   *   'active': isActive,
   *   'disabled': isDisabled,
   *   'highlighted': isHighlighted
   * });
   * // Adds 'active' class if isActive is true
   * // Adds 'disabled' class if isDisabled is true
   * // etc.
   * ```
   */
  public static bindClasses(element: HTMLElement, classes: Record<string, boolean>): void {
    for (const [className, shouldAdd] of Object.entries(classes)) {
      if (shouldAdd) {
        element.classList.add(className);
      } else {
        element.classList.remove(className);
      }
    }
  }

  /**
   * Bind inline styles based on data
   *
   * This method sets inline CSS styles on an element based on the provided style object.
   *
   * @param element - The element to set styles on
   * @param styles - Object with CSS property names as keys (camelCase)
   *
   * @example
   * ```typescript
   * DataBinder.bindStyles(element, {
   *   color: '#333',
   *   backgroundColor: '#f0f0f0',
   *   fontSize: '14px',
   *   display: isVisible ? 'block' : 'none'
   * });
   * ```
   */
  public static bindStyles(element: HTMLElement, styles: Record<string, string>): void {
    for (const [property, value] of Object.entries(styles)) {
      if (value === null || value === undefined || value === '') {
        // Remove style property
        element.style.removeProperty(property);
      } else {
        // Set style property
        (element.style as unknown)[property] = value;
      }
    }
  }

  /**
   * Complete data binding for an element
   *
   * This is a convenience method that applies all binding types at once:
   * - Content binding (data-bind)
   * - Attribute binding (data-bind-attr)
   * - Class binding (if classes provided)
   * - Style binding (if styles provided)
   *
   * @param element - The root element to bind data to
   * @param options - Object containing all binding data
   *
   * @example
   * ```typescript
   * DataBinder.bindAll(element, {
   *   data: { title: 'My Title', content: 'My Content' },
   *   attributes: { imageUrl: 'https://example.com/img.jpg' },
   *   classes: { active: true, disabled: false },
   *   styles: { color: '#333' }
   * });
   * ```
   */
  public static bindAll(
    element: HTMLElement,
    options: {
      data?: Record<string, unknown>;
      attributes?: Record<string, unknown>;
      classes?: Record<string, boolean>;
      styles?: Record<string, string>;
    }
  ): void {
    if (options.data) {
      this.bind(element, options.data);
    }

    if (options.attributes) {
      this.bindAttributes(element, options.attributes);
    }

    if (options.classes) {
      this.bindClasses(element, options.classes);
    }

    if (options.styles) {
      this.bindStyles(element, options.styles);
    }
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   *
   * ✅ PRODUCTION-READY: Now uses DOMPurify for industry-standard sanitization.
   *
   * This method removes potentially dangerous HTML tags, attributes, and JavaScript code
   * while preserving safe HTML formatting. Uses DOMPurify's battle-tested sanitization engine.
   *
   * @param html - The HTML string to sanitize
   * @returns Sanitized HTML string safe for rendering
   *
   * @example
   * ```typescript
   * const userInput = '<script>alert("XSS")</script><p>Safe content</p>';
   * const safe = DataBinder.sanitizeHTML(userInput);
   * // Result: '<p>Safe content</p>'
   * ```
   */
  public static sanitizeHTML(html: string): string {
    // Delegate to DOMPurify-based sanitizer
    return DataBinder.htmlSanitizer.sanitizeHtml(html);
  }
}
