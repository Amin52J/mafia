export interface Scenario {
  id: string;
  name: string;
  mafiasCount: number;
  citizensCount: number;
  mafiaRoles: string[];
  citizenRoles: string[];
  notes?: string;
}
