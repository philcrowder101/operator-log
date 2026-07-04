/** Round to nearest 5 lbs, plate-friendly */
export function calcWeight(trainingMax, loadPercent) {
  const raw = trainingMax * (loadPercent / 100)
  return Math.round(raw / 5) * 5
}

/** TM = 90% of 1RM, rounded to nearest 5 */
export function calcTrainingMax(oneRepMax) {
  return Math.round((oneRepMax * 0.9) / 5) * 5
}

/** Bodyweight fallback reps: loadPercent of 90% of max unweighted reps, min 1 */
export function calcBodyweightReps(maxReps, loadPercent) {
  return Math.max(1, Math.round(maxReps * 0.9 * (loadPercent / 100)))
}

/** Plate-friendly weight to add over bodyweight; <= 0 means target is at/below bodyweight */
export function calcAddedWeight(trainingMax, loadPercent, bodyWeight) {
  const raw = trainingMax * (loadPercent / 100) - bodyWeight
  return Math.round(raw / 5) * 5
}
