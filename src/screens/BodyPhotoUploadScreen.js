import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { ProgressBar, StepIndicator } from '../components/StepProgress';
import { uploadProfilePhoto } from '../api/photos';
import { colors, font, type } from '../theme';

const GUIDES = [
  { icon: 'user', label: '정면 촬영' },
  { icon: 'human-male', label: '머리부터 발끝까지', mc: true },
  { icon: 'human-handsup', label: '팔을 살짝 벌리고', mc: true },
  { icon: 'sun', label: '밝은 조명 아래서' },
];

/**
 * Figma: 04 전신사진업로드
 * 상태: 기본(50:1175) / 검증 중(51:1602) / 검증 실패(64:1073) / 통과(64:995)
 */
export default function BodyPhotoUploadScreen({ navigation }) {
  // status: 'empty' | 'uploading' | 'failed' | 'passed'
  const [status, setStatus] = useState('empty');
  const [photo, setPhoto] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const doUpload = async (uri) => {
    setPhoto(uri);
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    // 진행률 애니메이션 (실제 업로드와 병행)
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 3 : p));
    }, 100);

    try {
      await uploadProfilePhoto(uri);
      clearInterval(timerRef.current);
      setProgress(100);
      setStatus('passed');
    } catch (e) {
      clearInterval(timerRef.current);
      setProgress(0);
      setStatus('failed');
      if (e.code === 'PHOTO_TOO_SMALL') {
        setErrorMsg('사진이 너무 작아요. 최소 512×768 이상이어야 합니다.');
      } else if (e.code === 'PHOTO_FORMAT') {
        setErrorMsg('JPG, PNG, WEBP 형식만 지원해요.');
      } else if (e.code === 'PHOTO_TOO_LARGE') {
        setErrorMsg('사진이 10MB를 초과했어요.');
      } else {
        setErrorMsg(e.message || '사진 업로드에 실패했습니다.');
      }
    }
  };

  const pickImage = async () => {
    const { status: perm } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한을 허용해 주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled) doUpload(result.assets[0].uri);
  };

  const heading =
    status === 'uploading' ? '사진을 분석하고 있어요'
    : status === 'failed' ? '사진을 다시 확인해 주세요'
    : status === 'passed' ? '사진 업로드가 완료되었어요'
    : '전신 사진을 올려주세요';

  const subText =
    status === 'uploading' ? 'AI가 체형 데이터를 확인하고 있습니다.\n잠시만 기다려 주세요.'
    : status === 'failed' ? (errorMsg || '머리부터 발끝까지 나오게 다시 찍어주세요')
    : status === 'passed' ? null
    : '정확한 체형 분석을 위해 아래 가이드에 맞는 사진 한 장이 필요합니다';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <ProgressBar step={3} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <StepIndicator step={3} />
        <Text style={[type.h1, styles.title]}>{heading}</Text>
        {subText && <Text style={[type.body, styles.desc]}>{subText}</Text>}

        {status === 'empty' && (
          <>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.8}>
              <Feather name="image" size={18} color={colors.gray700} />
              <Text style={styles.uploadText}>여기를 눌러 사진 선택하기</Text>
            </TouchableOpacity>

            <View style={styles.guideGrid}>
              {GUIDES.map((g) => (
                <View key={g.label} style={styles.guideCell}>
                  <View style={styles.guideIcon}>
                    {g.mc ? (
                      <MaterialCommunityIcons name={g.icon} size={22} color={colors.ink} />
                    ) : (
                      <Feather name={g.icon} size={20} color={colors.ink} />
                    )}
                  </View>
                  <Text style={styles.guideLabel}>{g.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {status !== 'empty' && (
          <>
            <View
              style={[
                styles.previewBox,
                status === 'failed' && styles.previewFailed,
                status === 'passed' && styles.previewPassed,
              ]}
            >
              {photo && <Image source={{ uri: photo }} style={styles.previewImage} resizeMode="cover" />}
              {status === 'uploading' && (
                <View style={styles.analyzeOverlay}>
                  <View style={styles.analyzeCard}>
                    <View style={styles.analyzeRow}>
                      <Text style={styles.analyzeLabel}>분석 완료 대기 중</Text>
                      <Text style={styles.analyzePct}>{progress}%</Text>
                    </View>
                    <View style={styles.analyzeTrack}>
                      <View style={[styles.analyzeFill, { width: `${progress}%` }]} />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {(status === 'failed' || status === 'passed') && (
              <View style={styles.resultRow}>
                <View style={[styles.resultBadge, status === 'passed' ? styles.badgePass : styles.badgeFail]}>
                  <Feather name={status === 'passed' ? 'check-circle' : 'x-circle'} size={14} color={colors.white} />
                  <Text style={styles.resultBadgeText}>
                    {status === 'passed' ? '업로드 완료' : '업로드 실패'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.retakeBtn} onPress={pickImage}>
                  <Feather name="rotate-cw" size={13} color={colors.ink} />
                  <Text style={styles.retakeText}>다시 찍기</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.bottom}>
          {status !== 'failed' && (
            <View style={styles.privacyRow}>
              <Feather name="info" size={13} color="#878D96" />
              <Text style={styles.privacyText}>사진은 30일 후 자동 삭제되고, AI 학습에 쓰지 않아요</Text>
            </View>
          )}
          <PrimaryButton
            title="다음"
            variant={status === 'passed' || status === 'failed' ? 'primary' : 'disabled'}
            onPress={() => navigation.navigate('ClothingRegister')}
          />
          <PrimaryButton
            title="사진 없이 핏 정보만 볼게요"
            variant="outline"
            textStyle={{ color: colors.navy }}
            onPress={() => navigation.navigate('ClothingRegister', { noPhoto: true })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36 },
  title: { marginTop: 4 },
  desc: { marginTop: 12 },
  uploadBox: {
    marginTop: 24,
    height: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray300,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadText: { fontFamily: font.medium, fontSize: 16, lineHeight: 24, color: colors.gray700 },
  guideGrid: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  guideCell: {
    width: '48.2%',
    height: 122,
    borderWidth: 1,
    borderColor: 'rgba(197,198,202,0.3)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  guideIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideLabel: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.ink,
  },
  previewBox: {
    marginTop: 24,
    height: 300,
    borderRadius: 4,
    backgroundColor: colors.gray200,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  previewFailed: { borderWidth: 2, borderColor: colors.error },
  previewPassed: { borderWidth: 2, borderColor: '#2ECC40' },
  previewImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  analyzeOverlay: { paddingHorizontal: 24 },
  analyzeCard: {
    backgroundColor: 'rgba(250,250,253,0.95)',
    borderRadius: 4,
    padding: 16,
    gap: 10,
  },
  analyzeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  analyzeLabel: { fontFamily: font.regular, fontSize: 13, color: colors.ink },
  analyzePct: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  analyzeTrack: { height: 3, backgroundColor: colors.gray200, borderRadius: 2, overflow: 'hidden' },
  analyzeFill: { height: 3, backgroundColor: colors.navy },
  resultRow: { marginTop: 16, flexDirection: 'row', gap: 12 },
  resultBadge: {
    flex: 1,
    height: 44,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  badgePass: { backgroundColor: '#2ECC40' },
  badgeFail: { backgroundColor: '#E5484D' },
  resultBadgeText: { fontFamily: font.medium, fontSize: 14, color: colors.white },
  retakeBtn: {
    paddingHorizontal: 18,
    height: 44,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retakeText: { fontFamily: font.medium, fontSize: 14, color: colors.ink },
  bottom: { marginTop: 'auto', paddingTop: 28, gap: 16 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  privacyText: {
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: '#878D96',
  },
});
