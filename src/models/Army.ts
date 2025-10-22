export interface ArmyUnit {
  id: string;
  name: string;
  type: string;
  experience: string;
  size: number;
  points: number;
  equipment: string[];
  specialRules: string[];
  // Add other unit properties as needed
}

type ExperienceLevel = keyof UnitCost;

export interface UnitCost {
  inexperienced?: number;
  regular?: number;
  veteran?: number;
}

export interface SelectedOptions {
  additionalMen: number;
  upgrades: { [key: string]: number }; // option index -> quantity
}

export interface ArmyUnitExtended extends ArmyUnit {
  experience: ExperienceLevel;
  uniqueId: string;
  selectedOptions: SelectedOptions;
}

export interface ArmyList {
  id: string;
  userId: string;
  name: string;
  nation: string;
  pointsLimit: number;
  units: ArmyUnitExtended[];
  totalPoints: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateArmyRequest {
  name: string;
  nation: string;
  pointsLimit: number;
  units: ArmyUnit[];
  totalPoints: number;
}

export interface UpdateArmyRequest {
  name?: string;
  nation?: string;
  pointsLimit?: number;
  units?: ArmyUnit[];
  totalPoints?: number;
}