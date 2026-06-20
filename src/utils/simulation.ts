import { CellData } from '../types';

export const generateCells = (): CellData[] => {
  const cells: CellData[] = [];
  for (let i = 0; i < 64; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    
    // We want a mix of urban and rural, some slums (high pop, low wealth), 
    // some rich urban (high pop, high wealth), and rural villages (low pop, med wealth).
    const isUrban = Math.random() < 0.35;
    
    let nightlight, mobile, building, population, groundTruth;

    if (isUrban) {
      // High population density generally
      population = Math.random() * 50 + 50; // 50-100
      
      const isSlum = Math.random() < 0.4;
      
      if (isSlum) {
        // High pop, but low true wealth
        groundTruth = Math.random() * 30; // 0-30 wealth
        nightlight = groundTruth + Math.random() * 20; 
        mobile = groundTruth + Math.random() * 30;
        building = groundTruth + Math.random() * 20 + 20; // dense but poor quality
      } else {
        // High pop, high wealth
        groundTruth = Math.random() * 40 + 60; // 60-100 wealth
        nightlight = groundTruth - Math.random() * 10;
        mobile = groundTruth - Math.random() * 10;
        building = groundTruth - Math.random() * 10;
      }
    } else {
      // Rural
      population = Math.random() * 40; // 0-40 pop density
      
      const isVillage = Math.random() < 0.6;
      if (isVillage) {
         groundTruth = Math.random() * 40 + 10; // 10-50 wealth
         nightlight = groundTruth / 2; // less nightlight in rural
         mobile = groundTruth + Math.random() * 20; // mobile still possible
         building = groundTruth / 2; // sparse buildings
      } else {
         // Deep rural / empty
         groundTruth = Math.random() * 15; // 0-15 wealth
         nightlight = Math.random() * 10;
         mobile = Math.random() * 15;
         building = Math.random() * 10;
      }
    }

    const clamp = (val: number) => Math.min(100, Math.max(0, Math.round(val)));
    
    cells.push({
      id: i,
      row,
      col,
      nightlight: clamp(nightlight),
      mobile: clamp(mobile),
      building: clamp(building),
      population: clamp(population),
      groundTruth: clamp(groundTruth)
    });
  }
  return cells;
};
