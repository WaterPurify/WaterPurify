import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { listBrews } from '../db';
import { colors, spacing } from '../theme';
import { Brew } from '../types';
import { Button, Card, Screen } from '../ui';

const dateText = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));

export function HomeScreen() {
  const [brews, setBrews] = useState<Brew[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      listBrews().then((items) => {
        if (active) {
          setBrews(items);
          setLoading(false);
        }
      });
      return () => { active = false; };
    }, []),
  );

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>나만의 핸드드립 기록</Text>
        <Text style={styles.title}>Coffee Bible</Text>
        <Text style={styles.intro}>한 잔씩 기록하고, 다음 추출에서 한 가지 변화를 비교해 보세요.</Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.flex}><Button label="새 기록" onPress={() => router.push('/brew/new')} /></View>
        <View style={styles.flex}><Button label="원두 등록" variant="secondary" onPress={() => router.push('/beans/new')} /></View>
      </View>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>최근 추출</Text>
        <Text onPress={() => router.push('/beans')} style={styles.link}>원두 관리</Text>
      </View>
      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {!loading && brews.length === 0 ? (
        <Card>
          <Text style={styles.emptyTitle}>아직 기록이 없어요</Text>
          <Text style={styles.muted}>원두를 등록한 뒤 오늘의 첫 추출을 남겨보세요.</Text>
          <Button label="첫 원두 등록하기" variant="secondary" onPress={() => router.push('/beans/new')} />
        </Card>
      ) : null}
      {brews.map((brew) => (
        <Card key={brew.id} onPress={() => router.push(`/brew/${brew.id}`)}>
          <View style={styles.cardTop}>
            <Text style={styles.beanName}>{brew.bean.name}</Text>
            <Text style={styles.date}>{dateText(brew.brewedAt)}</Text>
          </View>
          <Text style={styles.recipe}>{brew.recipe.brewer || '도구 미입력'} · {brew.recipe.coffeeGrams}g / {brew.recipe.waterGrams}g</Text>
          <Text style={styles.satisfaction}>
            만족도 {brew.tasting.satisfaction === null ? '미입력' : `${brew.tasting.satisfaction} / 5`}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingVertical: spacing.lg, gap: spacing.sm },
  eyebrow: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  title: { color: colors.brown, fontWeight: '900', fontSize: 38, letterSpacing: -1 },
  intro: { color: colors.brownSoft, fontSize: 17, lineHeight: 26, maxWidth: 340 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  heading: { color: colors.brown, fontSize: 22, fontWeight: '800' },
  link: { color: colors.accent, fontSize: 15, fontWeight: '700', padding: 8 },
  emptyTitle: { color: colors.brown, fontSize: 18, fontWeight: '800' },
  muted: { color: colors.muted, lineHeight: 22 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  beanName: { color: colors.brown, fontWeight: '800', fontSize: 18, flex: 1 },
  date: { color: colors.muted, fontSize: 13 },
  recipe: { color: colors.brownSoft, fontSize: 15 },
  satisfaction: { color: colors.accent, fontWeight: '700' },
});
