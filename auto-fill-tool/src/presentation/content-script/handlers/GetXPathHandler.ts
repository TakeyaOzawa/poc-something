/**
 * Presentation Layer: Get XPath Message Handler
 * Handles getXPath messages from background script
 */

import { MessageHandler, MessageContext } from '@domain/types/messaging';
import { GetXPathRequest, GetXPathResponse } from '@domain/types/messaging';
import { XPathGenerationPort } from '@domain/types/xpath-generation-port.types';

export class GetXPathHandler implements MessageHandler<GetXPathRequest, GetXPathResponse> {
  constructor(
    private lastRightClickedElementGetter: () => Element | null,
    private xpathService: XPathGenerationPort
  ) {}

  handle(_message: GetXPathRequest, _context: MessageContext): GetXPathResponse {
    const lastRightClickedElement = this.lastRightClickedElementGetter();

    if (!lastRightClickedElement) {
      return {
        success: false,
        error: 'No element was right-clicked',
      };
    }

    const xpaths = this.xpathService.generateAll(lastRightClickedElement);
    const elementValue = this.getElementValue(lastRightClickedElement);

    return {
      success: true,
      xpaths: {
        mixed: xpaths.short,
        absolute: xpaths.absolute,
        smart: xpaths.smart,
      },
      elementInfo: {
        tagName: lastRightClickedElement.tagName,
        text: elementValue,
      },
    };
  }

  /**
   * Get value from an element based on its type
   */
  private getElementValue(element: Element): string {
    const htmlElement = element as HTMLElement;

    if (htmlElement instanceof HTMLInputElement) {
      // For checkbox and radio buttons, get checked state as 1 or 0
      if (htmlElement.type === 'checkbox' || htmlElement.type === 'radio') {
        return htmlElement.checked ? '1' : '0';
      } else {
        // For other input types, get the value property
        return htmlElement.value;
      }
    } else if (htmlElement instanceof HTMLTextAreaElement) {
      // For textarea elements, get the value property
      return htmlElement.value;
    } else if (htmlElement instanceof HTMLSelectElement) {
      // For select elements, get the selected option's value or text
      return htmlElement.value || htmlElement.options[htmlElement.selectedIndex]?.text || '';
    } else {
      // For other elements, get text content
      return htmlElement.textContent?.substring(0, 50) || '';
    }
  }
}
