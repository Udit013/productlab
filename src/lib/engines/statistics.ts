// Deterministic statistical engine — no LLM required

export function zScore(p: number): number {
  // Approximation of inverse normal CDF
  if (p <= 0) return -10
  if (p >= 1) return 10
  const a = [2.515517, 0.802853, 0.010328]
  const b = [1.432788, 0.189269, 0.001308]
  const t = Math.sqrt(-2 * Math.log(Math.min(p, 1 - p)))
  const num = a[0] + t * (a[1] + t * a[2])
  const den = 1 + t * (b[0] + t * (b[1] + t * b[2]))
  return (p < 0.5 ? -1 : 1) * (t - num / den)
}

export function normalCDF(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z))
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const result = 1 - poly * Math.exp(-z * z / 2)
  return z >= 0 ? result : 1 - result
}

export function twoTailedPValue(zStat: number): number {
  return 2 * (1 - normalCDF(Math.abs(zStat)))
}

export interface ABTestResult {
  controlRate: number
  treatmentRate: number
  lift: number
  liftPercent: number
  zStat: number
  pValue: number
  significant: boolean
  confidenceLevel: number
  confidenceInterval: [number, number]
  verdict: 'winner' | 'loser' | 'inconclusive'
  powerAnalysis: string
}

export function calculateABTest(
  controlConversions: number,
  controlSamples: number,
  treatmentConversions: number,
  treatmentSamples: number,
  alpha = 0.05
): ABTestResult {
  const controlRate = controlSamples > 0 ? controlConversions / controlSamples : 0
  const treatmentRate = treatmentSamples > 0 ? treatmentConversions / treatmentSamples : 0

  const pooledRate = (controlConversions + treatmentConversions) / (controlSamples + treatmentSamples)
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlSamples + 1 / treatmentSamples))

  const zStat = se > 0 ? (treatmentRate - controlRate) / se : 0
  const pValue = twoTailedPValue(zStat)
  const significant = pValue < alpha

  const lift = treatmentRate - controlRate
  const liftPercent = controlRate > 0 ? (lift / controlRate) * 100 : 0

  const margin = 1.96 * Math.sqrt((treatmentRate * (1 - treatmentRate)) / treatmentSamples)
  const confidenceInterval: [number, number] = [lift - margin, lift + margin]

  let verdict: 'winner' | 'loser' | 'inconclusive' = 'inconclusive'
  if (significant) {
    verdict = liftPercent > 0 ? 'winner' : 'loser'
  }

  const minDetectableEffect = 0.05
  const requiredSampleSize = Math.ceil(
    2 * pooledRate * (1 - pooledRate) * Math.pow(zScore(1 - alpha / 2) + zScore(0.8), 2) /
    Math.pow(minDetectableEffect, 2)
  )

  return {
    controlRate,
    treatmentRate,
    lift,
    liftPercent,
    zStat,
    pValue,
    significant,
    confidenceLevel: (1 - alpha) * 100,
    confidenceInterval,
    verdict,
    powerAnalysis: `Required: ${requiredSampleSize.toLocaleString()} per arm. Current: ${Math.min(controlSamples, treatmentSamples).toLocaleString()} per arm.`,
  }
}

export function calculateRICE(
  reach: number,
  impact: number,
  confidence: number,
  effort: number
): number {
  return effort > 0 ? Math.round((reach * impact * confidence) / effort) : 0
}

export function calculateICE(
  impact: number,
  confidence: number,
  ease: number
): number {
  return Math.round((impact + confidence + ease) / 3 * 10) / 10
}

export function calculateWSJF(
  userValue: number,
  timeValue: number,
  riskReduction: number,
  effortCost: number
): number {
  return effortCost > 0 ? Math.round(((userValue + timeValue + riskReduction) / effortCost) * 10) / 10 : 0
}

export function calculateOpportunityScore(
  demand: number,
  satisfaction: number
): number {
  // Opportunity = Importance + max(0, Importance - Satisfaction)
  const importance = demand
  const gap = Math.max(0, importance - satisfaction)
  return Math.min(10, Math.round((importance + gap) * 10) / 10)
}

export function calculateROI(
  expectedRevenueLift: number,
  engineeringCostWeeks: number,
  engineerWeeklyCost = 4000
): number {
  const cost = engineeringCostWeeks * engineerWeeklyCost
  return cost > 0 ? Math.round(((expectedRevenueLift - cost) / cost) * 100) / 100 : 0
}

export interface StatsSummary {
  mean: number
  median: number
  stdDev: number
  p25: number
  p75: number
  p95: number
}

export function summarizeDistribution(values: number[]): StatsSummary {
  if (values.length === 0) return { mean: 0, median: 0, stdDev: 0, p25: 0, p75: 0, p95: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const mean = values.reduce((a, b) => a + b, 0) / n
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n
  return {
    mean: Math.round(mean * 100) / 100,
    median: sorted[Math.floor(n / 2)],
    stdDev: Math.round(Math.sqrt(variance) * 100) / 100,
    p25: sorted[Math.floor(n * 0.25)],
    p75: sorted[Math.floor(n * 0.75)],
    p95: sorted[Math.floor(n * 0.95)],
  }
}
