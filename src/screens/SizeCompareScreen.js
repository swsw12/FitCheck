import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { compareFittings } from '../api/fittings';
import { colors, font, type } from '../theme';

/**
 * Figma: 10 사이즈 비교
 * 둘 다 완료(104:5523) / 이미지 없음(104:5735) / 한쪽 생성 중(33:9786)
 *
 * route.params:
 *   garmentId — 기준 의류 ID (FittingResult 에서 전달)
 *   garmentName — 의류 이름 (화면 상단 표시용)
 *   garmentIds — [id1, id2] 직접 전달 시
 */
export default function SizeCompareScreen({ navigation, route }) {
  const { garmentId, garmentName, garmentIds: paramIds } = route?.params || {};

  const [sizes, setSizes] = useState([]);
  const [recommendedSize, setRecommendedSize] = useState(null);
  const [itemName, setItemName] = useState(garmentName || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const ids = paramIds || (garmentId ? [garmentId] : []);
      if (ids.length === 0) {
        setError('비교할 의류가 없습니다.');
        setLoading(false);
        return;
      }
      const result = await compareFittings(ids);
      setSizes(result.sizes || []);
      setRecommendedSize(result.recommendedSize || null);
      // 이름이 없으면 첫 번째에서 가져옴
      if (!itemName && result.sizes?.[0]?.garment?.kind) {
        setItemName(result.sizes[0].garment.kind);
      }
    } catch (e) {
      setError(e.message || '비교 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppHeader onBack={() => navigation.goBack()} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppHeader onBack={() => navigation.goBack()} />
        <View style={styles.loadingBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderImage = (sizeData) => {
    const isRecommended = sizeData.sizeName === recommendedSize;
    const isGenerating = sizeData.status === '대기' || sizeData.status === '생성중';
    const hasImage = !!sizeData.imageUrl;

    return (
      <View style={[styles.imageCol, isRecommended ? styles.imageColRecommended : styles.imageColDefault]}>
        <View style={styles.imageArea}>
          {isGenerating ? (
            <View style={styles.generating}>
              <ActivityIndicator size="small" color={colors.gray500} />
              <Text style={styles.generatingText}>생성 중{'\n'}약 2분</Text>
            </View>
          ) : hasImage ? (
            <Image source={{ uri: sizeData.imageUrl }} style={styles.sizeImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="account-outline" size={48} color={colors.gray300} />
            </View>
          )}
        </View>
        <View style={styles.sizeLabelBox}>
          <Text style={styles.sizeLabel}>Size {sizeData.sizeName}</Text>
        </View>
      </View>
    );
  };

  const renderReport = (sizeData) => {
    const report = sizeData.report;
    const isRecommended = sizeData.sizeName === recommendedSize;
    if (!report) return <View style={styles.reportCard} />;

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportKey}>핏 등급</Text>
          <Text style={styles.reportKey}>{report.fitGrade || '-'}</Text>
        </View>
        {report.chestEase != null && (
          <View style={styles.gauge}>
            <View style={styles.gaugeTop}>
              <Text style={styles.gaugeLabel}>가슴 여유량</Text>
              <Text style={styles.gaugeValue}>+{report.chestEase}cm</Text>
            </View>
            <View style={styles.gaugeTrack}>
              <View
                style={[
                  styles.gaugeFill,
                  { width: `${Math.min((report.gaugeLevel || 0) / 5, 1) * 100}%` },
                  { backgroundColor: isRecommended ? colors.blue : '#75777B' },
                ]}
              />
            </View>
          </View>
        )}
        {report.lengthLabel && (
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>총장</Text>
            <Text style={styles.detailValue}>{report.lengthLabel}</Text>
          </View>
        )}
        {report.sleeveLabel && (
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>소매기장</Text>
            <Text style={styles.detailValue}>{report.sleeveLabel}</Text>
          </View>
        )}
      </View>
    );
  };

  // 이미지 없는 사이즈가 있는지 확인
  const allHaveImages = sizes.every((s) => !!s.imageUrl);
  const noneHaveImages = sizes.every((s) => !s.imageUrl && s.status !== '대기' && s.status !== '생성중');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={type.h1}>사이즈 비교</Text>
        {itemName ? <Text style={[type.body, styles.itemName]}>{itemName}</Text> : null}

        {/* 이미지 비교 영역 */}
        {sizes.length >= 2 && !noneHaveImages && (
          <View style={styles.compareRow}>
            {sizes.slice(0, 2).map((s) => (
              <React.Fragment key={s.sizeName || s.garmentId}>
                {renderImage(s)}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* 이미지 없으면 사이즈 탭만 */}
        {sizes.length >= 2 && noneHaveImages && (
          <View style={styles.compareRow}>
            {sizes.slice(0, 2).map((s) => (
              <View
                key={s.sizeName || s.garmentId}
                style={[
                  styles.sizeTab,
                  s.sizeName === recommendedSize ? styles.sizeTabRecommended : styles.sizeTabDefault,
                ]}
              >
                <Text style={styles.sizeLabel}>Size {s.sizeName}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 리포트 비교 */}
        {sizes.length >= 2 && (
          <View style={styles.compareRow}>
            {sizes.slice(0, 2).map((s) => (
              <React.Fragment key={`report-${s.sizeName || s.garmentId}`}>
                {renderReport(s)}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* 추천 */}
        {recommendedSize && (
          <View style={styles.recommend}>
            <Text style={styles.recommendTitle}>{recommendedSize} 사이즈를 추천드려요</Text>
            {sizes.find((s) => s.sizeName === recommendedSize)?.report?.fitGrade && (
              <Text style={styles.recommendDesc}>
                {sizes.find((s) => s.sizeName === recommendedSize).report.fitGrade}에 가까운 편안한 핏이에요.
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('ClothingRegister')}>
          <Feather name="plus" size={16} color={colors.black} />
          <Text style={styles.addBtnText}>다른 사이즈 추가하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 17, paddingTop: 24, paddingBottom: 32 },
  itemName: { marginTop: 12 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: font.regular, fontSize: 14, color: colors.gray700, textAlign: 'center' },
  compareRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  imageCol: { flex: 1, borderRadius: 4, overflow: 'hidden' },
  imageColRecommended: { borderWidth: 2, borderColor: colors.blue },
  imageColDefault: { borderWidth: 1, borderColor: colors.gray300 },
  imageArea: { aspectRatio: 1024 / 1536, backgroundColor: '#F1EDED' },
  sizeImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  generating: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C3C6C9',
  },
  generatingText: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.gray700,
    textAlign: 'center',
  },
  sizeLabelBox: {
    height: 54,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  sizeLabel: {
    fontFamily: font.regular,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: colors.black,
  },
  sizeTab: {
    flex: 1,
    height: 54,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  sizeTabRecommended: { borderWidth: 2, borderColor: colors.blue },
  sizeTabDefault: { borderWidth: 1, borderColor: colors.gray300 },
  reportCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 17,
    gap: 16,
    backgroundColor: colors.white,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE7E7',
  },
  reportKey: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.gray700,
  },
  gauge: { gap: 4 },
  gaugeTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  gaugeLabel: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700 },
  gaugeValue: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.28, color: colors.ink },
  gaugeTrack: { height: 8, borderRadius: 12, backgroundColor: colors.gray200, overflow: 'hidden' },
  gaugeFill: { height: 8, borderRadius: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailKey: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700 },
  detailValue: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700 },
  recommend: { marginTop: 28, alignItems: 'center', gap: 4 },
  recommendTitle: { fontFamily: font.semibold, fontSize: 16, lineHeight: 24, color: '#2563EB' },
  recommendDesc: { fontFamily: font.regular, fontSize: 14, lineHeight: 24, color: colors.gray700 },
  addBtn: {
    marginTop: 28,
    height: 60,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: { fontFamily: font.medium, fontSize: 20, lineHeight: 24, color: colors.black },
});
