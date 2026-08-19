export const scoreTone = (score) => score >= 80 ? 'good' : score >= 60 ? 'medium' : 'low'

export const departmentFit = (person) => {
  const adjustment = { ai: 2, sales: -3, cs: 1 }[person.dept] || 0
  return Math.max(40, Math.min(98, person.jobFit + adjustment))
}
