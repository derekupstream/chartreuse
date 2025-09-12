export const PRODUCT_CATEGORIES = [
  {
    id: '0',
    name: 'Beverages',
    icon: '002-beverage-1.svg',
    csvNames: ['Beverage Cups & Lids', 'Beverage Accessories', 'Straws and Stirrers', 'Beverages']
  },
  {
    id: '1',
    name: 'Foodware',
    icon: '006-food.svg',
    csvNames: [
      'Food Wraps',
      'Food Trays',
      'Plates and Bowls (Dinnerware)',
      'Takeout Containers & Lids',
      'Food Cups & Lids',
      'Foodware'
    ]
  }, // Plate, bowl, food tray, soup or ice cream cup, sauce portion cup, take-out container (clamshell), take-out box (closing food box)
  { id: '2', name: 'Utensils', icon: '003-cutlery.svg', csvNames: ['Utensils', 'Tooth Picks'] }, // fork, spoon, tasting spoon, knife, soup spoon, teaspoon, chopsticks
  { id: '3', name: 'Condiments', icon: '016-sauce.svg', csvNames: ['Condiment Packets', 'Condiments'] }, // Mustard, Creamer, Sugar (in the Raw and regular),
  { id: '4', name: 'Napkins', icon: '009-napkin-2.svg', csvNames: ['Napkins'] },
  { id: '5', name: 'Drinking Water', icon: '001-water.svg', csvNames: ['Drinking Water'] }
] as const;
