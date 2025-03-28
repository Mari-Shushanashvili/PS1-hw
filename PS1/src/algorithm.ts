/**
 * Problem Set 1: Flashcards - Algorithm Functions
 *
 * This file contains the implementations for the flashcard algorithm functions
 * as described in the problem set handout.
 *
 * Please DO NOT modify the signatures of the exported functions in this file,
 * or you risk failing the Didit autograder.
 */

import { Flashcard, AnswerDifficulty, BucketMap } from "./flashcards";

/**
 * Converts a Map representation of learning buckets into an Array-of-Set representation.
 *
 * @param buckets Map where keys are bucket numbers and values are sets of Flashcards.
 * @returns Array of Sets, where element at index i is the set of flashcards in bucket i.
 *          Buckets with no cards will have empty sets in the array.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function toBucketSets(buckets: BucketMap): Array<Set<Flashcard>> {
  const bucketArray: Array<Set<Flashcard>> = [];
  const maxBucket = buckets.size > 0 ? Math.max(...buckets.keys()) : -1;
  
  for (let i = 0; i <= maxBucket; i++) {
    bucketArray.push(buckets.get(i) || new Set());
  }
  
  return bucketArray;
}

/**
 * Finds the range of buckets that contain flashcards, as a rough measure of progress.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @returns object with minBucket and maxBucket properties representing the range,
 *          or undefined if no buckets contain cards.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function getBucketRange(
  buckets: Array<Set<Flashcard>>
): { minBucket: number; maxBucket: number } | undefined {
  const nonEmptyBuckets = buckets
    .map((set, index) => set.size > 0 ? index : -1)
    .filter(index => index !== -1);
  
  if (nonEmptyBuckets.length === 0) return undefined;
  
  return {
    minBucket: Math.min(...nonEmptyBuckets),
    maxBucket: Math.max(...nonEmptyBuckets)
  };
}

/**
 * Selects cards to practice on a particular day.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @param day current day number (starting from 0).
 * @returns a Set of Flashcards that should be practiced on day `day`,
 *          according to the Modified-Leitner algorithm.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function practice(
  buckets: Array<Set<Flashcard>>,
  day: number
): Set<Flashcard> {
  if (day < 0) throw new Error("Day number must be non-negative");
  
  return new Set(
    buckets.flatMap((set, bucketIndex) => 
      day % (2 ** bucketIndex) === 0 ? Array.from(set) : []
    )
  );
}

/**
 * Updates a card's bucket number after a practice trial.
 *
 * @param buckets Map representation of learning buckets.
 * @param card flashcard that was practiced.
 * @param difficulty how well the user did on the card in this practice trial.
 * @returns updated Map of learning buckets.
 * @spec requires buckets is a valid representation of flashcard buckets.
 */
export function update(
  buckets: BucketMap,
  card: Flashcard,
  difficulty: AnswerDifficulty
): BucketMap {
  const currentBucket = Array.from(buckets.entries())
    .find(([_, cards]) => cards.has(card))?.[0];
  
  if (currentBucket === undefined) throw new Error("Card not found");

  const bucketAdjustment = 
    difficulty === AnswerDifficulty.Easy ? 1 : 
    difficulty === AnswerDifficulty.Hard ? -1 : 0;
  
  const newBucket = Math.max(0, 
    Math.min(currentBucket + bucketAdjustment, buckets.size - 1));
  
  // Create new Map to avoid mutating the original
  const newBuckets = new Map(buckets);
  newBuckets.get(currentBucket)?.delete(card);
  
  if (!newBuckets.has(newBucket)) {
    newBuckets.set(newBucket, new Set());
  }
  newBuckets.get(newBucket)?.add(card);
  
  return newBuckets;
}

/**
 * Generates a contextual hint for a flashcard.
 *
 * @param card The flashcard for which a hint is needed.
 * @returns A string providing a hint for the front of the flashcard.
 * 
 * @spec requires `card` is a valid instance of `Flashcard`.
 * @spec ensures If `card.hint` is a non-empty string (ignoring whitespace), it is returned as the hint.
 * @spec ensures If `card.hint` is empty or contains only whitespace, a generated hint is returned in the format:
 *               `"Think about the key concepts related to [front]"`
 * @spec ensures The output is **deterministic**—same input always yields the same output.
 * @spec ensures The hint remains useful across various learning domains (e.g., language, science, history).
 */
export function getHint(card: Flashcard): string {
  return card.hint.trim() || `Think about the key concepts related to ${card.front}`;
}

/**
 * Computes statistics about the user's learning progress.
 *
 * @param buckets A `BucketMap` representing the current flashcard distribution.
 * @param history An array of past answer records, where each record contains:
 *        - `card`: the `Flashcard` that was practiced.
 *        - `difficulty`: an `AnswerDifficulty` representing the user's response.
 *        - `timestamp`: a number representing the time of practice.
 * @returns An object containing:
 *        - `accuracyRate`: percentage of correct answers (Easy vs. total attempts).
 *        - `bucketDistribution`: an object mapping bucket numbers to counts of flashcards.
 *        - `averageDifficulty`: the mean difficulty of all past answers.
 *
 * @spec.requires `buckets` must be a valid `BucketMap`, with only non-negative integer keys.
 * @spec.requires `history` must be an array where each entry has valid `card`, `difficulty`, and `timestamp` fields.
 * @spec.ensures The returned object is never `null` or `undefined`.
 * @spec.ensures If no history exists, `accuracyRate` is 0 and `averageDifficulty` is `undefined`.
 */
export function computeProgress(
  buckets: BucketMap, 
  history: Array<{ card: Flashcard; difficulty: AnswerDifficulty; timestamp: number }>
) {
  // Validate inputs
  if (!Array.from(buckets.keys()).every(Number.isInteger)) {
    throw new Error("All bucket keys must be integers");
  }

  const bucketDistribution = Object.fromEntries(
    Array.from(buckets.entries()).map(([k, v]) => [k, v.size])
  );

  const difficulties = history.map(h => h.difficulty);
  const correctCount = difficulties.filter(d => d === AnswerDifficulty.Easy).length;
  
  return {
    accuracyRate: history.length ? correctCount / history.length : 0,
    bucketDistribution,
    averageDifficulty: difficulties.length ? 
      difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length : 
      undefined
  };
}