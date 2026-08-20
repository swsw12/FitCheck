import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, font } from '../theme';

/**
 * 핏 리포트 카드 (Figma: Primary Grade + 측정 행 — 생성 대기/결과 화면 공용)
 */
export default function FitReportCard({
  showStatus = true,
  itemName = '코튼 티셔츠 · L',
  grade = '세미오버핏',
  gradeDesc = '선호하시는 레귤러핏보다 약간 큽니다',
  profileBadge = '실측 프로필 · 신뢰도 높음',
  rows = [
    { label: '가슴', type: 'bar', barRatio: 0.66, value: '+18', unit: 'cm' },
    { label: '어깨', type: 'text', desc: '드롭숄더로 떨어짐', value: '+4', unit: 'cm', highlight: true },
    { label: '기장', type: 'text', desc: '엉덩이 중간' },
    { label: '소매', type: 'text', desc: '손등 일부 덮음' },
  ],
  style,
}) {
  return (
    <View style={[styles.card, style]}>
      {showStatus && (
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <Feather name="check" size={15} color={colors.success} />
            <Text style={styles.statusText}>핏 분석은 끝났어요</Text>
          </View>
          <View style={styles.profileBadge}>
            <MaterialCommunityIcons name="shield-check-outline" size={13} color={colors.gray700} />
            <Text style={styles.profileBadgeText}>{profileBadge}</Text>
          </View>
        </View>
      )}

      <Text style={styles.itemName}>{itemName}</Text>
      <Text style={styles.grade}>{grade}</Text>
      <Text style={styles.gradeDesc}>{gradeDesc}</Text>

      <View style={styles.rows}>
        {rows.map((r, i) => (
          <View
            key={r.label}
            style={[styles.row, i > 0 && styles.rowBorderTop]}
          >
            <Text style={styles.rowLabel}>{r.label}</Text>
            {r.type === 'bar' ? (
              <View style={styles.rowTrack}>
                <View style={[styles.rowFill, { width: `${(r.barRatio || 0.5) * 100}%` }]} />
              </View>
            ) : (
              <Text style={styles.rowDesc}>{r.desc}</Text>
            )}
            {r.value ? (
              <Text style={[styles.rowValue, r.highlight && { color: colors.blue }]}>
                {r.value} <Text style={styles.rowUnit}>{r.unit}</Text>
              </Text>
            ) : (
              <View style={{ width: 64 }} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingTop: 19,
    paddingBottom: 8,
    gap: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontFamily: font.semibold, fontSize: 16, lineHeight: 28, color: colors.success },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  profileBadgeText: {
    fontFamily: font.medium,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: colors.gray700,
  },
  itemName: { fontFamily: font.regular, fontSize: 16, lineHeight: 28, color: colors.ink },
  grade: { fontFamily: font.medium, fontSize: 32, lineHeight: 48, letterSpacing: -1, color: colors.black, marginTop: -12 },
  gradeDesc: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: colors.gray500, marginTop: -12 },
  rows: { marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  rowBorderTop: { borderTopWidth: 1, borderTopColor: colors.gray300 },
  rowLabel: {
    width: 40,
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.gray700,
  },
  rowDesc: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.ink,
  },
  rowTrack: {
    flex: 1,
    height: 4,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    overflow: 'hidden',
  },
  rowFill: { height: 4, borderRadius: 12, backgroundColor: colors.black },
  rowValue: {
    width: 64,
    textAlign: 'right',
    fontFamily: font.medium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.ink,
  },
  rowUnit: { fontSize: 16 },
});
