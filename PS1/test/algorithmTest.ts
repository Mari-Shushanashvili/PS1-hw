import assert from "assert";
import { AnswerDifficulty, Flashcard, BucketMap } from "../src/flashcards";
import {
  toBucketSets,
  getBucketRange,
  practice,
  update,
  getHint,
  //computeProgress,
} from "../src/algorithm";

/*
 * What we're checking for toBucketSets():
 * - What happens with an empty input
 * - How it handles buckets that aren't in order
 * - If it works with different numbers of cards per bucket
 */
describe("Converting bucket maps to arrays", () => {
  it("gives back an empty array when there's no buckets", () => {
    const buckets: BucketMap = new Map();
    assert.deepStrictEqual(toBucketSets(buckets), []);
  });

  it("handles buckets that aren't numbered sequentially", () => {
    const card = new Flashcard("Q1", "A1", "Hint1", []);
    const buckets: BucketMap = new Map([
      [2, new Set([card])], 
    ]);
    
    const result = toBucketSets(buckets);
    assert.deepStrictEqual(result, [
      new Set(), 
      new Set(), 
      new Set([card]) 
    ]);
  });
});

/*
 * What we're checking for getBucketRange():
 * - How it handles no buckets
 * - What it does with just one bucket
 * - If it gets the range right with multiple buckets
 */
describe("Finding the range of used buckets", () => {
  it("returns undefined when there's no buckets", () => {
    const buckets: Array<Set<Flashcard>> = []; 
    assert.strictEqual(getBucketRange(buckets), undefined);
  });

  it("works right with just one bucket", () => {
    const card = new Flashcard("Q1", "A1", "Hint1", []);
    const buckets: Array<Set<Flashcard>> = [
      new Set<Flashcard>([card])
    ];
    assert.deepStrictEqual(getBucketRange(buckets), { 
      minBucket: 0, 
      maxBucket: 0 
    });
  });

  it("finds the correct range when buckets have gaps", () => {
    const card1 = new Flashcard("Q1", "A1", "Hint1", []);
    const card2 = new Flashcard("Q2", "A2", "Hint2", []);
    const buckets: Array<Set<Flashcard>> = [
      new Set<Flashcard>(), 
      new Set<Flashcard>([card1]), 
      new Set<Flashcard>(), 
      new Set<Flashcard>([card2]) 
    ];
    
    assert.deepStrictEqual(getBucketRange(buckets), { 
      minBucket: 1, 
      maxBucket: 3 
    });
  });
});


/*
 * What we're checking for practice():
 * - What happens with no buckets
 * - If it picks the right cards each day
 * - The every-X-days selection works right
 */
describe("Picking cards to practice each day", () => {
  it("gives nothing when there's no buckets", () => {
    assert.deepStrictEqual(practice([], 0), new Set());
  });

  it("picks the correct cards based on the day number", () => {
    const card1 = new Flashcard("Q1", "A1", "Hint1", []);
    const card2 = new Flashcard("Q2", "A2", "Hint2", []);
    const card3 = new Flashcard("Q3", "A3", "Hint3", []);
    const buckets = [
      new Set([card1]), 
      new Set([card2]), 
      new Set([card3])  
    ];
    
    assert.deepStrictEqual(practice(buckets, 0), new Set([card1, card2, card3]));
    assert.deepStrictEqual(practice(buckets, 1), new Set([card1, card2]));
    assert.deepStrictEqual(practice(buckets, 2), new Set([card1, card3]));
  });
});

/*
 * What we're checking for update():
 * - Error when card doesn't exist
 * - Moving cards up on Easy
 * - Moving cards down on Hard
 */
