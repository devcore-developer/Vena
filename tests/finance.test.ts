import { describe, it, expect, beforeEach } from 'vitest';
import { calculateCommission } from '../src/lib/finance';
import { platformFeeConfig } from '../src/data/mock/database';

describe('Financial Commission Engine', () => {
  beforeEach(() => {
    // Reset to default fixed config before each test
    platformFeeConfig.type = "FIXED";
    platformFeeConfig.fixedAmount = 25;
    platformFeeConfig.percentage = 0;
  });

  it('should calculate fixed commission correctly', () => {
    const result = calculateCommission(225);
    expect(result.commission).toBe(25);
    expect(result.doctorNet).toBe(200);
  });

  it('should calculate percentage commission correctly', () => {
    platformFeeConfig.type = "PERCENTAGE";
    platformFeeConfig.percentage = 10;
    
    const result = calculateCommission(1000);
    expect(result.commission).toBe(100);
    expect(result.doctorNet).toBe(900);
  });

  it('should prevent negative doctor net earnings', () => {
    platformFeeConfig.type = "FIXED";
    platformFeeConfig.fixedAmount = 300; // Exceeds course price
    
    const result = calculateCommission(225);
    expect(result.commission).toBe(300);
    expect(result.doctorNet).toBe(0); // Must not be negative
  });
});