import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import FitReportCard from '../components/FitReportCard';
import { getFitting, createFitting } from '../api/fittings';
import { colors, font } from '../theme';

/**
 * 핏 등급 → gaugeLevel 순서에서 gradeDistance 해석:
 * 양수면 실제가 더 헐렁
 */
function buildReportRows(report) {
  if (!report) return [];
  const rows = [];
  if (report.chestEase != null) {
    rows.push({
      label: '가슴',
      type: 'bar',
      barRatio: Math.min((report.gaugeLevel || 0) / 5, 1),
      value: `+${report.chestEase}`,
      unit: 'cm',
    });
  }
  if (report.shoulderDiff != null) {
    rows.push({
      label: '어깨',
      type: 'text',
      desc: report.shoulderDiff > 0 ? '드롭숄더로 떨어짐' : '어깨에 맞음',
      value: `+${report.shoulderDiff}`,
      unit: 'cm',
      highlight: report.shoulderDiff > 2,
    });
  }
  if (report.lengthLabel) {
    rows.push({ label: '기장', type: 'text', desc: report.lengthLabel });
  }
  if (report.sleeveLabel) {
    rows.push({ label: '소매', type: 'text', desc: report.sleeveLabel });
  }
  return rows;
}

/**
 * Figma: 06 생성 대기
 * 생성중(82:2477) / 실패(93:3441)
 */
