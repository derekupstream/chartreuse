export const PRODUCT_CATEGORIES = [
  { id: 0, name: 'Beverages', csvNames: ['Beverage Cups & Lids', 'Beverage Accessories'] },
  { id: 1, name: 'Foodware', csvNames: ['Food Wraps', 'Food Trays', 'Plates and Bowls (Dinnerware)', 'Takeout Containers & Lids', 'Straws and Stirrers'] }, // Plate, bowl, food tray, soup or ice cream cup, sauce portion cup, take-out container (clamshell), take-out box (closing food box)
  { id: 2, name: 'Lids', csvNames: ['Food Cups & Lids'] }, // cold cup lid, hot cup lid, soup /ice cream cup lid, portion cup lid
  { id: 3, name: 'Utensils', csvNames: ['Utensils', 'Tooth Picks'] }, // fork, spoon, tasting spoon, knife, soup spoon, teaspoon, chopsticks
  { id: 4, name: 'Condiments', csvNames: ['Condiment Packets'] }, // Mustard, Creamer, Sugar (in the Raw and regular),
  { id: 5, name: 'Napkins', csvNames: ['Napkins'] },
] as const
