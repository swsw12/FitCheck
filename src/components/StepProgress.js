import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../theme';

/** 상단 단계 진행 바 + "n / 4" 표기 (Figma: Progress Bar + Heading 컨테이너) */
export function ProgressBar({ step, total = 4 }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${(step / total) * 100}%` }]} />
    </View>
  );
}

export function StepIndicator({ step, total = 4 }) {
  return (
    <View style={styles.indicator}>
      <Text style={styles.current}>{step}</Text>
      <Text style={styles.divider}>/</Text>
      <Text style={styles.total}>{total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, backgroundColor: colors.gray200, width: '100%' },
  fill: { height: 4, backgroundColor: colors.blue },
  indicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  current: { fontFamily: font.bold, fontSize: 14, lineHeight: 16, letterSpacing: 0.12, color: colors.black },
  divider: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700 },
  total: { fontFamily: font.medium, fontSize: 14, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700 },
});
