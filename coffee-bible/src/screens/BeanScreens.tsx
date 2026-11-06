import React, { useCallback, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { deleteBean, getBean, listBeans, saveBean } from '../db';
import { colors, spacing } from '../theme';
import { Bean, RoastLevel } from '../types';
import { Button, Card, ChoiceRow, Field, Screen, Section } from '../ui';

export function BeanListScreen() {
  const [beans, setBeans] = useState<Bean[]>([]);
  const refresh = useCallback(() => { listBeans().then(setBeans); }, []);
  useFocusEffect(refresh);

  return (
    <Screen>
      <Button label="새 원두 등록" onPress={() => router.push('/beans/new')} />
      {beans.length === 0 ? <Card><Text style={styles.muted}>등록된 원두가 없습니다.</Text></Card> : null}
      {beans.map((bean) => (
        <Card key={bean.id} onPress={() => router.push(`/beans/${bean.id}`)}>
          <View style={styles.beanRow}>
            {bean.photoUri ? <Image source={{ uri: bean.photoUri }} style={styles.thumb} /> : <View style={styles.placeholder}><Text>☕</Text></View>}
            <View style={styles.beanInfo}>
              <Text style={styles.name}>{bean.name}</Text>
              <Text style={styles.muted}>{[bean.roastery, bean.roastLevel].filter(Boolean).join(' · ') || '추가 정보 없음'}</Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const roastOptions: RoastLevel[] = ['라이트', '미디엄', '다크', '모름'];

export function BeanFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const beanId = id ? Number(id) : undefined;
  const [name, setName] = useState('');
  const [roastery, setRoastery] = useState('');
  const [roastedAt, setRoastedAt] = useState('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!beanId) return;
    getBean(beanId).then((bean) => {
      if (!bean) return;
      setName(bean.name); setRoastery(bean.roastery ?? ''); setRoastedAt(bean.roastedAt ?? '');
      setRoastLevel(bean.roastLevel); setPhotoUri(bean.photoUri);
    });
  }, [beanId]));

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('사진 권한 없이 계속할 수 있어요', '사진은 선택 사항입니다. 원두 정보는 사진 없이도 저장됩니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    if (Platform.OS === 'web') {
      setPhotoUri(result.assets[0].uri);
      return;
    }
    const directory = new Directory(Paths.document, 'bean-photos');
    directory.create({ idempotent: true, intermediates: true });
    const extension = result.assets[0].uri.split('.').pop()?.split('?')[0] || 'jpg';
    const source = new File(result.assets[0].uri);
    const destination = new File(directory, `${Date.now()}.${extension}`);
    await source.copy(destination);
    setPhotoUri(destination.uri);
  };

  const submit = async () => {
    if (!name.trim()) { Alert.alert('원두 이름을 입력해 주세요.'); return; }
    setSaving(true);
    try {
      await saveBean({
        name: name.trim(), roastery: roastery.trim() || null, roastedAt: roastedAt.trim() || null,
        roastLevel, photoUri,
      }, beanId);
      Alert.alert('저장했어요', '원두 정보가 기기에 저장되었습니다.', [{ text: '확인', onPress: () => router.back() }]);
    } catch {
      Alert.alert('저장하지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally { setSaving(false); }
  };

  const confirmDelete = () => {
    if (!beanId) return;
    Alert.alert('원두를 삭제할까요?', '기존 추출 기록에는 당시의 원두 정보가 그대로 남습니다.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deleteBean(beanId); router.replace('/beans'); } },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: beanId ? '원두 수정' : '원두 등록' }} />
      <Section title="기본 정보" subtitle="* 표시는 필수 항목입니다.">
        <Field label="원두 이름" required value={name} onChangeText={setName} placeholder="예: 에티오피아 구지" />
        <Field label="로스터리" value={roastery} onChangeText={setRoastery} placeholder="선택 입력" />
        <Field label="로스팅 날짜" value={roastedAt} onChangeText={setRoastedAt} placeholder="예: 2026-11-06" />
        <Text style={styles.label}>로스팅 정도</Text>
        <ChoiceRow options={roastOptions} value={roastLevel} onChange={setRoastLevel} />
      </Section>
      <Section title="원두 사진" subtitle="사진 권한을 허용하지 않아도 등록할 수 있습니다.">
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : null}
        <Button label={photoUri ? '사진 바꾸기' : '사진 선택'} variant="secondary" onPress={pickPhoto} />
      </Section>
      <Button label={saving ? '저장 중…' : '저장'} disabled={saving} onPress={submit} />
      {beanId ? <Button label="원두 삭제" variant="danger" onPress={confirmDelete} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  beanRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 62, height: 62, borderRadius: 14 },
  placeholder: { width: 62, height: 62, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  beanInfo: { flex: 1, gap: 5 },
  name: { color: colors.brown, fontSize: 18, fontWeight: '800' },
  muted: { color: colors.muted, lineHeight: 21 },
  label: { color: colors.brown, fontSize: 15, fontWeight: '700' },
  photo: { width: '100%', height: 210, borderRadius: 18, backgroundColor: colors.accentSoft },
});
