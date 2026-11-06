import React, { ReactNode } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from './theme';
import { Score } from './types';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const body = <View style={styles.card}>{children}</View>;
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  required,
  unit,
  keyboardType,
  ...props
}: TextInputProps & {
  label: string;
  required?: boolean;
  unit?: string;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{required ? ' *' : ''}{unit ? ` (${unit})` : ''}
      </Text>
      <TextInput
        placeholderTextColor="#9B8D84"
        style={[styles.input, props.multiline && styles.multiline]}
        keyboardType={keyboardType}
        {...props}
      />
    </View>
  );
}

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.help}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function ScoreInput({
  label,
  value,
  onChange,
  low = '약함',
  high = '강함',
}: {
  label: string;
  value: Score;
  onChange: (value: Score) => void;
  low?: string;
  high?: string;
}) {
  return (
    <View style={styles.scoreField}>
      <View style={styles.scoreHeader}>
        <Text style={styles.label}>{label}</Text>
        <Pressable onPress={() => onChange(null)} hitSlop={8}>
          <Text style={styles.clear}>미입력</Text>
        </Pressable>
      </View>
      <View style={styles.scoreRow}>
        {[1, 2, 3, 4, 5].map((score) => (
          <Pressable
            key={score}
            onPress={() => onChange(score as Score)}
            style={[styles.score, value === score && styles.scoreSelected]}
          >
            <Text style={[styles.scoreText, value === score && styles.scoreTextSelected]}>{score}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.scoreLabels}><Text style={styles.help}>{low}</Text><Text style={styles.help}>{high}</Text></View>
    </View>
  );
}

export function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.choiceRow}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          style={[styles.choice, value === option && styles.choiceSelected]}
        >
          <Text style={[styles.choiceText, value === option && styles.choiceTextSelected]}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 48, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
  },
  button: { minHeight: 50, borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  button_primary: { backgroundColor: colors.brown },
  button_secondary: { backgroundColor: colors.accentSoft },
  button_danger: { backgroundColor: '#F7D6D3' },
  button_text: { backgroundColor: 'transparent' },
  buttonText: { fontSize: 16, fontWeight: '700' },
  buttonText_primary: { color: colors.white },
  buttonText_secondary: { color: colors.brown },
  buttonText_danger: { color: colors.danger },
  buttonText_text: { color: colors.accent },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  field: { gap: 7 },
  label: { color: colors.brown, fontSize: 15, fontWeight: '700' },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.brown,
    fontSize: 16,
  },
  multiline: { minHeight: 92, paddingTop: 14, textAlignVertical: 'top' },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.brown, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  help: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  scoreField: { gap: 8 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  clear: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', gap: 8 },
  score: { flex: 1, aspectRatio: 1.2, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  scoreSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  scoreText: { color: colors.brown, fontWeight: '700' },
  scoreTextSelected: { color: colors.white },
  scoreLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 42, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
  choiceSelected: { backgroundColor: colors.brown, borderColor: colors.brown },
  choiceText: { color: colors.brown, fontWeight: '600' },
  choiceTextSelected: { color: colors.white },
});

export const uiStyles = styles;
