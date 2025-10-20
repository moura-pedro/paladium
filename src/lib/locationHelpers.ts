import { ILocation } from './models/Property';

/**
 * Formats a location object into a human-readable string
 */
export function formatLocation(location: ILocation | string): string {
  if (typeof location === 'string') {
    return location; // Legacy format
  }
  
  return `${location.city}, ${location.state}, ${location.country}`;
}

/**
 * Formats a location object into a shorter string (city and state)
 */
export function formatLocationShort(location: ILocation | string): string {
  if (typeof location === 'string') {
    return location; // Legacy format
  }
  
  return `${location.city}, ${location.state}`;
}

/**
 * Gets the city from a location (structured or string)
 */
export function getLocationCity(location: ILocation | string): string {
  if (typeof location === 'string') {
    // Try to parse city from string format (e.g., "Lake Tahoe, CA")
    return location.split(',')[0]?.trim() || location;
  }
  
  return location.city;
}

/**
 * Checks if a location is in structured format
 */
export function isStructuredLocation(location: ILocation | string): location is ILocation {
  return typeof location === 'object' && 'city' in location && 'state' in location && 'country' in location;
}

