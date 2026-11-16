/** Public player model. Ratings are recomputed by refreshPlayer; costs use unweighted cores. */
export interface BasketballPlayer {
  id: string;
  name: string;
  short: string;
  number: number;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  height: number;
  weight: number;
  age: number;
  shooting: number;
  finishing: number;
  playmaking: number;
  defense: number;
  athleticism: number;
  readonly overall: number;
  readonly attributeCost: number;
  primaryStyle: string;
  secondaryStyle?: string;
  salary: number;
  familiarity: number;
  condition: number;
  potential: number;
  stamina: number;
  points: number;
  rebounds: number;
  assists: number;
  fouls: number;
  onCourt: boolean;
  hidden: {
    speed: number;
    passing: number;
    ballHandling: number;
    awareness: number;
    endurance: number;
    rebounding: number;
    catchAndShoot: number;
    contactFinishing: number;
  };
}
