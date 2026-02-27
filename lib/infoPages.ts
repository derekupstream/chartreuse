export interface InfoPage {
  id: string;
  title: string;
  content: any;
  showOnShared: boolean;
}

export const EMPTY_SLATE = [{ type: 'paragraph', children: [{ text: '' }] }];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Parse the recommendations field into InfoPage[].
 * Handles both legacy single-page Slate format and new multi-page format.
 */
export function parseInfoPages(recommendations: any): InfoPage[] {
  if (!recommendations) {
    return [{ id: generateId(), title: 'Additional Information Page', content: EMPTY_SLATE, showOnShared: true }];
  }
  if (recommendations?.__v === 2 && Array.isArray(recommendations.pages)) {
    return recommendations.pages;
  }
  // Legacy: plain Slate array → single page
  return [{ id: generateId(), title: 'Additional Information Page', content: recommendations, showOnShared: true }];
}

/**
 * Parse for shared page display — respects legacy showRecommendations flag.
 */
export function parseInfoPagesForShared(recommendations: any, showRecommendations?: boolean): InfoPage[] {
  if (!recommendations) return [];
  if (recommendations?.__v === 2 && Array.isArray(recommendations.pages)) {
    return recommendations.pages;
  }
  // Legacy format
  if (!showRecommendations) return [];
  return [{ id: 'legacy', title: 'Additional Information Page', content: recommendations, showOnShared: true }];
}

export function hasInfoPageContent(content: any): boolean {
  if (!Array.isArray(content) || content.length === 0) return false;
  if (content.length > 1) return true;
  const first = content[0];
  return first?.children?.some((c: any) => (c.text ?? '').length > 0) ?? false;
}

export function serializeInfoPages(pages: InfoPage[]) {
  return { __v: 2, pages };
}
