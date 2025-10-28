/**
 * Presentation Layer: XPath Manager Molecular Component - XPathCard
 * Molecule: XPath item card with actions
 *
 * Refactored to use template-based rendering with HTML/CSS separation
 */

import { XPathData } from '@domain/entities/XPathCollection';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { TemplateLoader } from '@presentation/common/TemplateLoader';
import { DataBinder } from '@presentation/common/DataBinder';

export interface XPathCardProps {
  xpath: XPathData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

/**
 * XPathCard class-based component
 * Uses TemplateLoader and DataBinder for HTML/CSS separation
 */
export class XPathCard {
  private static templateId = 'xpath-card-template';

  /**
   * Render XPath card from template
   * @param props XPath card properties
   * @returns HTML element for XPath card
   */
  public static render(props: XPathCardProps): HTMLElement {
    // Load template
    const fragment = TemplateLoader.load(this.templateId);
    const card = fragment.querySelector('.xpath-item') as HTMLElement;

    if (!card) {
      throw new Error('XPath card template structure is invalid');
    }

    // Bind data
    this.bindData(card, props);

    // Attach event listeners
    this.attachEventListeners(card, props);

    // Apply i18n to buttons
    this.applyI18n(card);

    return card;
  }

  /**
   * Bind data to template elements
   */
  private static bindData(card: HTMLElement, props: XPathCardProps): void {
    const { xpath } = props;

    // Build info text
    const actionPatternInfo = this.getActionPatternInfo(xpath);
    const retryInfo = this.getRetryInfo(xpath);

    const infoHtml = `
      ${this.escapeHtml(xpath.url)}<br>
      <strong>${I18nAdapter.getMessage('pattern')}:</strong> ${xpath.selectedPathPattern} |
      <strong>${I18nAdapter.getMessage('wait')}:</strong> ${xpath.afterWaitSeconds}s |
      <strong>${I18nAdapter.getMessage('timeout')}:</strong> ${xpath.executionTimeoutSeconds}s
      ${actionPatternInfo}
      ${retryInfo}
    `;

    // Bind all data
    DataBinder.bind(card, {
      title: `#${xpath.executionOrder} ${xpath.actionType} - ${xpath.value.substring(0, 30)}`,
      info: { html: infoHtml },
      pathShort: xpath.pathShort,
      pathAbsolute: xpath.pathAbsolute,
      pathSmart: xpath.pathSmart,
    });

    // Set id attribute directly (data-bind-attr on root element doesn't work with querySelectorAll)
    card.setAttribute('id', xpath.id);
  }

  /**
   * Attach event listeners to action buttons
   */
  private static attachEventListeners(card: HTMLElement, props: XPathCardProps): void {
    const { xpath, onDuplicate, onEdit, onDelete } = props;

    // Duplicate button
    const duplicateBtn = card.querySelector('[data-action="duplicate"]') as HTMLButtonElement;
    if (duplicateBtn && onDuplicate) {
      duplicateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        onDuplicate(xpath.id);
      });
    }

