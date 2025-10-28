/**
 * Presentation Layer: Popup UI Atomic Component - WebsiteList
 * Organism: Website cards list with Alpine.js integration
 */

import { renderEmptyState } from '../molecules/EmptyState';

/**
 * Render website list organism
 * This component uses Alpine.js for dynamic rendering
 * @returns HTML string for website list
 */
export function renderWebsiteList(): string {
  return `
    <div class="website-list">
      <!-- 空状態 -->
      <template x-if="isEmpty()">
        ${renderEmptyState()}
      </template>

      <!-- ウェブサイトリスト -->
      <template x-for="website in websites" :key="website.id">
        <div x-html="renderWebsiteCard(website)"></div>
      </template>
    </div>
  `;
}
