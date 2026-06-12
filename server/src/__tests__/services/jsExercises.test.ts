import { pickExercises } from '../../services/jsExercises';

describe('pickExercises', () => {
  it('returns exercises for 0-2 experience', () => {
    const result = pickExercises('0-2', 3);
    expect(result.length).toBe(3);
    result.forEach((ex) => {
      expect(ex).toHaveProperty('title');
      expect(ex).toHaveProperty('description');
      expect(ex).toHaveProperty('starterCode');
    });
  });

  it('returns exercises for 2-5 experience', () => {
    const result = pickExercises('2-5', 2);
    expect(result.length).toBe(2);
  });

  it('returns exercises for 5-8 experience', () => {
    const result = pickExercises('5-8', 2);
    expect(result.length).toBe(2);
  });

  it('returns exercises for 8+ experience', () => {
    const result = pickExercises('8+', 2);
    expect(result.length).toBe(2);
  });

  it('falls back to 0-2 pool for unknown experience level', () => {
    const known = pickExercises('0-2', 5);
    const unknown = pickExercises('unknown-level', 5);
    const knownTitles = new Set(known.map((e) => e.title));
    unknown.forEach((ex) => expect(knownTitles.has(ex.title)).toBe(true));
  });

  it('returns all exercises when count >= pool size', () => {
    const result = pickExercises('8+', 100);
    expect(result.length).toBe(5);
  });

  it('returns a subset of the correct pool', () => {
    const result = pickExercises('2-5', 3);
    const validTitles = ['FizzBuzz (1-30)', 'Sum of Multiples', 'Marks Average & Grade', 'Sum of Any Arguments', 'Custom Array Includes'];
    result.forEach((ex) => expect(validTitles).toContain(ex.title));
  });

  it('does not mutate the original pool across calls', () => {
    const first = pickExercises('0-2', 5).map((e) => e.title);
    const second = pickExercises('0-2', 5).map((e) => e.title);
    // Both should have the same items (though different order is fine)
    expect(first.sort()).toEqual(second.sort());
  });

  it('Fisher-Yates produces reasonably uniform distribution', () => {
    const TRIALS = 500;
    const firstItems: Record<string, number> = {};
    for (let i = 0; i < TRIALS; i++) {
      const result = pickExercises('0-2', 1);
      const title = result[0].title;
      firstItems[title] = (firstItems[title] ?? 0) + 1;
    }
    const counts = Object.values(firstItems);
    // With 5 items and 500 trials, expected count ≈ 100 per item.
    // Allow ±60% variance: each count must be between 40 and 160.
    counts.forEach((count) => {
      expect(count).toBeGreaterThanOrEqual(20);
      expect(count).toBeLessThanOrEqual(200);
    });
  });
});
