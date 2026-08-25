/**
 * ADAPTER (outbound) — ClockPort memakai jam perangkat.
 * @returns {import('../../ports/ClockPort.js').ClockPort}
 */
export function createSystemClock() {
  return { now: () => Date.now() };
}

/**
 * Jam beku untuk keperluan test.
 * @param {number} startAt
 */
export function createFixedClock(startAt) {
  let current = startAt;
  return {
    now: () => current,
    advanceMs(milliseconds) { current += milliseconds; },
    advanceDays(days) { current += days * 86400000; },
  };
}
