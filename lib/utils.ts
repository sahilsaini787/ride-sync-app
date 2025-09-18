/**
 * Utility functions for class name composition.
 *
 * This file provides helpers for merging and deduplicating CSS class names,
 * especially useful when working with Tailwind CSS and conditional styling in React components.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single string, deduplicating Tailwind CSS classes.
 *
 * Usage:
 *   cn('p-4', condition && 'bg-primary', 'text-center')
 *
 * - Accepts any number of class values (strings, arrays, objects).
 * - Uses clsx for conditional logic and tailwind-merge for deduplication.
 * - Ensures that conflicting Tailwind classes are resolved correctly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