describe("Updating card buckets after practice", () => {
  it("complains if the card isn't in any bucket", () => {
    const buckets: BucketMap = new Map();
    const card = new Flashcard("Q1", "A1", "Hint1", []);
    assert.throws(() => update(buckets, card, AnswerDifficulty.Easy), /Card not found/);
  });

  it("moves card up when answered Easy", () => {
    const card = new Flashcard("Q1", "A1", "Hint1", []);
    const buckets: BucketMap = new Map([
      [0, new Set([card])], 
      [1, new Set()]        
    ]);
    
    const updatedBuckets = update(buckets, card, AnswerDifficulty.Easy);
    assert.strictEqual(updatedBuckets.get(0)?.has(card), false); 
    assert.strictEqual(updatedBuckets.get(1)?.has(card), true);  
  });

  it("moves card down when answered Hard", () => {
    const card = new Flashcard("Q1", "A1", "Hint1", []);
    const buckets: BucketMap = new Map([
      [1, new Set([card])], 
      [0, new Set()]        
    ]);
    
    const updatedBuckets = update(buckets, card, AnswerDifficulty.Hard);
    assert.strictEqual(updatedBuckets.get(1)?.has(card), false); 
    assert.strictEqual(updatedBuckets.get(0)?.has(card), true);  
  });
});

/*
 * What we're checking for getHint():
 * - Using custom hints when available
 * - Making hints when none provided
 * - Handling weird whitespace-only hints
 */
describe("Getting hints for flashcards", () => {
  it("uses the custom hint if there is one", () => {
    const card = new Flashcard(
      "What is annihilation?", 
      "the conversion of matter into energy.", 
      "It's the complete opposite of creation", 
      []
    );
    assert.strictEqual(getHint(card), "It's the complete opposite of creation");
  });

  it("makes up a hint if there isn't one", () => {
    const card = new Flashcard(
      "state Pythagoras theorem.", 
      "In a right-angled triangle...", 
      "", 
      []
    );
    assert.strictEqual(
      getHint(card), 
      "Think about the key concepts related to state Pythagoras theorem."
    );
  });

  it("ignores hints that are just spaces", () => {
    const card = new Flashcard(
      "which animal is phascolarctos cinereus?", 
      "Koala", 
      "    ", 
      []
    );
    assert.strictEqual(
      getHint(card), 
      "Think about the key concepts related to which animal is phascolarctos cinereus?"
    );
  });
});

/*
 * What we're checking for computeProgress():
 * - Handling empty history
 * - Calculating stats correctly
 * - Error cases
 */
// describe("Calculating learning progress", () => {
//   it("gives zeros and undefined when there's no history", () => {
//     const buckets: BucketMap = new Map();
//     const history: Array<{ card: Flashcard; difficulty: AnswerDifficulty; timestamp: number }> = [];
    
//     const result = computeProgress(buckets, history);
//     assert.strictEqual(result.accuracyRate, 0);
//     assert.strictEqual(result.averageDifficulty, undefined);
//     assert.deepStrictEqual(result.bucketDistribution, {});
//   });

//   it("calculates all the stats right", () => {
//     const card1 = new Flashcard("Q1", "A1", "Hint1", []);
//     const card2 = new Flashcard("Q2", "A2", "Hint2", []);
//     const buckets: BucketMap = new Map([
//       [0, new Set<Flashcard>([card1])],
//       [1, new Set<Flashcard>([card2])],
//     ]);
//     const history = [
//       { card: card1, difficulty: AnswerDifficulty.Easy, timestamp: 1 },
//       { card: card2, difficulty: AnswerDifficulty.Hard, timestamp: 2 },
//     ];
    
//     const result = computeProgress(buckets, history);
//     assert.strictEqual(result.accuracyRate, 0.5); // 1 easy out of 2
//     assert.strictEqual(result.averageDifficulty, 0.5); // (1 + 0) / 2
//     assert.deepStrictEqual(result.bucketDistribution, { 0: 1, 1: 1 });
//   });

//   it("gets mad about negative bucket numbers", () => {
//     const buckets: BucketMap = new Map([[-1, new Set<Flashcard>()]]);
//     const history: Array<{ card: Flashcard; difficulty: AnswerDifficulty; timestamp: number }> = [];
    
//     assert.throws(() => computeProgress(buckets, history), /Invalid bucket keys/);
//   });
// });