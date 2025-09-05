import { FirestoreTimestamp } from "../types/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to convert Firestore Timestamp to a "HH:mm" string for time inputs
export const timestampToTimeString = (timestamp: FirestoreTimestamp | null | undefined): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp.seconds * 1000);
  // Adjust for timezone offset to get correct local time
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - userTimezoneOffset);
  return localDate.toTimeString().slice(0, 5); // "HH:mm"
};

// Helper to convert a "HH:mm" string from a local time input to a Firestore Timestamp
export const timeStringToTimestamp = (timeString: string): FirestoreTimestamp | null => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date(); 
  // Sets the time in the user's current timezone
  date.setHours(hours, minutes, 0, 0);
  return {
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
  };
};