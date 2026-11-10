import { Brew } from './types';

export interface RecommendationDraft {
  conditionName: string;
  beforeValue: string;
  suggestedValue: string;
  reason: string;
}

const includesAny = (value: string, words: string[]) =>
  words.some((word) => value.toLowerCase().includes(word));

export function createRecommendation(brew: Brew): RecommendationDraft | null {
  const target = brew.tasting.nextTaste.trim() || brew.desiredTaste.trim();
  const { recipe, tasting } = brew;

  if (!recipe.coffeeGrams || !recipe.waterGrams) return null;
  if (tasting.acidity !== null && tasting.bitterness !== null && tasting.acidity >= 4 && tasting.bitterness >= 4 && !target) {
    return null;
  }

  if (includesAny(target, ['진하게', '묵직', '바디', '초콜릿', '견과'])) {
    const next = Math.max(1, Math.round(recipe.waterGrams * 0.95));
    return {
      conditionName: '물양',
      beforeValue: `${recipe.waterGrams}g`,
      suggestedValue: `${next}g`,
      reason: `“${target}”에 가까워지는지 비교하기 위해 물양만 약 5% 줄여 보세요.`,
    };
  }

  if (includesAny(target, ['산뜻', '깔끔', '가볍', '과일', '산미'])) {
    return {
      conditionName: '분쇄도',
      beforeValue: recipe.grindSize || '기록 없음',
      suggestedValue: '조금 더 굵게',
      reason: `“${target}”에 가까워지는지 비교하기 위해 분쇄도만 조금 굵게 조정해 보세요.`,
    };
  }

  if (tasting.bitterness !== null && tasting.bitterness >= 4) {
    return {
      conditionName: '분쇄도',
      beforeValue: recipe.grindSize || '기록 없음',
      suggestedValue: '조금 더 굵게',
      reason: '쓴맛 점수가 높았습니다. 과다 추출 가능성을 비교하기 위해 분쇄도만 조정해 보세요.',
    };
  }

  if (tasting.acidity !== null && tasting.acidity >= 4 && tasting.sweetness !== null && tasting.sweetness <= 2) {
    return {
      conditionName: '분쇄도',
      beforeValue: recipe.grindSize || '기록 없음',
      suggestedValue: '조금 더 곱게',
      reason: '산미가 강하고 단맛이 약했습니다. 추출을 조금 늘렸을 때 균형이 달라지는지 비교해 보세요.',
    };
  }

  if (tasting.satisfaction !== null && tasting.satisfaction <= 2 && recipe.waterTemperature) {
    return {
      conditionName: '수온',
      beforeValue: `${recipe.waterTemperature}°C`,
      suggestedValue: `${Math.max(80, recipe.waterTemperature - 2)}°C`,
      reason: '만족도가 낮았습니다. 수온만 2°C 낮춰 맛의 변화를 비교해 보세요.',
    };
  }

  return null;
}
