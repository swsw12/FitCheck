import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import FitReportCard from '../components/FitReportCard';
import { colors, font } from '../theme';

/**
 * report → FitReportCard rows 변환
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
 * Figma: 07 결과
 * 기본(93:3443) / 사진 없음(33:9779) / 추정 프로필(93:3586) / 선호 핏 미설정(99:3823)
 *
 * route.params.fitting — API 피팅 객체 (GenerationWaiting / MyFittings 에서 전달)
 */
export default function FittingResultScreen({ navigation, route }) {
  const fitting = route?.params?.fitting;
  const report = fitting?.report;
  const reportRows = buildReportRows(report);

  // 상태 판별
  const isNoPhoto = fitting?.status === '리포트만';
  const isEstimated = report?.confidence === '추정';
  const hasImage = !isNoPhoto && !!fitting?.imageUrl;

  // 의류 이름 + 사이즈 라벨
  const garment = fitting?.garment;
  const itemLabel = garment
    ? `${garment.kind || ''} · ${garment.sizeName || ''}`.replace(/^ · | · $/g, '')
    : '';

  // gradeDesc 생성 — preferredGrade 없으면 빈 문자열
  const gradeDesc = report && report.preferredGrade
    ? report.gradeDistance > 0
      ? `선호하시는 ${report.preferredGrade}보다 한 단계 넉넉해요`
      : report.gradeDistance < 0
        ? `선호하시는 ${report.preferredGrade}보다 타이트해요`
        : `선호하시는 ${report.preferredGrade}와 같아요`
    : '';

  // 프로필 뱃지 텍스트
  const profileBadge = isEstimated
    ? '추정 프로필 · 참고용'
    : '실측 프로필 · 신뢰도 높음';

  // 추천 사이즈 정보
  const reco = report?.recommendation;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* AI 착용 이미지 */}
        {hasImage ? (
          <View style={styles.imageBox}>
            <Image source={{ uri: fitting.imageUrl }} style={styles.aiImage} resizeMode="cover" />
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
        ) : isNoPhoto ? null : (
          <View style={styles.imageBox}>
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="account-outline" size={64} color={colors.gray300} />
              <Text style={styles.imagePlaceholderText}>AI 착용 이미지</Text>
            </View>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
        )}

        {/* 핏 리포트 */}
        {report && (
          <FitReportCard
            showStatus={false}
            style={styles.report}
            itemName={itemLabel}
            grade={report.fitGrade}
            gradeDesc={gradeDesc}
            profileBadge={profileBadge}
            rows={reportRows}
          />
        )}

        {/* 추정 프로필 안내 */}
        {isEstimated && (
          <>
            <Text style={styles.estimateNote}>키 · 몸무게 기반 추정 · 참고용</Text>
            <TouchableOpacity
              style={styles.outlineWide}
              onPress={() => navigation.navigate('ProfileStep2')}
            >
              <Text style={styles.outlineWideText}>직접 잰 치수 넣기</Text>
            </TouchableOpacity>
          </>
        )}

        {!isEstimated && (
          <>
            {/* 추천 박스 — 다른 사이즈 추천이 있을 때 */}
            {reco && (
              <View style={styles.recoBox}>
                <View style={styles.recoLeft}>
                  <Text style={styles.recoTitle}>{reco.sizeName} 사이즈라면</Text>
                  {reco.chestEase != null && (
                    <View style={styles.recoValueRow}>
                      <Text style={styles.recoLabel}>가슴 여유</Text>
                      <Text style={styles.recoValue}>+{reco.chestEase}</Text>
                      <Text style={styles.recoUnit}>cm</Text>
                    </View>
                  )}
                  {reco.fitGrade && (
                    <View style={styles.recoNoteRow}>
                      <Feather name="corner-down-right" size={12} color="#1F2937" />
                      <Text style={styles.recoNote}>{reco.fitGrade}에 가까워져요</Text>
                    </View>
                  )}
                </View>
                <View style={styles.recoThumb}>
                  <MaterialCommunityIcons name="tshirt-crew-outline" size={48} color={colors.gray500} />
                </View>
              </View>
            )}

            {reco && (
              <TouchableOpacity style={styles.outlineWide} onPress={() => navigation.navigate('ClothingRegister')}>
                <Text style={styles.outlineWideText}>{reco.sizeName} 사이즈로 다시 피팅하기</Text>
              </TouchableOpacity>
            )}

            {/* 사진 없음 상태: 사진 올리기 유도 */}
            {isNoPhoto && (
              <View style={styles.photoHintRow}>
                <Text style={styles.photoHintText}>사진을 올리면 착용 모습도 볼 수 있어요</Text>
                <Text style={styles.photoHintDot}> · </Text>
                <TouchableOpacity onPress={() => navigation.navigate('BodyPhotoUpload')}>
                  <Text style={styles.photoHintLink}>사진 올리기</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 선호 핏 미설정 CTA */}
            {report?.showPreferenceCta && (
              <TouchableOpacity
                style={styles.outlineWide}
                onPress={() => navigation.navigate('ProfileStep2')}
              >
                <Text style={styles.outlineWideText}>선호 핏 설정하기</Text>
              </TouchableOpacity>
            )}

            {/* 하단 버튼 2종 */}
            <View style={styles.bottomRow}>
              <TouchableOpacity
                style={styles.halfBtn}
                onPress={() => navigation.navigate('SizeCompare', {
                  garmentId: garment?.id,
                  garmentName: garment?.kind,
                })}
              >
                <Text style={styles.halfBtnText}>사이즈 비교</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.halfBtn}
                onPress={() => navigation.navigate('ClothingRegister')}
              >
                <Text style={styles.halfBtnText}>새 옷 피팅</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 내 피팅으로 이동 */}
        <TouchableOpacity style={styles.historyLink} onPress={() => navigation.navigate('MyFittings')}>
          <Text style={styles.historyLinkText}>내 피팅 보기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },
  imageBox: {
    height: 462,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    backgroundColor: '#F1EDED',
    overflow: 'hidden',
  },
  aiImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePlaceholderText: { fontFamily: font.regular, fontSize: 13, color: colors.gray500 },
  aiBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#878787',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: { fontFamily: font.medium, fontSize: 12, color: colors.white },
  report: { marginTop: 16 },
  estimateNote: {
    marginTop: 20,
    textAlign: 'center',
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: colors.gray500,
  },
  recoBox: {
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 4,
    paddingHorizontal: 21,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recoLeft: { gap: 2 },
  recoTitle: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: '#2563EB' },
  recoValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  recoLabel: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: '#374151' },
  recoValue: { fontFamily: font.bold, fontSize: 24, lineHeight: 32, color: '#2563EB' },
  recoUnit: { fontFamily: font.bold, fontSize: 18, lineHeight: 28, color: '#2563EB' },
  recoNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recoNote: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: '#1F2937' },
  recoThumb: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineWide: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#14171B',
    borderRadius: 4,
    paddingVertical: 17,
    alignItems: 'center',
  },
  outlineWideText: { fontFamily: font.medium, fontSize: 20, lineHeight: 28, color: colors.navy },
  photoHintRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHintText: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.ink },
  photoHintDot: { fontFamily: font.regular, fontSize: 14, color: colors.ink },
  photoHintLink: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  bottomRow: { marginTop: 16, flexDirection: 'row', gap: 22 },
  halfBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    paddingVertical: 13,
    alignItems: 'center',
  },
  halfBtnText: { fontFamily: font.medium, fontSize: 14, lineHeight: 24, color: colors.ink },
  historyLink: { marginTop: 24, alignItems: 'center' },
  historyLinkText: {
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.gray500,
    textDecorationLine: 'underline',
  },
});