export default function GenerationWaitingScreen({ navigation, route }) {
  const fitting = route?.params?.fitting;
  const [data, setData] = useState(fitting || null);
  const [status, setStatus] = useState(fitting?.status || '대기');
  const pollingRef = useRef(null);

  // 5초 간격 폴링
  const startPolling = useCallback((fittingId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const result = await getFitting(fittingId);
        setData(result);
        setStatus(result.status);

        if (result.status === '완료' || result.status === '리포트만') {
          clearInterval(pollingRef.current);
          navigation.replace('FittingResult', { fitting: result });
        } else if (result.status === '실패') {
          clearInterval(pollingRef.current);
        }
      } catch (e) {
        // 폴링 에러 무시 — 다음에 재시도
      }
    }, 5000);
  }, [navigation]);

  useEffect(() => {
    if (data?.id && (status === '대기' || status === '생성중')) {
      startPolling(data.id);
    }
    return () => clearInterval(pollingRef.current);
  }, [data?.id, status, startPolling]);

  const handleRetry = async () => {
    if (!data?.garment?.id) return;
    try {
      setStatus('대기');
      const result = await createFitting(data.garment.id);
      setData(result);
      setStatus(result.status);
      if (result.status === '대기' || result.status === '생성중') {
        startPolling(result.id);
      }
    } catch (e) {
      setStatus('실패');
    }
  };

  const report = data?.report;
  const reportRows = buildReportRows(report);
  const isWaiting = status === '대기' || status === '생성중';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {isWaiting ? (
          <View style={styles.hero}>
            <MaterialCommunityIcons name="timer-sand" size={26} color={colors.white} />
            <Text style={styles.heroTime}>약 2분 남음</Text>
            <View style={styles.heroTrack}>
              <View style={[styles.heroFill, { width: status === '생성중' ? '50%' : '10%' }]} />
            </View>
            <Text style={styles.heroGuide}>
              창을 닫아도 계속 만들어져요.{'\n'}다 되면 [내 피팅]에 담아둘게요.
            </Text>
          </View>
        ) : status === '실패' ? (
          <View style={styles.failBox}>
            <View style={styles.failIcon}>
              <Feather name="alert-circle" size={28} color="#E5484D" />
            </View>
            <Text style={styles.failTitle}>이미지 만들기에 실패했어요</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 핏 분석 결과 카드 */}
        {report && (
          <FitReportCard
            style={styles.report}
            showStatus={true}
            itemName={data?.garment ? `${data.garment.kind || ''} · ${data.garment.sizeName || ''}` : ''}
            grade={report.fitGrade}
            gradeDesc={
              report.preferredGrade
                ? report.gradeDistance > 0
                  ? `선호하시는 ${report.preferredGrade}보다 넉넉해요`
                  : report.gradeDistance < 0
                    ? `선호하시는 ${report.preferredGrade}보다 타이트해요`
                    : `선호하시는 ${report.preferredGrade}와 같아요`
                : ''
            }
            profileBadge={report.confidence === '추정' ? '추정 프로필 · 참고용' : '실측 프로필 · 신뢰도 높음'}
            rows={reportRows}
          />
        )}

        {/* 추천 박스 — gradeDistance > 0 이면 현재가 헐렁하다는 뜻 */}
        {report && report.gradeDistance !== 0 && isWaiting && (
          <>
            <View style={styles.recoBox}>
              <View style={styles.recoLeft}>
                <Text style={styles.recoTitle}>
                  {report.gradeDistance > 0
                    ? `선호하시는 ${report.preferredGrade}보다 한 단계 넉넉해요`
                    : `선호하시는 ${report.preferredGrade}보다 타이트해요`}
                </Text>
                {report.chestEase != null && (
                  <View style={styles.recoValueRow}>
                    <Text style={styles.recoLabel}>가슴 여유</Text>
                    <Text style={styles.recoValue}>+{report.chestEase}</Text>
                    <Text style={styles.recoUnit}>cm</Text>
                  </View>
                )}
              </View>
              <View style={styles.recoThumb}>
                <MaterialCommunityIcons name="tshirt-crew-outline" size={48} color={colors.gray500} />
              </View>
            </View>

            <TouchableOpacity style={styles.refitBtn} onPress={() => navigation.navigate('ClothingRegister')}>
              <Text style={styles.refitText}>다른 사이즈로 다시 피팅하기</Text>
            </TouchableOpacity>
          </>
        )}

        {/* 선호 핏 미설정 CTA */}
        {report?.showPreferenceCta && (
          <TouchableOpacity
            style={styles.refitBtn}
            onPress={() => navigation.navigate('ProfileStep2')}
          >
            <Text style={styles.refitText}>선호 핏 설정하기</Text>
          </TouchableOpacity>
        )}

        {/* 내 피팅 바로가기 */}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => navigation.navigate('MyFittings')}
        >
          <Text style={styles.historyLinkText}>내 피팅 보기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },
  hero: {
    height: 170,
    borderRadius: 4,
    backgroundColor: '#191C20',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroTime: { fontFamily: font.medium, fontSize: 20, lineHeight: 28, color: colors.white },
  heroTrack: {
    width: 214,
    height: 3,
    borderRadius: 12,
    backgroundColor: '#EBE7E7',
    overflow: 'hidden',
  },
  heroFill: { height: 3, borderRadius: 12, backgroundColor: '#A2CDFF' },
  heroGuide: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 19.5,
    letterSpacing: 0.12,
    color: '#AFB3B9',
    textAlign: 'center',
    opacity: 0.9,
  },
  failBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5484D',
    borderRadius: 4,
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  failIcon: { alignItems: 'center' },
  failTitle: { fontFamily: font.medium, fontSize: 18, lineHeight: 26, color: colors.black },
  retryBtn: {
    backgroundColor: '#14171B',
    borderRadius: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { fontFamily: font.medium, fontSize: 14, color: colors.white },
  report: { marginTop: 16 },
  recoBox: {
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 21,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recoLeft: { flex: 1, gap: 2 },
  recoTitle: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: '#2563EB' },
  recoValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  recoLabel: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: '#374151' },
  recoValue: { fontFamily: font.bold, fontSize: 24, lineHeight: 32, color: '#2563EB' },
  recoUnit: { fontFamily: font.bold, fontSize: 18, lineHeight: 28, color: '#2563EB' },
  recoThumb: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refitBtn: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#14171B',
    borderRadius: 4,
    paddingVertical: 18,
    alignItems: 'center',
  },
  refitText: { fontFamily: font.medium, fontSize: 18, lineHeight: 26, color: '#14171B' },
  historyLink: { marginTop: 24, alignItems: 'center' },
  historyLinkText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.gray500,
    textDecorationLine: 'underline',
  },
});
