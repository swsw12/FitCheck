import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { ProgressBar, StepIndicator } from '../components/StepProgress';
import { getProfile } from '../api/profile';
import { colors, font, type } from '../theme';

const GENDERS = ['남성', '여성', '밝히지 않음'];

/**
 * Figma: 02 프로필 1단계
 * - 빈 값 (32:8676) / 전부 입력 (33:9153) / 범위 초과 (33:9298) 상태 포함
 */
export default function ProfileStep1Screen({ navigation }) {
  const [gender, setGender] = useState(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // 기존 프로필이 있으면 채우기
  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          if (profile.gender) setGender(profile.gender);
          if (profile.height) setHeight(String(profile.height));
          if (profile.weight) setWeight(String(profile.weight));
        }
      } catch (e) {
        // PROFILE_NOT_FOUND → 신규 사용자, 무시
      }
    })();
  }, []);

  const h = parseInt(height, 10);
  const w = parseInt(weight, 10);
  const heightError = height !== '' && (isNaN(h) || h < 100 || h > 220)
    ? '키는 100~220cm 사이로 입력해 주세요' : null;
  const weightError = weight !== '' && (isNaN(w) || w < 20 || w > 200)
    ? '몸무게는 20~200kg 사이로 입력해 주세요' : null;
  const valid = gender && height && weight && !heightError && !weightError;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <ProgressBar step={1} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <StepIndicator step={1} />
          <Text style={[type.h1, styles.title]}>내 몸 정보를 알려주세요</Text>
          <Text style={[type.body, styles.desc]}>3개만 입력하면 나머지는 자동으로 채워드려요</Text>

          {/* 성별 */}
          <Text style={styles.fieldLabel}>성별</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                onPress={() => setGender(g)}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 키 */}
          <Text style={styles.fieldLabel}>키</Text>
          <View style={[styles.unitBox, heightError && styles.unitBoxError]}>
            <TextInput
              style={styles.unitInput}
              value={height}
              onChangeText={(t) => setHeight(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.unitText}>cm</Text>
          </View>
          {heightError && <Text style={styles.errorText}>{heightError}</Text>}

          {/* 몸무게 */}
          <Text style={styles.fieldLabel}>몸무게</Text>
          <View style={[styles.unitBox, weightError && styles.unitBoxError]}>
            <TextInput
              style={styles.unitInput}
              value={weight}
              onChangeText={(t) => setWeight(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.unitText}>kg</Text>
          </View>
          {weightError && <Text style={styles.errorText}>{weightError}</Text>}

          <View style={styles.bottom}>
            <View style={styles.privacyRow}>
              <Feather name="info" size={13} color="#878D96" />
              <Text style={styles.privacyText}>체형 평균값 계산에만 사용해요</Text>
            </View>
            <PrimaryButton
              title="다음"
              variant={valid ? 'primary' : 'disabled'}
              onPress={() => navigation.navigate('ProfileStep2', { gender, height: h, weight: w })}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  body: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { marginTop: 4 },
  desc: { marginTop: 12 },
  fieldLabel: {
    marginTop: 20,
    marginBottom: 4,
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.gray700,
  },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderBtnActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  genderText: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.gray700,
  },
  genderTextActive: { color: colors.white },
  unitBox: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitBoxError: { borderColor: colors.error },
  unitInput: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 14,
    letterSpacing: 0.28,
    color: colors.black,
    padding: 0,
  },
  unitText: {
    fontFamily: font.medium,
    fontSize: 14,
    letterSpacing: 0.28,
    color: '#878D96',
  },
  errorText: {
    marginTop: 6,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray700,
  },
  bottom: { marginTop: 'auto', paddingTop: 32, paddingBottom: 36, gap: 16 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  privacyText: {
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: '#878D96',
  },
});
