// Everyday vegetarian Indian foods for the food log: [name, serving, kcal, protein g].
// Values are rounded estimates for typical home-cooked portions (a katori ≈ 150 ml). Real
// numbers vary with oil, brand and portion size — good enough to see your averages.
const F = (n, serving, kcal, p) => ({ n, serving, kcal, p })

export const FOODS = [
  // Breads & rice
  F('Roti / chapati', '1 medium', 100, 3),
  F('Paratha, plain', '1', 250, 5),
  F('Aloo paratha', '1', 300, 6),
  F('Paneer paratha', '1', 330, 11),
  F('Rice, cooked', '1 katori', 195, 4),
  F('Veg pulao', '1 plate', 300, 6),
  F('Veg biryani', '1 plate', 400, 8),
  F('Khichdi', '1 katori', 180, 6),
  F('Bread slice', '1', 70, 2.5),
  // Dal, beans, soya
  F('Dal (toor / moong / masoor)', '1 katori', 130, 7),
  F('Rajma or chole curry', '1 katori', 200, 9),
  F('Kadhi', '1 katori', 150, 5),
  F('Sambar', '1 katori', 90, 4),
  F('Soya chunks, dry weight', '30 g', 105, 15),
  F('Soya chunk curry', '1 katori', 160, 13),
  F('Sprouts', '1 katori', 100, 7),
  F('Boiled chana', '1 katori', 170, 9),
  // Paneer & dairy
  F('Paneer, plain', '100 g', 265, 18),
  F('Paneer sabzi', '1 katori', 300, 14),
  F('Paneer bhurji', '1 katori', 280, 16),
  F('Milk', '1 glass (250 ml)', 150, 8),
  F('Curd / dahi', '1 katori', 90, 5),
  F('Raita', '1 katori', 90, 4),
  F('Chaas / buttermilk', '1 glass', 40, 2),
  F('Lassi, sweet', '1 glass', 200, 6),
  F('Tea or coffee with milk & sugar', '1 cup', 60, 1.5),
  // Sabzi & salad
  F('Mixed vegetable sabzi', '1 katori', 100, 3),
  F('Aloo sabzi', '1 katori', 150, 3),
  F('Salad', '1 plate', 40, 2),
  // Breakfast
  F('Poha', '1 plate', 250, 5),
  F('Upma', '1 plate', 250, 6),
  F('Besan chilla', '1', 150, 7),
  F('Moong dal chilla', '1', 130, 6),
  F('Idli', '1', 60, 2),
  F('Dosa, plain', '1', 170, 4),
  F('Masala dosa', '1', 300, 6),
  F('Oats with milk', '1 bowl', 280, 11),
  F('Daliya / porridge', '1 katori', 150, 5),
  // Snacks & nuts
  F('Roasted chana', '30 g', 110, 6),
  F('Peanuts, roasted', '30 g', 170, 8),
  F('Almonds', '10', 70, 2.5),
  F('Makhana (fox nuts)', '30 g', 105, 3),
  F('Sattu drink', '30 g sattu', 120, 6),
  F('Peanut butter', '1 tbsp', 95, 4),
  F('Whey protein', '1 scoop', 120, 24),
  F('Banana', '1', 105, 1.3),
  F('Apple', '1', 80, 0.4),
  F('Biscuits (Marie / Parle-G)', '2', 90, 1.5),
  F('Namkeen / bhujia', '30 g', 170, 4),
  F('Samosa', '1', 260, 4),
  F('Maggi noodles', '1 pack', 350, 7),
  // Sweets & extras
  F('Gulab jamun', '1', 150, 2),
  F('Mithai', '1 piece', 150, 3),
  F('Ice cream', '1 scoop', 140, 2.5),
  F('Cold drink / soda', '1 glass', 140, 0),
  F('Ghee or oil', '1 tsp', 45, 0)
].map((f, i) => ({ id: 'f' + i, ...f }))

export const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']
