import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { getFittings, getFitting, createFitting } from '../api/fittings';
import { useAuth } from '../contexts/AuthContext';
import { colors, font } from '../theme';

const FILTERS = ['전체', '완료', '분석 중', '실패'];

// UI 필터 → 서버 status 매핑
const FILTER_MAP = {
  '전체': null,
  '완료': '완료',       // 완료 + 리포트만 포함
  '분석 중': '생성중',   // 대기 + 생성중 포함
  '실패': '실패',
};

/**
 * 서버 status → UI 상태
 */
function toCardStatus(serverStatus) {
  if (serverStatus === '완료') return 'done';
  if (serverStatus === '리포트만') return 'reportOnly';
  if (serverStatus === '대기' || serverStatus === '생성중') return 'generating';
  if (serverStatus === '실패') return 'failed';
  return 'done';
}

/**
 * 날짜 포맷: "8월 9일"
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * Figma: 08 내 피팅
 * 목록(33:9784) / 빈 상태(33:9785)
 */
export default function MyFittingsScreen({ navigation }) {
  const { logout } = useAuth();
  const [filter, setFilter] = useState('전체');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);

  // 데이터 로드
  const loadData = useCallback(async (statusFilter) => {
    try {
      const serverStatus = FILTER_MAP[statusFilter];
      const result = await getFittings(serverStatus);
      setItems(result.items || []);
      // counts 는 필터 무관하게 항상 전체 기준
      setCounts(result.counts || {});
    } catch (e) {
      // 에러 무시 — 빈 목록 유지
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filter);
  }, [filter, loadData]);

  // 생성중인 항목 폴링 (5초)
  useEffect(() => {
    const generatingItems = items.filter(
      (it) => it.status === '대기' || it.status === '생성중'
    );
    if (generatingItems.length === 0) {
      clearInterval(pollingRef.current);
      return;
    }

    pollingRef.current = setInterval(async () => {
      let changed = false;
      const updated = await Promise.all(
        items.map(async (it) => {
          if (it.status !== '대기' && it.status !== '생성중') return it;
          try {
            const fresh = await getFitting(it.id);
            if (fresh.status !== it.status) changed = true;
            return fresh;
          } catch {
            return it;
          }
        })
      );
      if (changed) {
        setItems(updated);
        // counts도 새로고침
        try {
          const result = await getFittings(FILTER_MAP[filter]);
          setCounts(result.counts || {});
        } catch {}
      }
    }, 5000);

    return () => clearInterval(pollingRef.current);
  }, [items, filter]);

  // 화면 포커스 시 새로고침
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadData(filter);
    });
    return unsub;
  }, [navigation, filter, loadData]);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'EmailAuth' }] });
        },
      },
    ]);
  };

  const handleRetry = async (fitting) => {
    if (!fitting?.garment?.id) return;
    try {
      const result = await createFitting(fitting.garment.id);
      // 목록 새로고침
      loadData(filter);
      if (result.status === '대기' || result.status === '생성중') {
        navigation.navigate('GenerationWaiting', { fitting: result });
      }
    } catch (e) {
      Alert.alert('오류', e.message || '재시도에 실패했습니다.');
    }
  };

  // 필터 칩에 갯수 표시
  const getFilterLabel = (f) => {
    if (f === '전체') {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return total > 0 ? `전체 ${total}` : '전체';
    }
    if (f === '완료') {
      const c = (counts['완료'] || 0) + (counts['리포트만'] || 0);
      return c > 0 ? `완료 ${c}` : '완료';
    }
    if (f === '분석 중') {
      const c = (counts['대기'] || 0) + (counts['생성중'] || 0);
      return c > 0 ? `분석 중 ${c}` : '분석 중';
    }
    if (f === '실패') {
      const c = counts['실패'] || 0;
      return c > 0 ? `실패 ${c}` : '실패';
    }
    return f;
  };

  const renderCard = ({ item }) => {
    const cardStatus = toCardStatus(item.status);
    const report = item.report;
    const hasThumb = !!item.imageUrl;

    return (
      <View style={styles.card}>
        {/* 썸네일 */}
        <View style={[styles.thumb, cardStatus === 'failed' && styles.thumbFailed]}>
          {hasThumb ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons
              name={cardStatus === 'failed' ? 'image-off-outline' : 'tshirt-crew-outline'}
              size={cardStatus === 'failed' ? 25 : 36}
              color={cardStatus === 'failed' ? '#D32F2F' : colors.gray500}
            />
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.garment?.kind || '의류'}
            </Text>
            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
          </View>

          {/* 완료 / 리포트만 */}
          {(cardStatus === 'done' || cardStatus === 'reportOnly') && report && (
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>사이즈</Text>
                <Text style={styles.metaValue}>{item.garment?.sizeName || '-'}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>핏 등급</Text>
                <Text style={styles.metaValue}>{report.fitGrade || '-'}</Text>
              </View>
            </View>
          )}

          {/* 생성 중 */}
          {cardStatus === 'generating' && (
            <>
              <View style={styles.genRow}>
                <View style={styles.genBadge}>
                  <Feather name="refresh-cw" size={9} color={colors.ink} />
                  <Text style={styles.genBadgeText}>
                    {item.status === '대기' ? '대기 중' : '생성 중'}
                  </Text>
                </View>
                <Text style={styles.genRemain}>~2분 남음</Text>
              </View>
              <View style={styles.genTrack}>
                <View
                  style={[
                    styles.genFill,
                    { width: item.status === '생성중' ? '50%' : '10%' },
                  ]}
                />
              </View>
            </>
          )}

          {/* 실패 */}
          {cardStatus === 'failed' && (
            <>
              <View style={styles.failBadge}>
                <Text style={styles.failBadgeText}>사진 생성 실패</Text>
              </View>
              <View style={styles.failActions}>
                {report && (
                  <TouchableOpacity
                    style={styles.reportLink}
                    onPress={() => navigation.navigate('FittingResult', { fitting: item })}
                  >
                    <Text style={styles.reportLinkText}>리포트 보기</Text>
                    <Feather name="chevron-right" size={12} color="#878D96" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleRetry(item)}>
                  <Text style={styles.retryLink}>사진 재시도</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* 완료/리포트만 → 리포트 보기 */}
          {(cardStatus === 'done' || cardStatus === 'reportOnly') && (
            <TouchableOpacity
              style={styles.reportLink}
              onPress={() => navigation.navigate('FittingResult', { fitting: item })}
            >
              <Text style={styles.reportLinkText}>리포트 보기</Text>
              <Feather name="chevron-right" size={12} color="#878D96" />
            </TouchableOpacity>
          )}

          {/* 생성 중 → 탭하면 대기 화면 */}
          {cardStatus === 'generating' && (
            <TouchableOpacity
              style={styles.reportLink}
              onPress={() => navigation.navigate('GenerationWaiting', { fitting: item })}
            >
              <Text style={styles.reportLinkText}>진행 상황 보기</Text>
              <Feather name="chevron-right" size={12} color="#878D96" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {getFilterLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!loading && items.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="hanger" size={48} color={colors.gray300} />
          <Text style={styles.emptyTitle}>아직 피팅 기록이 없어요</Text>
          <Text style={styles.emptyDesc}>첫 옷을 등록하고 핏을 확인해 보세요</Text>
          <PrimaryButton
            title="새 옷 피팅하기"
            style={styles.emptyCta}
            onPress={() => navigation.navigate('ClothingRegister')}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      <View style={styles.bottomLinks}>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.bottomLink}>로그아웃</Text>
        </TouchableOpacity>
        <View style={styles.dot} />
        <TouchableOpacity>
          <Text style={styles.bottomLink}>계정 삭제</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  filterWrap: { paddingTop: 14 },
  filterRow: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#75777B',
    backgroundColor: colors.white,
  },
  filterChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.ink,
  },
  filterTextActive: { color: colors.white },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    padding: 17,
    minHeight: 130,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  thumb: {
    width: 80,
    height: 96,
    borderRadius: 4,
    backgroundColor: '#F1EDED',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbFailed: { backgroundColor: colors.white, borderWidth: 1, borderColor: '#FFDAD6' },
  thumbImage: { width: '100%', height: '100%' },
  cardBody: { flex: 1, justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 4 },
  cardTitle: { fontFamily: font.medium, fontSize: 20, lineHeight: 28, color: colors.black, flex: 1 },
  cardDate: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.28, color: '#878D96' },
  metaRow: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  metaCol: { flex: 1 },
  metaLabel: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0.12, color: '#878D96' },
  metaValue: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.28, color: colors.ink },
  reportLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reportLinkText: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.28, color: '#878D96' },
  genRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 },
  genBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBE7E7',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  genBadgeText: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.28, color: colors.ink },
  genRemain: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.28, color: colors.ink },
  genTrack: { height: 4, borderRadius: 12, backgroundColor: colors.gray200, overflow: 'hidden', marginTop: 4 },
  genFill: { height: 4, borderRadius: 12, backgroundColor: colors.blue },
  failBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D32F2F',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 8,
  },
  failBadgeText: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.28, color: colors.ink },
  failActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  retryLink: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: '#878D96',
    textDecorationLine: 'underline',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  emptyTitle: { fontFamily: font.medium, fontSize: 20, lineHeight: 28, color: colors.black, marginTop: 8 },
  emptyDesc: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.gray700 },
  emptyCta: { alignSelf: 'stretch', marginTop: 24 },
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 20,
  },
  bottomLink: {
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: colors.gray700,
    textDecorationLine: 'underline',
  },
  dot: { width: 4, height: 4, borderRadius: 12, backgroundColor: colors.gray300 },
});
