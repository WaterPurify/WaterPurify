import React, { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { deleteBrew, getBrew, saveRecommendation } from '../db';
import { createRecommendation } from '../recommendation';
import { colors, spacing } from '../theme';
import { Brew, Recommendation, Score } from '../types';
import { Button, Card, Screen, Section } from '../ui';

const score = (value: Score) => value === null ? '미입력' : `${value} / 5`;
const valueOrEmpty = (value: string | number | null, unit = '') => value === '' || value === null ? '미입력' : `${value}${unit}`;

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

export function BrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const brewId = Number(id);
  const [brew, setBrew] = useState<Brew | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [recommendationMessage, setRecommendationMessage] = useState('');

  const refresh = useCallback(() => { getBrew(brewId).then(setBrew); }, [brewId]);
  useFocusEffect(refresh);
  if (!brew) return <Screen><Text style={styles.muted}>기록을 불러오는 중입니다…</Text></Screen>;

  const showRecommendation = async () => {
    const draft = createRecommendation(brew);
    if (!draft) {
      const hasScores = [brew.tasting.acidity, brew.tasting.bitterness, brew.tasting.sweetness, brew.tasting.body, brew.tasting.satisfaction].some((v) => v !== null);
      setRecommendationMessage(hasScores
        ? '현재 기록만으로는 한 가지 조건을 자신 있게 제안하기 어렵습니다. “다음에 원하는 맛”을 적으면 더 명확한 비교 제안을 만들 수 있어요.'
        : '시음 평가 또는 “다음에 원하는 맛”을 입력하면 다음 추출에서 비교할 조건을 제안할 수 있어요.');
      setRecommendation(null);
      return;
    }
    setRecommendation(await saveRecommendation(brew.id, draft));
    setRecommendationMessage('');
  };

  const confirmDelete = () => Alert.alert('이 기록을 삭제할까요?', '삭제한 기록은 복구할 수 없습니다.', [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: async () => { await deleteBrew(brew.id); router.replace('/'); } },
  ]);

  const brewedDate = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(brew.brewedAt));
  const time = brew.recipe.brewMinutes === null && brew.recipe.brewSeconds === null
    ? '미입력'
    : `${brew.recipe.brewMinutes ?? 0}분 ${brew.recipe.brewSeconds ?? 0}초`;

  return (
    <Screen>
      <Stack.Screen options={{ title: '추출 기록', headerRight: () => <Text onPress={() => router.push(`/brew/${brewId}/edit`)} style={styles.headerAction}>수정</Text> }} />
      <View style={styles.hero}>
        {brew.bean.photoUri ? <Image source={{ uri: brew.bean.photoUri }} style={styles.photo} /> : null}
        <Text style={styles.beanName}>{brew.bean.name}</Text>
        <Text style={styles.date}>{brewedDate}</Text>
        {brew.sourceBrewId ? <Text style={styles.lineage}>이전 기록 #{brew.sourceBrewId}의 추천을 참고한 추출</Text> : null}
      </View>
      <Section title="오늘의 방향">
        <Card>
          <Row label="추출 전 원한 맛" value={valueOrEmpty(brew.desiredTaste)} />
          <Row label="다음에 원하는 맛" value={valueOrEmpty(brew.tasting.nextTaste)} />
        </Card>
      </Section>
      <Section title="레시피">
        <Card>
          <Row label="방식" value={brew.recipe.temperature} />
          <Row label="도구" value={valueOrEmpty(brew.recipe.brewer)} />
          <Row label="그라인더" value={valueOrEmpty(brew.recipe.grinder)} />
          <Row label="원두량" value={valueOrEmpty(brew.recipe.coffeeGrams, 'g')} />
          <Row label="물양" value={valueOrEmpty(brew.recipe.waterGrams, 'g')} />
          <Row label="수온" value={valueOrEmpty(brew.recipe.waterTemperature, '°C')} />
          <Row label="분쇄도" value={valueOrEmpty(brew.recipe.grindSize)} />
          <Row label="추출 시간" value={time} />
          {brew.recipe.temperature === '아이스' ? <Row label="얼음량" value={valueOrEmpty(brew.recipe.iceGrams, 'g')} /> : null}
          <Row label="추출 메모" value={valueOrEmpty(brew.recipe.pouringNotes)} />
        </Card>
      </Section>
      <Section title="시음 평가">
        <Card>
          <Row label="산미" value={score(brew.tasting.acidity)} />
          <Row label="쓴맛" value={score(brew.tasting.bitterness)} />
          <Row label="단맛" value={score(brew.tasting.sweetness)} />
          <Row label="바디" value={score(brew.tasting.body)} />
          <Row label="만족도" value={score(brew.tasting.satisfaction)} />
          <Row label="느낀 점" value={valueOrEmpty(brew.tasting.notes)} />
        </Card>
      </Section>
      <Section title="다음 레시피" subtitle="규칙 기반 제안이며, 맛의 개선을 보장하지 않습니다. 한 번에 한 조건만 바꿔 비교합니다.">
        {!recommendation ? <Button label="다음 레시피 보기" onPress={showRecommendation} /> : null}
        {recommendationMessage ? <Card><Text style={styles.muted}>{recommendationMessage}</Text><Button label="평가 추가하기" variant="secondary" onPress={() => router.push(`/brew/${brewId}/edit`)} /></Card> : null}
        {recommendation ? (
          <Card>
            <View style={styles.badge}><Text style={styles.badgeText}>{recommendation.method}</Text></View>
            <Text style={styles.changeTitle}>{recommendation.conditionName}만 바꿔보세요</Text>
            <View style={styles.compare}>
              <View style={styles.compareCell}><Text style={styles.compareLabel}>기존</Text><Text style={styles.compareValue}>{recommendation.beforeValue}</Text></View>
              <Text style={styles.arrow}>→</Text>
              <View style={styles.compareCell}><Text style={styles.compareLabel}>제안</Text><Text style={styles.compareValue}>{recommendation.suggestedValue}</Text></View>
            </View>
            <Text style={styles.reason}>{recommendation.reason}</Text>
            <Button label="이 레시피로 새 기록" onPress={() => router.push({ pathname: '/brew/new', params: { sourceBrewId: brew.id, recommendationId: recommendation.id } })} />
          </Card>
        ) : null}
      </Section>
      <Button label="기록 삭제" variant="danger" onPress={confirmDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { color: colors.accent, fontWeight: '800', fontSize: 16, padding: 8 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: spacing.md },
  photo: { width: 104, height: 104, borderRadius: 26, marginBottom: 6 },
  beanName: { color: colors.brown, fontWeight: '900', fontSize: 27, textAlign: 'center' },
  date: { color: colors.muted },
  lineage: { color: colors.accent, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 18, paddingVertical: 3 },
  rowLabel: { color: colors.muted, fontSize: 14, flex: 1 },
  rowValue: { color: colors.brown, fontWeight: '600', fontSize: 14, flex: 1.5, textAlign: 'right' },
  muted: { color: colors.muted, lineHeight: 22 },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.accentSoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: colors.brown, fontSize: 12, fontWeight: '800' },
  changeTitle: { color: colors.brown, fontWeight: '900', fontSize: 20 },
  compare: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compareCell: { flex: 1, backgroundColor: colors.background, borderRadius: 12, padding: 12, gap: 5 },
  compareLabel: { color: colors.muted, fontSize: 12 },
  compareValue: { color: colors.brown, fontSize: 16, fontWeight: '800' },
  arrow: { color: colors.accent, fontWeight: '900' },
  reason: { color: colors.brownSoft, lineHeight: 22 },
});
