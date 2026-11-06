import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getBrew, getRecommendation, listBeans, saveBrew } from '../db';
import { colors, spacing } from '../theme';
import { Bean, BeanSnapshot, BrewTemperature, Score } from '../types';
import { Button, ChoiceRow, Field, ScoreInput, Screen, Section } from '../ui';

const temperatureOptions: BrewTemperature[] = ['따뜻하게', '아이스'];
const numberOrNull = (value: string) => value.trim() === '' ? null : Number(value);
const scoreText = (value: Score) => value === null ? '미입력' : String(value);

export function BrewFormScreen() {
  const params = useLocalSearchParams<{ id?: string; sourceBrewId?: string; recommendationId?: string }>();
  const brewId = params.id ? Number(params.id) : undefined;
  const sourceBrewId = params.sourceBrewId ? Number(params.sourceBrewId) : undefined;
  const recommendationId = params.recommendationId ? Number(params.recommendationId) : undefined;
  const [beans, setBeans] = useState<Bean[]>([]);
  const [beanId, setBeanId] = useState<number | null>(null);
  const [originalBeanId, setOriginalBeanId] = useState<number | null>(null);
  const [fallbackBean, setFallbackBean] = useState<BeanSnapshot | null>(null);
  const [brewedAt, setBrewedAt] = useState(new Date().toISOString().slice(0, 10));
  const [desiredTaste, setDesiredTaste] = useState('');
  const [temperature, setTemperature] = useState<BrewTemperature>('따뜻하게');
  const [brewer, setBrewer] = useState('');
  const [grinder, setGrinder] = useState('');
  const [coffeeGrams, setCoffeeGrams] = useState('');
  const [waterGrams, setWaterGrams] = useState('');
  const [waterTemperature, setWaterTemperature] = useState('');
  const [grindSize, setGrindSize] = useState('');
  const [brewMinutes, setBrewMinutes] = useState('');
  const [brewSeconds, setBrewSeconds] = useState('');
  const [iceGrams, setIceGrams] = useState('');
  const [pouringNotes, setPouringNotes] = useState('');
  const [acidity, setAcidity] = useState<Score>(null);
  const [bitterness, setBitterness] = useState<Score>(null);
  const [sweetness, setSweetness] = useState<Score>(null);
  const [body, setBody] = useState<Score>(null);
  const [satisfaction, setSatisfaction] = useState<Score>(null);
  const [notes, setNotes] = useState('');
  const [nextTaste, setNextTaste] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [originalSourceBrewId, setOriginalSourceBrewId] = useState<number | null>(null);
  const [originalRecommendationId, setOriginalRecommendationId] = useState<number | null>(null);

  const fillRecipe = useCallback((brew: Awaited<ReturnType<typeof getBrew>>) => {
    if (!brew) return;
    setBeanId(brew.beanId); setFallbackBean(brew.bean); setBrewedAt(brew.brewedAt.slice(0, 10));
    setDesiredTaste(brew.desiredTaste); setTemperature(brew.recipe.temperature); setBrewer(brew.recipe.brewer);
    setGrinder(brew.recipe.grinder); setCoffeeGrams(String(brew.recipe.coffeeGrams)); setWaterGrams(String(brew.recipe.waterGrams));
    setWaterTemperature(brew.recipe.waterTemperature === null ? '' : String(brew.recipe.waterTemperature));
    setGrindSize(brew.recipe.grindSize); setBrewMinutes(brew.recipe.brewMinutes === null ? '' : String(brew.recipe.brewMinutes));
    setBrewSeconds(brew.recipe.brewSeconds === null ? '' : String(brew.recipe.brewSeconds));
    setIceGrams(brew.recipe.iceGrams === null ? '' : String(brew.recipe.iceGrams)); setPouringNotes(brew.recipe.pouringNotes);
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const beanItems = await listBeans();
      if (!active) return;
      setBeans(beanItems);
      if (loaded) return;

      if (brewId) {
        const brew = await getBrew(brewId);
        if (!active || !brew) return;
        fillRecipe(brew);
        setOriginalBeanId(brew.beanId);
        setAcidity(brew.tasting.acidity); setBitterness(brew.tasting.bitterness); setSweetness(brew.tasting.sweetness);
        setBody(brew.tasting.body); setSatisfaction(brew.tasting.satisfaction); setNotes(brew.tasting.notes);
        setNextTaste(brew.tasting.nextTaste); setOriginalSourceBrewId(brew.sourceBrewId); setOriginalRecommendationId(brew.sourceRecommendationId);
      } else if (sourceBrewId) {
        const source = await getBrew(sourceBrewId);
        if (!active || !source) return;
        fillRecipe(source);
        setBrewedAt(new Date().toISOString().slice(0, 10));
        setOriginalSourceBrewId(sourceBrewId); setOriginalRecommendationId(recommendationId ?? null);
        setAcidity(null); setBitterness(null); setSweetness(null); setBody(null); setSatisfaction(null); setNotes(''); setNextTaste('');
        if (recommendationId) {
          const recommendation = await getRecommendation(recommendationId);
          if (recommendation?.conditionName === '물양') setWaterGrams(recommendation.suggestedValue.replace(/[^0-9.]/g, ''));
          if (recommendation?.conditionName === '수온') setWaterTemperature(recommendation.suggestedValue.replace(/[^0-9.]/g, ''));
          if (recommendation?.conditionName === '분쇄도') setGrindSize(recommendation.suggestedValue);
        }
      } else if (beanItems.length === 1) {
        setBeanId(beanItems[0].id);
      }
      setLoaded(true);
    })();
    return () => { active = false; };
  }, [brewId, fillRecipe, loaded, recommendationId, sourceBrewId]));

  const submit = async () => {
    const bean = beans.find((item) => item.id === beanId);
    const currentBeanSnapshot: BeanSnapshot | null = bean ? {
      id: bean.id, name: bean.name, roastery: bean.roastery, roastedAt: bean.roastedAt,
      roastLevel: bean.roastLevel, photoUri: bean.photoUri,
    } : fallbackBean;
    const beanSnapshot = brewId && beanId === originalBeanId && fallbackBean ? fallbackBean : currentBeanSnapshot;
    const coffee = Number(coffeeGrams);
    const water = Number(waterGrams);
    const seconds = numberOrNull(brewSeconds);
    if (!beanSnapshot || (!beanId && !brewId && !sourceBrewId)) { Alert.alert('등록된 원두를 선택해 주세요.'); return; }
    if (!Number.isFinite(coffee) || coffee <= 0 || !Number.isFinite(water) || water <= 0) {
      Alert.alert('원두량과 물양을 확인해 주세요', '0보다 큰 숫자로 입력해 주세요.'); return;
    }
    if (seconds !== null && (seconds < 0 || seconds > 59)) { Alert.alert('추출 시간의 초는 0~59로 입력해 주세요.'); return; }
    const optionalNumbers = [numberOrNull(waterTemperature), numberOrNull(brewMinutes), numberOrNull(iceGrams)];
    if (optionalNumbers.some((value) => value !== null && (!Number.isFinite(value) || value < 0))) {
      Alert.alert('수치를 확인해 주세요', '입력한 값은 0 이상의 숫자여야 합니다.'); return;
    }
    setSaving(true);
    try {
      const savedId = await saveBrew({
        beanId: bean?.id ?? null,
        bean: beanSnapshot,
        brewedAt: new Date(`${brewedAt}T12:00:00`).toISOString(),
        desiredTaste: desiredTaste.trim(),
        recipe: {
          temperature, brewer: brewer.trim(), grinder: grinder.trim(), coffeeGrams: coffee, waterGrams: water,
          waterTemperature: numberOrNull(waterTemperature), grindSize: grindSize.trim(),
          brewMinutes: numberOrNull(brewMinutes), brewSeconds: seconds, iceGrams: temperature === '아이스' ? numberOrNull(iceGrams) : null,
          pouringNotes: pouringNotes.trim(),
        },
        tasting: { acidity, bitterness, sweetness, body, satisfaction, notes: notes.trim(), nextTaste: nextTaste.trim() },
        sourceBrewId: originalSourceBrewId,
        sourceRecommendationId: originalRecommendationId,
      }, brewId);
      Alert.alert('저장했어요', `평가: 산미 ${scoreText(acidity)}, 만족도 ${scoreText(satisfaction)}`, [
        { text: '기록 보기', onPress: () => router.replace(`/brew/${savedId}`) },
      ]);
    } catch {
      Alert.alert('저장하지 못했어요', '날짜와 입력값을 확인한 뒤 다시 시도해 주세요.');
    } finally { setSaving(false); }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: brewId ? '기록 수정' : '새 추출 기록' }} />
      {sourceBrewId ? <View style={styles.sourceBanner}><Text style={styles.sourceText}>이전 기록과 추천을 바탕으로 만든 새 기록입니다. 시음 평가는 비워두었습니다.</Text></View> : null}
      <Section title="추출 전" subtitle="원두와 원두량·물양만 필수입니다.">
        <View style={styles.pickerWrap}>
          <Text style={styles.pickerLabel}>원두 *</Text>
          <Picker selectedValue={beanId} onValueChange={(value) => setBeanId(value)} style={styles.picker}>
            <Picker.Item label="원두를 선택하세요" value={null} />
            {beans.map((bean) => <Picker.Item key={bean.id} label={bean.name} value={bean.id} />)}
          </Picker>
        </View>
        {beans.length === 0 ? <Button label="먼저 원두 등록" variant="secondary" onPress={() => router.push('/beans/new')} /> : null}
        <Field label="추출 날짜" value={brewedAt} onChangeText={setBrewedAt} placeholder="YYYY-MM-DD" />
        <Field label="오늘 원하는 맛" value={desiredTaste} onChangeText={setDesiredTaste} placeholder="예: 초콜릿, 산뜻함" />
        <ChoiceRow options={temperatureOptions} value={temperature} onChange={setTemperature} />
        <Field label="추출 도구" value={brewer} onChangeText={setBrewer} placeholder="예: V60" />
        <View style={styles.twoColumns}>
          <View style={styles.flex}><Field label="원두량" unit="g" required value={coffeeGrams} onChangeText={setCoffeeGrams} keyboardType="decimal-pad" /></View>
          <View style={styles.flex}><Field label="물양" unit="g" required value={waterGrams} onChangeText={setWaterGrams} keyboardType="decimal-pad" /></View>
        </View>
        <Pressable onPress={() => setDetailsOpen((value) => !value)} style={styles.detailToggle}>
          <Text style={styles.detailToggleText}>{detailsOpen ? '상세 조건 접기 ▲' : '상세 조건 펼치기 ▼'}</Text>
        </Pressable>
        {detailsOpen ? (
          <View style={styles.details}>
            <Field label="그라인더" value={grinder} onChangeText={setGrinder} placeholder="선택 입력" />
            <Field label="수온" unit="°C" value={waterTemperature} onChangeText={setWaterTemperature} keyboardType="decimal-pad" />
            <Field label="분쇄도" value={grindSize} onChangeText={setGrindSize} placeholder="예: 20클릭 또는 조금 굵게" />
            <View style={styles.twoColumns}>
              <View style={styles.flex}><Field label="추출 시간" unit="분" value={brewMinutes} onChangeText={setBrewMinutes} keyboardType="number-pad" /></View>
              <View style={styles.flex}><Field label="추출 시간" unit="초" value={brewSeconds} onChangeText={setBrewSeconds} keyboardType="number-pad" /></View>
            </View>
            {temperature === '아이스' ? <Field label="얼음량" unit="g" value={iceGrams} onChangeText={setIceGrams} keyboardType="decimal-pad" /> : null}
            <Field label="붓는 순서와 추출 메모" value={pouringNotes} onChangeText={setPouringNotes} multiline placeholder="선택 입력" />
          </View>
        ) : null}
      </Section>
      <Section title="추출 후 평가" subtitle="지금 비워두고 저장한 뒤 나중에 기록을 수정해도 됩니다.">
        <ScoreInput label="산미" value={acidity} onChange={setAcidity} />
        <ScoreInput label="쓴맛" value={bitterness} onChange={setBitterness} />
        <ScoreInput label="단맛" value={sweetness} onChange={setSweetness} />
        <ScoreInput label="바디" value={body} onChange={setBody} low="가벼움" high="묵직함" />
        <ScoreInput label="만족도" value={satisfaction} onChange={setSatisfaction} low="불만족" high="만족" />
        <Field label="느낀 점" value={notes} onChangeText={setNotes} multiline placeholder="자유롭게 적어보세요" />
        <Field label="다음에 원하는 맛" value={nextTaste} onChangeText={setNextTaste} multiline placeholder="추천에 가장 먼저 반영됩니다" />
      </Section>
      <Button label={saving ? '저장 중…' : '기록 저장'} disabled={saving} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sourceBanner: { backgroundColor: colors.accentSoft, borderRadius: 14, padding: spacing.md },
  sourceText: { color: colors.brown, lineHeight: 21, fontWeight: '600' },
  pickerWrap: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden' },
  pickerLabel: { color: colors.brown, fontSize: 13, fontWeight: '700', paddingHorizontal: 14, paddingTop: 10 },
  picker: { color: colors.brown },
  twoColumns: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  detailToggle: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  detailToggleText: { color: colors.accent, fontWeight: '800' },
  details: { gap: spacing.md },
});
