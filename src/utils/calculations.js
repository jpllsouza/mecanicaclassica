export function calculateDisplacement(bore, stroke, cylinders) {
  // bore e stroke em mm -> converter para cm
  const boreCm = bore / 10;
  const strokeCm = stroke / 10;

  // cilindrada unitária (cm³)
  const unitDisplacement = (Math.PI / 4) * Math.pow(boreCm, 2) * strokeCm;

  // cilindrada total
  return unitDisplacement * cylinders;
}

export function calculateRL(rodLength, stroke) {
  return rodLength / stroke;
}
