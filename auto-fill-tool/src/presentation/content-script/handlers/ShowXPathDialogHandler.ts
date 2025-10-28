/**
 * Presentation Layer: Show XPath Dialog Message Handler
 * Handles showXPathDialog messages from background script
 */

import { MessageHandler, MessageContext } from '@domain/types/messaging';
import { ShowXPathDialogRequest, ShowXPathDialogResponse } from '@domain/types/messaging';
import { XPathDialog } from '../XPathDialog';

export class ShowXPathDialogHandler
  implements MessageHandler<ShowXPathDialogRequest, ShowXPathDialogResponse>
{
  constructor(private lastRightClickPositionGetter: () => { x: number; y: number }) {}

  handle(message: ShowXPathDialogRequest, _context: MessageContext): ShowXPathDialogResponse {
    if (!message.xpathInfo) {
      return {
        success: false,
        error: 'Missing xpathInfo',
      };
    }

    const lastRightClickPosition = this.lastRightClickPositionGetter();
    const dialog = new XPathDialog();

    dialog.show(
      {
        smart: message.xpathInfo.smart || '',
        short: message.xpathInfo.short || '',
        absolute: message.xpathInfo.absolute || '',
        elementInfo: message.xpathInfo.elementInfo,
      },
      lastRightClickPosition.x,
      lastRightClickPosition.y
    );

    return {
      success: true,
    };
  }
}