    // Edit button
    const editBtn = card.querySelector('[data-action="edit"]') as HTMLButtonElement;
    if (editBtn && onEdit) {
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        onEdit(xpath.id);
      });
    }

    // Delete button
    const deleteBtn = card.querySelector('[data-action="delete"]') as HTMLButtonElement;
    if (deleteBtn && onDelete) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        onDelete(xpath.id);
      });
    }
  }

  /**
   * Apply i18n to template elements
   */
  private static applyI18n(card: HTMLElement): void {
    const i18nElements = card.querySelectorAll('[data-i18n]');
    i18nElements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const message = I18nAdapter.getMessage(key as any);
        if (message) {
          el.textContent = message;
        }
      }
    });
  }

  /**
   * Get action pattern info HTML
   */
  private static getActionPatternInfo(xpath: XPathData): string {
    if (xpath.actionPattern === undefined) {
      return '';
    }

    const label =
      xpath.actionType === ACTION_TYPE.JUDGE
        ? I18nAdapter.getMessage('comparisonMethod')
        : I18nAdapter.getMessage('action');

    const display = getActionPatternDisplay(xpath.actionType, xpath.actionPattern);

    return ` | <strong>${label}:</strong> ${this.escapeHtml(display)}`;
  }

  /**
   * Get retry info HTML
   */
  private static getRetryInfo(xpath: XPathData): string {
    if (!xpath.retryType) {
      return '';
    }

    return ` | <strong>${I18nAdapter.getMessage('retry')}:</strong> ${xpath.retryType}`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use XPathCard.render() instead
 */
export function renderXPathCard(props: XPathCardProps): string {
  // For backward compatibility, render to element and return outerHTML
  const element = XPathCard.render({
    ...props,
    // Convert string event handlers to functions (for Alpine.js compatibility)
    onEdit: props.onEdit ? () => {} : undefined,
    onDelete: props.onDelete ? () => {} : undefined,
    onDuplicate: props.onDuplicate ? () => {} : undefined,
  });

  return element.outerHTML;
}

// ============================================================================
// Helper Functions (kept for compatibility and reusability)
// ============================================================================

/**
 * Get action pattern display text
 */
function getActionPatternDisplay(actionType: string, actionPattern: number): string {
  if (actionType === ACTION_TYPE.JUDGE) {
    return getJudgePatternDisplay(actionPattern);
  }

  if (isSelectAction(actionType)) {
    return getSelectPatternDisplay(actionPattern);
  }

  if (isInputAction(actionType)) {
    return getInputPatternDisplay(actionPattern);
  }

  return String(actionPattern);
}

/**
 * Get judge pattern display text
 */
function getJudgePatternDisplay(pattern: number): string {
  switch (pattern) {
    case 10:
      return I18nAdapter.getMessage('equalsWithRegex');
    case 20:
      return I18nAdapter.getMessage('notEqualsWithRegex');
    case 30:
      return I18nAdapter.getMessage('greaterThan');
    case 40:
      return I18nAdapter.getMessage('lessThan');
    default:
      return String(pattern);
  }
}

/**
 * Check if action type is a select action
 */
function isSelectAction(actionType: string): boolean {
  return (
    actionType === ACTION_TYPE.SELECT_VALUE ||
    actionType === ACTION_TYPE.SELECT_INDEX ||
    actionType === ACTION_TYPE.SELECT_TEXT ||
    actionType === ACTION_TYPE.SELECT_TEXT_EXACT
  );
}

/**
 * Get select pattern display text
 */
function getSelectPatternDisplay(pattern: number): string {
  const isMultiple = Math.floor(pattern / 100) === 1;
  const customType = Math.floor((pattern % 100) / 10);

  const typeStr = getSelectTypeString(customType);
  const selectType = isMultiple
    ? I18nAdapter.getMessage('multipleSelection')
    : I18nAdapter.getMessage('singleSelection');

  return `${typeStr} (${selectType})`;
}

/**
 * Get select type string
 */
function getSelectTypeString(customType: number): string {
  switch (customType) {
    case 1:
      return 'Native';
    case 2:
      return 'Custom';
    case 3:
      return 'jQuery';
    default:
      return 'Unknown';
  }
}

/**
 * Check if action type is an input action
 */
function isInputAction(actionType: string): boolean {
  return (
    actionType === ACTION_TYPE.TYPE ||
    actionType === ACTION_TYPE.CLICK ||
    actionType === ACTION_TYPE.CHECK
  );
}

/**
 * Get input pattern display text
 */
function getInputPatternDisplay(pattern: number): string {
  switch (pattern) {
    case 10:
      return I18nAdapter.getMessage('basicSimple');
    case 20:
      return I18nAdapter.getMessage('frameworkAgnosticRecommended');
    case 0:
      return I18nAdapter.getMessage('defaultTreatedAs20');
    default:
      return String(pattern);
  }
}
