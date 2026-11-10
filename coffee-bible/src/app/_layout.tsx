import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase } from '../db';
import { colors } from '../theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    initializeDatabase().then(() => setReady(true)).catch(() => setError(true));
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={styles.loading}>
          {error ? <Text style={styles.error}>저장 공간을 준비하지 못했습니다. 앱을 다시 실행해 주세요.</Text> : <ActivityIndicator size="large" color={colors.accent} />}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.brown,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="beans/index" options={{ title: '원두 관리' }} />
        <Stack.Screen name="beans/new" options={{ title: '원두 등록' }} />
        <Stack.Screen name="beans/[id]" options={{ title: '원두 수정' }} />
        <Stack.Screen name="brew/new" options={{ title: '새 추출 기록' }} />
        <Stack.Screen name="brew/[id]" options={{ title: '추출 기록' }} />
        <Stack.Screen name="brew/[id]/edit" options={{ title: '기록 수정' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  error: { color: colors.danger, textAlign: 'center', lineHeight: 23 },
});
