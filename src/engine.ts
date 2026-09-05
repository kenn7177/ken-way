export type Rarity = 3 | 4 | 5;

export type PityState = {
  pullsSinceFourPlus: number;
  pullsSinceFive: number;
};

export type DrawCause =
  | 'three'
  | 'four_base'
  | 'four_hard'
  | 'five_base'
  | 'five_soft'
  | 'five_hard';

export type RarityResolution = {
  rarity: Rarity;
  cause: DrawCause;
  fiveStarRateBp: number;
  rollBp: number;
  nextFourPlusPull: number;
  nextFivePull: number;
  softPityActive: boolean;
  pityBefore: PityState;
  pityAfter: PityState;
  microGlowDelta: 0 | 20;
};

export const PROBABILITY_SCALE = 10_000;
export const FIVE_STAR_BASE_BP = 100;
export const FOUR_STAR_BASE_BP = 510;
export const FOUR_PLUS_HARD_PULL = 10;
export const FIVE_STAR_SOFT_START_PULL = 36;
export const FIVE_STAR_HARD_PULL = 45;
export const MICRO_GLOW_PER_THREE_STAR = 20;

export function getFiveStarRateBp(pullsSinceFive: number): number {
  assertNonNegativeSafeInteger(pullsSinceFive, 'pullsSinceFive');
  const nextPull = pullsSinceFive + 1;

  if (nextPull <= 35) return FIVE_STAR_BASE_BP;
  if (nextPull >= FIVE_STAR_HARD_PULL) return PROBABILITY_SCALE;
  return FIVE_STAR_BASE_BP + (nextPull - 35) * 1_000;
}

export function resolveRarity(
  pityBefore: Readonly<PityState>,
  rollBp: number,
): RarityResolution {
  assertNonNegativeSafeInteger(
    pityBefore.pullsSinceFourPlus,
    'pullsSinceFourPlus',
  );
  assertNonNegativeSafeInteger(pityBefore.pullsSinceFive, 'pullsSinceFive');
  if (
    !Number.isSafeInteger(rollBp) ||
    rollBp < 0 ||
    rollBp >= PROBABILITY_SCALE
  ) {
    throw new RangeError('rollBp must be an integer from 0 through 9999');
  }

  const nextFourPlusPull = pityBefore.pullsSinceFourPlus + 1;
  const nextFivePull = pityBefore.pullsSinceFive + 1;
  const fiveStarRateBp = getFiveStarRateBp(pityBefore.pullsSinceFive);

  let rarity: Rarity;
  let cause: DrawCause;

  if (nextFivePull >= FIVE_STAR_HARD_PULL) {
    rarity = 5;
    cause = 'five_hard';
  } else if (rollBp < fiveStarRateBp) {
    rarity = 5;
    cause =
      nextFivePull >= FIVE_STAR_SOFT_START_PULL ? 'five_soft' : 'five_base';
  } else if (nextFourPlusPull >= FOUR_PLUS_HARD_PULL) {
    rarity = 4;
    cause = 'four_hard';
  } else if (rollBp < fiveStarRateBp + FOUR_STAR_BASE_BP) {
    rarity = 4;
    cause = 'four_base';
  } else {
    rarity = 3;
    cause = 'three';
  }

  const pityAfter: PityState =
    rarity === 5
      ? { pullsSinceFourPlus: 0, pullsSinceFive: 0 }
      : rarity === 4
        ? {
            pullsSinceFourPlus: 0,
            pullsSinceFive: pityBefore.pullsSinceFive + 1,
          }
        : {
            pullsSinceFourPlus: pityBefore.pullsSinceFourPlus + 1,
            pullsSinceFive: pityBefore.pullsSinceFive + 1,
          };

  return {
    rarity,
    cause,
    fiveStarRateBp,
    rollBp,
    nextFourPlusPull,
    nextFivePull,
    softPityActive:
      nextFivePull >= FIVE_STAR_SOFT_START_PULL &&
      nextFivePull < FIVE_STAR_HARD_PULL,
    pityBefore: { ...pityBefore },
    pityAfter,
    microGlowDelta: rarity === 3 ? MICRO_GLOW_PER_THREE_STAR : 0,
  };
}

export function secureRandomInt(maxExclusive: number): number {
  if (
    !Number.isSafeInteger(maxExclusive) ||
    maxExclusive <= 0 ||
    maxExclusive > 0x1_0000_0000
  ) {
    throw new RangeError(
      'maxExclusive must be a positive integer no larger than 2^32',
    );
  }

  const range = 0x1_0000_0000;
  const acceptLimit = Math.floor(range / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= acceptLimit);

  return buffer[0] % maxExclusive;
}

function assertNonNegativeSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
}
