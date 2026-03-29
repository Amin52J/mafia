export const NIGHT_SONGS = Array.from(
  { length: 12 },
  (_, i) => `/night-${String(i + 1).padStart(2, "0")}.mp3`
);
