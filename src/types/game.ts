export interface Scenario {
  id: string;
  name: string;
  mafiasCount: number;
  citizensCount: number;
  mafiaRoles: string[];
  citizenRoles: string[];
}

export interface Card {
  id: number;
  role: string;
  isFlipped: boolean;
  isSeen: boolean;
}
