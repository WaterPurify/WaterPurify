export type RoastLevel = '라이트' | '미디엄' | '다크' | '모름';
export type BrewTemperature = '따뜻하게' | '아이스';
export type Score = 1 | 2 | 3 | 4 | 5 | null;

export interface Bean {
  id: number;
  name: string;
  roastery: string | null;
  roastedAt: string | null;
  roastLevel: RoastLevel | null;
  photoUri: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  temperature: BrewTemperature;
  brewer: string;
  grinder: string;
  coffeeGrams: number;
  waterGrams: number;
  waterTemperature: number | null;
  grindSize: string;
  brewMinutes: number | null;
  brewSeconds: number | null;
  iceGrams: number | null;
  pouringNotes: string;
}

export interface Tasting {
  acidity: Score;
  bitterness: Score;
  sweetness: Score;
  body: Score;
  satisfaction: Score;
  notes: string;
  nextTaste: string;
}

export interface BeanSnapshot {
  id: number;
  name: string;
  roastery: string | null;
  roastedAt: string | null;
  roastLevel: RoastLevel | null;
  photoUri: string | null;
}

export interface Brew {
  id: number;
  beanId: number | null;
  bean: BeanSnapshot;
  brewedAt: string;
  desiredTaste: string;
  recipe: Recipe;
  tasting: Tasting;
  sourceBrewId: number | null;
  sourceRecommendationId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: number;
  baseBrewId: number;
  conditionName: string;
  beforeValue: string;
  suggestedValue: string;
  reason: string;
  method: '규칙 기반';
  createdAt: string;
}

