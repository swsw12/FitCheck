import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { ProgressBar, StepIndicator } from '../components/StepProgress';
import { getProfile, putProfile } from '../api/profile';
import { colors, font, type } from '../theme';

// 선호 핏: '너무 작음'은 경고이므로 선택지에서 제외
const FITS = ['슬림핏', '레귤러핏', '세미오버핏', '오버핏'];
const FIT_DISPLAY = { '슬림핏': '슬림', '레귤러핏': '레귤러', '세미오버핏': '세미오버', '오버핏': '오버핏' };

/** Figma: 03 프로필 2단계_초기.전부 추정 (39:993) */
export default function ProfileStep2Screen({ navigation, route }) {
  // route.params 로 넘어온 값 (ProfileStep1 에서 올 때)
  const paramGender = route?.params?.gender;
  const paramHeight = route?.params?.height;
  const paramWeight = route?.params?.weight;

  // 서버 프로필 기반 state — params 없이 진입 시에도 안전
  const [bodyGender, setBodyGender] = useState(paramGender || null);
  const [bodyHeight, setBodyHeight] = useState(paramHeight || null);
  const [bodyWeight, setBodyWeight] = useState(paramWeight || null);

  const [measures, setMeasures] = useState([
    { key: 'shoulder', label: '어깨너비', value: '', source: '추정' },
    { key: 'chest', label: '가슴둘레', value: '', source: '추정' },
    { key: 'waist', label: '허리둘레', value: '', source: '추정' },
    { key: 'arm', label: '팔길이', value: '', source: '추정' },
  ]);
  const [fit, setFit] = useState(null);
  const [accuracy, setAccuracy] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState(null);

  // 기존 프로필이 있으면 치수 + 신체정보 로드
  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          // params 없이 진입한 경우 서버 값으로 채우기
          if (!paramGender && profile.gender) setBodyGender(profile.gender);
          if (!paramHeight && profile.height) setBodyHeight(profile.height);
          if (!paramWeight && profile.weight) setBodyWeight(profile.weight);

          if (profile.measurements) {
            const m = profile.measurements;
            setMeasures((prev) =>
              prev.map((item) => {
                const server = m[item.key];
                if (server) {
                  return { ...item, value: String(server.value), source: server.source };
                }
                return item;
              })
            );
          }
          if (profile.accuracy != null) setAccuracy(profile.accuracy);
          if (profile.preferredGrade) setFit(profile.preferredGrade);
        }
      } catch (e) {
        // 프로필 없으면 무시 — 추정값으로 시작
      }
    })();
  }, []);

  const measuredCount = measures.filter((m) => m.source === '실측').length;
  const displayAccuracy = Math.max(accuracy, measuredCount);

  const handleSave = async () => {
    // PUT /profile 은 전체 교체 — 키/몸무게가 비면 서버 프로필이 지워진다.
    // (params 없이 진입 후 프로필 로드 전에 저장을 누른 경우 방어)
    if (bodyHeight == null || bodyWeight == null) {
      Alert.alert('잠시만요', '프로필 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const measurements = {};
      measures.forEach((m) => {
        if (m.value) {
          measurements[m.key] = {
            value: parseFloat(m.value),
            source: m.source,
          };
        }
      });

      const body = {
        height: bodyHeight,
        weight: bodyWeight,
        gender: bodyGender,
        measurements,
      };
      if (fit) body.preferredGrade = fit;

      const result = await putProfile(body);

      // 서버가 추정값을 채워서 돌려주면 반영
      if (result?.measurements) {
        setMeasures((prev) =>
          prev.map((item) => {
            const server = result.measurements[item.key];
            if (server) {
              return { ...item, value: String(server.value), source: server.source };
            }
            return item;
          })
        );
      }
      if (result?.accuracy != null) setAccuracy(result.accuracy);

      navigation.navigate('BodyPhotoUpload');
    } catch (e) {
      Alert.alert('오류', e.message || '프로필 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditValue = (key, newValue) => {
    setMeasures((prev) =>
      prev.map((m) =>
        m.key === key
          ? { ...m, value: newValue.replace(/[^0-9.]/g, ''), source: '실측' }
          : m
      )
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <ProgressBar step={2} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <StepIndicator step={2} />
        <Text style={[type.h1, styles.title]}>더 정확하게 만들어 볼까요?</Text>
        <Text style={[type.body, styles.desc]}>직접 잰 치수를 넣을수록 핏 계산이 정확해져요.</Text>

        {/* 정확도 게이지 */}
        <View style={styles.gauge}>
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeTitle}>정확도 {displayAccuracy}/5</Text>
            <Feather name="info" size={15} color={colors.gray700} />
          </View>
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeFill, { width: `${(displayAccuracy / 5) * 100}%` }]} />
          </View>
        </View>

        {/* 치수 리스트 */}
        <View style={styles.list}>
          {measures.map((m) => (
            <View key={m.key} style={styles.listItem}>
              <View style={styles.listLeft}>
                <Text style={styles.listLabel}>{m.label}</Text>
                <View style={[styles.badge, m.source === '실측' && styles.badgeMeasured]}>
                  <Text style={[styles.badgeText, m.source === '실측' && styles.badgeTextMeasured]}>
                    {m.source}
                  </Text>
                </View>
              </View>
              {editingKey === m.key ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={m.value}
                    onChangeText={(v) => handleEditValue(m.key, v)}
                    keyboardType="decimal-pad"
                    autoFocus
                    onBlur={() => setEditingKey(null)}
                  />
                  <Text style={styles.listUnit}>cm</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.listRight} onPress={() => setEditingKey(m.key)}>
                  <Text style={styles.listValue}>
                    {m.value || '--'} <Text style={styles.listUnit}>cm</Text>
                  </Text>
                  <Feather name="edit-2" size={15} color={colors.gray700} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* 선호 핏 */}
        <Text style={styles.fitLabel}>선호하는 핏 (선택)</Text>
        <View style={styles.fitGrid}>
          {FITS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.fitBtn, fit === f && styles.fitBtnActive]}
              onPress={() => setFit(fit === f ? null : f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.fitText, fit === f && styles.fitTextActive]}>
                {FIT_DISPLAY[f] || f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.laterRow} onPress={() => navigation.navigate('BodyPhotoUpload')}>
          <Text style={styles.laterText}>나중에 입력할게요</Text>
        </TouchableOpacity>

        <PrimaryButton
          title={loading ? '저장 중...' : '다음'}
          disabled={loading}
          style={styles.cta}
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },
  title: { marginTop: 4 },
  desc: { marginTop: 12 },
  gauge: {
    marginTop: 24,
    backgroundColor: '#F6F3F3',
    borderWidth: 1,
    borderColor: 'rgba(197,198,202,0.3)',
    borderRadius: 8,
    padding: 17,
    gap: 12,
  },
  gaugeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gaugeTitle: { fontFamily: font.bold, fontSize: 14, lineHeight: 20, letterSpacing: 0.28, color: colors.black },
  gaugeTrack: { height: 8, borderRadius: 12, backgroundColor: colors.gray200, overflow: 'hidden' },
  gaugeFill: { height: 8, borderRadius: 12, backgroundColor: colors.black },
  list: { marginTop: 16 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  listLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  listLabel: { fontFamily: font.medium, fontSize: 14, lineHeight: 24, color: colors.ink },
  badge: {
    backgroundColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeMeasured: { backgroundColor: '#DBEAFE' },
  badgeText: { fontFamily: font.medium, fontSize: 12, lineHeight: 20, letterSpacing: 0.28, color: '#878D96' },
  badgeTextMeasured: { color: '#2563EB' },
  listRight: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 4 },
  listValue: { fontFamily: font.semibold, fontSize: 20, lineHeight: 28, color: colors.ink },
  listUnit: { fontFamily: font.medium, fontSize: 14, letterSpacing: 0.28, color: '#878D96' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editInput: {
    width: 60,
    fontFamily: font.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.navy,
    textAlign: 'right',
    padding: 0,
  },
  fitLabel: { marginTop: 24, fontFamily: font.medium, fontSize: 14, lineHeight: 24, color: colors.ink },
  fitGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fitBtn: {
    width: '47.8%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fitBtnActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  fitText: { fontFamily: font.medium, fontSize: 14, lineHeight: 24, color: colors.ink },
  fitTextActive: { color: colors.white },
  laterRow: { alignItems: 'center', marginTop: 24 },
  laterText: {
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: '#878D96',
    textDecorationLine: 'underline',
  },
  cta: { marginTop: 16 },
});
