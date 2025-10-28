/**
 * Infrastructure Layer: Browser XPath Generation Adapter
 * Implements XPath generation using browser DOM APIs
 * Adapts Browser DOM API for XPath generation
 */

import { XPathGenerationPort, XPathResult } from '@domain/types/xpath-generation-port.types';

export class BrowserXPathGenerationAdapter implements XPathGenerationPort {
  /**
   * Generate mixed XPath (uses ID when available)
   */
  getMixed(element: unknown): string | null {
    const domElement = element as Element | null;
    if (!domElement) return null;

    if (domElement.id) {
      return `//*[@id="${domElement.id}"]`;
    }

    if (domElement === document.body) {
      return '/html/body';
    }

    let ix = 0;
    const siblings = domElement.parentNode?.childNodes || [];

    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === domElement) {
        const tagName = domElement.tagName.toLowerCase();
        const parentXPath = this.getMixed(domElement.parentNode as Element);
        return `${parentXPath}/${tagName}[${ix + 1}]`;
      }

      if (sibling.nodeType === 1 && (sibling as Element).tagName === domElement.tagName) {
        ix++;
      }
    }

    return null;
  }

  /**
   * Generate absolute XPath (from root, no IDs)
   */
  getAbsolute(element: unknown): string | null {
    const domElement = element as Element | null;
    if (!domElement) return null;

    if (domElement === document.documentElement) {
      return '/html';
    }

    if (domElement === document.body) {
      return '/html/body';
    }

    let ix = 0;
    const siblings = domElement.parentNode?.childNodes || [];

    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === domElement) {
        const tagName = domElement.tagName.toLowerCase();
        const parentXPath = this.getAbsolute(domElement.parentNode as Element);
        return `${parentXPath}/${tagName}[${ix + 1}]`;
      }

      if (sibling.nodeType === 1 && (sibling as Element).tagName === domElement.tagName) {
        ix++;
      }
    }

    return null;
  }

  /**
   * Generate smart XPath (uses attributes like id, class, text)
   */
  getSmart(element: unknown): string | null {
    const domElement = element as Element | null;
    if (!domElement) return null;

    const segments = this.buildSmartSegments(domElement);
    return segments.length > 0 ? '//' + segments.join('/') : null;
  }

  private buildSmartSegments(element: Element): string[] {
    const segments: string[] = [];
    let currentElement: Element | null = element;

    while (currentElement && currentElement !== document.documentElement) {
      const result = this.buildSmartSegment(currentElement);
      segments.unshift(result.segment);

      if (result.shouldStop) {
        break;
      }

      currentElement = currentElement.parentElement;
    }

    return segments;
  }

  private buildSmartSegment(element: Element): { segment: string; shouldStop: boolean } {
    let segment = element.tagName.toLowerCase();
    let shouldStop = false;

    // Prefer ID - it's unique, so we can stop here
    if (element.id) {
      segment += `[@id="${element.id}"]`;
      shouldStop = true;
      return { segment, shouldStop };
    }

    // Try to use class
    segment = this.addClassToSegment(segment, element);

    // Try to use text content for links and buttons
    segment = this.addTextContentToSegment(segment, element);

    // Try to use common attributes
    segment = this.addAttributesToSegment(segment, element);

    return { segment, shouldStop };
  }

  private addClassToSegment(segment: string, element: Element): string {
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/);
      if (classes.length > 0 && classes[0]) {
        segment += `[@class="${classes[0]}"]`;
      }
    }
    return segment;
  }

  private addTextContentToSegment(segment: string, element: Element): string {
    if ((element.tagName === 'A' || element.tagName === 'BUTTON') && element.textContent) {
      const text = element.textContent.trim().substring(0, 30);
      if (text) {
        segment += `[contains(text(), "${text}")]`;
      }
    }
    return segment;
  }

  private addAttributesToSegment(segment: string, element: Element): string {
    const name = element.getAttribute('name');
    const type = element.getAttribute('type');
    const value = element.getAttribute('value');

    if (name) {
      segment += `[@name="${name}"]`;
    } else if (type) {
      segment += `[@type="${type}"]`;
    } else if (value && value.length < 30) {
      segment += `[@value="${value}"]`;
    }

    return segment;
  }

  /**
   * Generate all three XPath variants at once
   */
  generateAll(element: unknown): XPathResult {
    const domElement = element as Element | null;
    return {
      smart: this.getSmart(domElement),
      short: this.getMixed(domElement),
      absolute: this.getAbsolute(domElement),
    };
  }
}
