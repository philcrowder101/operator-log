/** Round to nearest 5 lbs, plate-friendly */
export function calcWeight(trainingMax, loadPercent) {
  const raw = trainingMax * (loadPercent / 100)
  return Math.round(raw / 5) * 5
}

/** TM = 90% of 1RM, rounded to nearest 5 */
export function calcTrainingMax(oneRepMax) {
  return Math.round((oneRepMax * 0.9) / 5) * 5
}
