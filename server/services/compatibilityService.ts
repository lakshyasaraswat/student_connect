import { RoommatePreferences } from '../models/types.ts';

export function calculateCompatibilityScore(
  userPref: RoommatePreferences,
  candidatePref: RoommatePreferences,
  userBudget: { min: number; max: number },
  candidateBudget: { min: number; max: number }
): { score: number; breakdown: { category: string; points: number; max: number; match: boolean }[] } {
  const breakdown: { category: string; points: number; max: number; match: boolean }[] = [];
  let totalScore = 0;

  // 1. Budget Overlap (25 points)
  const overlapMin = Math.max(userBudget.min, candidateBudget.min);
  const overlapMax = Math.min(userBudget.max, candidateBudget.max);
  const hasBudgetOverlap = overlapMin <= overlapMax;
  const budgetPts = hasBudgetOverlap ? 25 : Math.max(0, 25 - Math.round(Math.abs(overlapMin - overlapMax) / 50));
  breakdown.push({
    category: 'Budget Range Match',
    points: budgetPts,
    max: 25,
    match: hasBudgetOverlap
  });
  totalScore += budgetPts;

  // 2. Sleep Schedule (20 points)
  let sleepPts = 0;
  if (userPref.sleepSchedule === candidatePref.sleepSchedule) {
    sleepPts = 20;
  } else if (userPref.sleepSchedule === 'Flexible' || candidatePref.sleepSchedule === 'Flexible') {
    sleepPts = 15;
  } else {
    sleepPts = 5;
  }
  breakdown.push({
    category: 'Sleep Schedule Alignment',
    points: sleepPts,
    max: 20,
    match: sleepPts >= 15
  });
  totalScore += sleepPts;

  // 3. Cleanliness (20 points)
  let cleanPts = 0;
  if (userPref.cleanliness === candidatePref.cleanliness) {
    cleanPts = 20;
  } else if (
    (userPref.cleanliness === 'Moderate' && (candidatePref.cleanliness === 'Extremely Clean' || candidatePref.cleanliness === 'Relaxed')) ||
    (candidatePref.cleanliness === 'Moderate' && (userPref.cleanliness === 'Extremely Clean' || userPref.cleanliness === 'Relaxed'))
  ) {
    cleanPts = 14;
  } else {
    cleanPts = 4; // Extremes clash: Extremely Clean vs Relaxed
  }
  breakdown.push({
    category: 'Cleanliness Standards',
    points: cleanPts,
    max: 20,
    match: cleanPts >= 14
  });
  totalScore += cleanPts;

  // 4. Food Preferences (15 points)
  let foodPts = 0;
  if (userPref.food === 'Any' || candidatePref.food === 'Any' || userPref.food === candidatePref.food) {
    foodPts = 15;
  } else {
    foodPts = 8;
  }
  breakdown.push({
    category: 'Dietary Compatibility',
    points: foodPts,
    max: 15,
    match: foodPts >= 12
  });
  totalScore += foodPts;

  // 5. Smoking Habits (10 points)
  let smokePts = 0;
  if (userPref.smoking === candidatePref.smoking) {
    smokePts = 10;
  } else if (userPref.smoking === 'Flexible' || candidatePref.smoking === 'Flexible') {
    smokePts = 8;
  } else {
    smokePts = 0; // Clash: Smoker vs Non-Smoker
  }
  breakdown.push({
    category: 'Smoking Habits',
    points: smokePts,
    max: 10,
    match: smokePts >= 8
  });
  totalScore += smokePts;

  // 6. Study Habits (10 points)
  let studyPts = 0;
  if (userPref.studyHabit === candidatePref.studyHabit) {
    studyPts = 10;
  } else {
    studyPts = 6;
  }
  breakdown.push({
    category: 'Study Environment',
    points: studyPts,
    max: 10,
    match: studyPts >= 8
  });
  totalScore += studyPts;

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown
  };
}
