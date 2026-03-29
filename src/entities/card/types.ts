export type Side = "citizen" | "mafia";

export interface Card {
  id: number;
  role: string;
  isFlipped: boolean;
  isSeen: boolean;
  side: Side;
  playerName?: string;
  initialIndex: number;
}
