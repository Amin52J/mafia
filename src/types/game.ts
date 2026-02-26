export interface Scenario {
  id: string;
  name: string;
  mafiasCount: number;
  citizensCount: number;
  mafiaRoles: string[];
  citizenRoles: string[];
  notes?: string;
}

export interface Card {
  id: number;
  role: string;
  isFlipped: boolean;
  isSeen: boolean;
  side: "citizen" | "mafia";
  playerName?: string;
  initialIndex: number;
}
