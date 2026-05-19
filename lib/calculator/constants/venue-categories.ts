/**
 * Venue categories for Chart-Reuse Accounts. Used to classify the customer/venue
 * a reuse program operates at — drives industry benchmarking, RSP reporting, and
 * future venue-type-specific factor selection.
 */
export const VENUE_CATEGORIES = [
  'K-12 School',
  'University / College',
  'Corporate Office',
  'Cafe',
  'Coffee Shop',
  'Restaurant - Fast Casual',
  'Restaurant - Fine Dining',
  'Restaurant - Quick Service',
  'Stadium',
  'Arena',
  'Museum',
  'Hotel',
  'Hospital / Healthcare',
  'Festival / Event Venue',
  'Convention Center',
  'Food Hall',
  'Cafeteria',
  'Retail / Grocery',
  'Other'
] as const;

export type VenueCategory = (typeof VENUE_CATEGORIES)[number];

export const VENUE_CATEGORY_OPTIONS = VENUE_CATEGORIES.map(c => ({ value: c, label: c }));
