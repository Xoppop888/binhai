import { describe, expect, it } from 'vitest';
import { calculateTurnkeyPrice, type CarForCalculation } from './customsCalculator';

const RATES = { cnyToRub: 1, eurToRub: 1 };
const NOW = new Date(2026, 8, 30);

function car(overrides: Partial<CarForCalculation> = {}): CarForCalculation {
  return {
    priceCny: 100_000,
    modelYear: 2021,
    fuelType: 'ice',
    engineVolumeCm3: 1500,
    powerHp: 160,
    batteryKwh: null,
    ageYears: 4,
    ...overrides,
  };
}

function expectSuccess(value: ReturnType<typeof calculateTurnkeyPrice>) {
  expect(value.ok).toBe(true);
  if (!value.ok) throw new Error(value.reason);
  return value;
}

describe('utilization fee', () => {
  it('uses the <=160 hp bracket for a 1500 cm³ vehicle over 3 years', () => {
    const result = expectSuccess(calculateTurnkeyPrice(car(), RATES, NOW));
    expect(result.breakdown.utilizationFeeRub).toBe(5_200);
  });

  it('moves 161 hp into the next power bracket', () => {
    const result = expectSuccess(calculateTurnkeyPrice(car({ powerHp: 161 }), RATES, NOW));
    expect(result.breakdown.utilizationFeeRub).toBe(1_492_800);
  });

  it('uses the over-5-year rate for the same 161 hp / 1500 cm³ vehicle', () => {
    const result = expectSuccess(calculateTurnkeyPrice(car({ ageYears: 6, powerHp: 161 }), RATES, NOW));
    expect(result.breakdown.utilizationFeeRub).toBe(1_492_800);
  });

  it('calculates a series hybrid through the ICE/hybrid branch', () => {
    const result = expectSuccess(calculateTurnkeyPrice(car({ fuelType: 'series_hybrid' }), RATES, NOW));
    expect(result.breakdown.utilizationFeeRub).toBe(5_200);
    expect(result.breakdown.customsDutyRub).toBe(2_550);
  });
});

describe('inclusive age boundaries', () => {
  it('treats the exact 3-year anniversary as the <=3-year category', () => {
    const result = calculateTurnkeyPrice(
      car({ ageYears: undefined, releaseDate: '2023-09-30' }),
      RATES,
      NOW,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain('не старше 3 лет');
  });

  it('keeps the exact 5-year anniversary in the 3-5-year duty bracket', () => {
    const result = expectSuccess(calculateTurnkeyPrice(
      car({ ageYears: undefined, releaseDate: '2021-09-30' }),
      RATES,
      NOW,
    ));
    expect(result.breakdown.customsDutyRub).toBe(2_550);
  });

  it('moves to the older duty bracket one day after the 5-year anniversary', () => {
    const result = expectSuccess(calculateTurnkeyPrice(
      car({ ageYears: undefined, releaseDate: '2021-09-29' }),
      RATES,
      NOW,
    ));
    expect(result.breakdown.customsDutyRub).toBe(4_800);
  });
});
