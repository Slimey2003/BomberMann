/**
 * Generates a random integer between min and max (inclusive).
 */
export function getRandomInt(min: number, max: number) {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new RangeError('Both min and max must be integers.');
    }
    if (min > max) {
        throw new RangeError('min must be less than or equal to max.');
    }

    // Generate random integer
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
