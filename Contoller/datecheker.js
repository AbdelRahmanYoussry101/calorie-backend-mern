
export function isNewWeek(weekStart) {
  const now = new Date();
  const diffInDays = (now - new Date(weekStart)) / (1000 * 60 * 60 * 24);
  return diffInDays >= 7; // true if 7 or more days have passed
}

// Check if the last entry date is not today (new day)
export function isNewDay(lastDate) {
  const todayString = new Date().toDateString();  // e.g. "Sun Oct 26 2025"
  const lastString = new Date(lastDate).toDateString();

  return todayString !== lastString;  // returns true if different day
}
