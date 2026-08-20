import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { colors, font, type } from '../theme';

/** Figma: 01 랜딩 (109:1077) */
export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader showBack={false} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headlineBlock}>
          <Text style={styles.h1}>사기 전에,{'\n'}나에게 맞는 핏인지 확인하세요.</Text>
          <Text style={styles.sub}>
            AI가 내 신체 사이즈와 옷의 실측을 비교하며,{'\n'}중고 거래 · 해외 직구 실측 치수로 계산하여 알려드려요.
          </Text>
        </View>

        {/* 피팅 리포트 예시 카드 */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>피팅 리포트 예시</Text>
          </View>
          <Text style={styles.itemName}>코튼 티셔츠 · L</Text>
          <Text style={styles.grade}>세미오버핏</Text>
          <Text style={styles.gradeDesc}>선호하시는 레귤러핏보다 약간 큽니다</Text>

          <View style={styles.measureRow}>
            <Text style={styles.measureLabel}>가슴</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
            <Text style={styles.measureValue}>
              +18 <Text style={styles.measureUnit}>cm</Text>
            </Text>
          </View>
          <View style={[styles.measureRow, styles.measureRowBordered]}>
            <Text style={styles.measureLabel}>어깨</Text>
            <Text style={styles.measureDesc}>드롭숄더로 떨어짐</Text>
            <Text style={[styles.measureValue, { color: colors.blue }]}>
              +4 <Text style={[styles.measureUnit, { color: colors.blue }]}>cm</Text>
            </Text>
          </View>
          <View style={styles.measureRow}>
            <Text style={styles.measureLabel}>기장</Text>
            <Text style={styles.measureDesc}>엉덩이 중간</Text>
            <View style={{ width: 56 }} />
          </View>
        </View>

        {/* 특징 2종 */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIconBox}>
              <MaterialCommunityIcons name="tag-outline" size={22} color={colors.blue} />
            </View>
            <Text style={styles.featureTitle}>반품 고민 감소</Text>
            <Text style={styles.featureDesc}>핏을 미리 확인해요</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureIconBox}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={22} color={colors.blue} />
            </View>
            <Text style={styles.featureTitle}>정확한 사이즈 추천</Text>
            <Text style={styles.featureDesc}>AI가 데이터로 분석해요</Text>
          </View>
        </View>

        <Text style={styles.privacyNote}>사진과 측정 정보는 안전하게 보관하고 계정을 받아요.</Text>

        <PrimaryButton
          title="시작하기"
          style={styles.cta}
          onPress={() => navigation.navigate('EmailAuth')}
        />

        <TouchableOpacity style={styles.loginRow} onPress={() => navigation.navigate('EmailAuth', { mode: 'login' })}>
          <Text style={styles.loginText}>
            이미 계정이 있으신가요? <Text style={styles.loginLink}>로그인</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingBottom: 38 },
  headlineBlock: { paddingHorizontal: 20, marginTop: 24, gap: 12 },
  h1: { ...type.h1 },
  sub: { ...type.body },
  card: {
    marginHorizontal: 20,
    marginTop: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cardTitleRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    paddingBottom: 8,
    marginBottom: 12,
  },
  cardTitle: { fontFamily: font.medium, fontSize: 16, lineHeight: 24, color: colors.black },
  itemName: { ...type.bodyInk, lineHeight: 28 },
  grade: { ...type.display },
  gradeDesc: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: colors.gray500 },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  measureRowBordered: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray300,
  },
  measureLabel: { ...type.label, width: 40 },
  measureDesc: { flex: 1, fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.ink, letterSpacing: 0.28 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 12, backgroundColor: colors.black },
  measureValue: {
    fontFamily: font.medium,
    fontSize: 16,
    lineHeight: 20,
    color: colors.ink,
    letterSpacing: 0.28,
    width: 64,
    textAlign: 'right',
  },
  measureUnit: { fontSize: 16 },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 28,
  },
  feature: { alignItems: 'center' },
  featureIconBox: {
    width: 37,
    height: 37,
    borderRadius: 8,
    backgroundColor: '#E8EEFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: colors.ink, letterSpacing: 0.28 },
  featureDesc: { ...type.caption, marginTop: 4 },
  privacyNote: {
    ...type.bodyInk,
    textAlign: 'center',
    marginTop: 28,
  },
  cta: { marginHorizontal: 20, marginTop: 25 },
  loginRow: { alignItems: 'center', marginTop: 24 },
  loginText: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: colors.gray700 },
  loginLink: { color: colors.ink, textDecorationLine: 'underline' },
});
