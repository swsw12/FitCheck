import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { ProgressBar, StepIndicator } from '../components/StepProgress';
import { createGarment } from '../api/garments';
import { uploadGarmentPhoto } from '../api/photos';
import { createFitting } from '../api/fittings';
import { colors, font, type } from '../theme';

// kind: 서버가 허용하는 5종 (후드→후디로 맞춤)
const CATEGORIES = [
  { display: '티셔츠', api: '티셔츠' },
  { display: '셔츠', api: '셔츠' },
  { display: '니트', api: '니트' },
  { display: '후디', api: '후디' },
  { display: '맨투맨', api: '맨투맨' },
];

const STRETCH_OPTIONS = ['좋음', '약간', '없음'];

const LIMITS = {
  chest: { max: 80, label: '가슴단면', msg: '가슴단면이 너무 커요. 상품 실측이 맞는지 확인해 주세요.' },
  shoulder: { max: 70, label: '어깨너비', msg: '어깨너비가 너무 커요. 상품 실측이 맞는지 확인해 주세요.' },
  length: { max: 120, label: '총장', msg: '총장이 너무 길어요. 상품 실측이 맞는지 확인해 주세요.' },
};

/**
 * Figma: 05 의류 등록
 */
export default function ClothingRegisterScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [size, setSize] = useState('');
  const [chest, setChest] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [length, setLength] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [sleeve, setSleeve] = useState('');
  const [waist, setWaist] = useState('');
  const [stretch, setStretch] = useState('없음');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const chestError = chest !== '' && parseInt(chest, 10) > LIMITS.chest.max ? LIMITS.chest.msg : null;
  const shoulderError = shoulder !== '' && parseInt(shoulder, 10) > LIMITS.shoulder.max ? LIMITS.shoulder.msg : null;
  const lengthError = length !== '' && parseInt(length, 10) > LIMITS.length.max ? LIMITS.length.msg : null;

  const requiredFilled = size.trim() && chest && shoulder && length;
  const hasError = chestError || shoulderError || lengthError;

  const handleSubmit = async () => {
    if (!requiredFilled || hasError) return;
    setLoading(true);
    try {
      // 1) 의류 등록
      const body = {
        kind: category.api,
        sizeName: size.trim(),
        shoulder: parseFloat(shoulder),
        chestWidth: parseFloat(chest),
        length: parseFloat(length),
      };
      if (sleeve) body.sleeve = parseFloat(sleeve);
      if (waist) body.waistWidth = parseFloat(waist);
      if (stretch) body.stretch = stretch;

      const garment = await createGarment(body);

      // 2) 의류 사진 업로드 (있으면)
      if (photo && garment.id) {
        try {
          await uploadGarmentPhoto(garment.id, photo);
        } catch (photoErr) {
          // 사진 업로드 실패해도 의류 등록은 된 상태 — 계속 진행
          console.warn('garment photo upload failed:', photoErr.message);
        }
      }

      // 3) 핏 분석 요청
      const fitting = await createFitting(garment.id);

      // 201 = 새로 생성 → 대기 화면, 200 = 기존 결과 → 바로 결과
      if (fitting._httpStatus === 200 && fitting.status !== '대기' && fitting.status !== '생성중') {
        navigation.navigate('FittingResult', { fitting });
      } else {
        navigation.navigate('GenerationWaiting', { fitting });
      }
    } catch (e) {
      Alert.alert('오류', e.message || '의류 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderMeasureRow = (label, value, setValue, error) => (
    <View key={label}>
      <View style={styles.measureRow}>
        <View style={styles.measureLabelWrap}>
          <Text style={[styles.measureLabel, error && { color: colors.error }]}>{label}</Text>
          <Feather name="info" size={13} color={error ? colors.error : '#878D96'} />
        </View>
        <View style={[styles.measureInputBox, error && styles.measureInputError]}>
          <TextInput
            style={[styles.measureInput, error && { color: colors.error }]}
            value={value}
            onChangeText={(t) => setValue(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            textAlign="right"
          />
          <Text style={styles.measureUnit}>cm</Text>
        </View>
      </View>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>입력값을 확인해 주세요</Text>
          <Text style={styles.errorMsg}>{error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <ProgressBar step={4} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <StepIndicator step={4} />
        <Text style={[type.h1, styles.title]}>의류 등록을 해주세요</Text>

        {/* 사진 업로드 */}
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.8}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.uploadPreview} resizeMode="cover" />
          ) : (
            <>
              <Feather name="image" size={18} color={colors.gray700} />
              <Text style={styles.uploadText}>여기를 눌러 사진 선택하기</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 종류 */}
        <Text style={styles.fieldLabel}>종류</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.api}
              style={[styles.chip, category.api === c.api && styles.chipActive]}
              onPress={() => setCategory(c)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, category.api === c.api && styles.chipTextActive]}>{c.display}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 사이즈 */}
        <Text style={styles.fieldLabel}>사이즈</Text>
        <View style={styles.sizeBox}>
          <TextInput
            style={styles.sizeInput}
            value={size}
            onChangeText={setSize}
            placeholder="L"
            placeholderTextColor="#878D96"
            autoCapitalize="characters"
          />
          <MaterialCommunityIcons name="tag-outline" size={20} color={colors.gray300} />
        </View>

        {/* 필수 치수 */}
        <View style={styles.requiredHeader}>
          <Text style={styles.fieldLabelInline}>필수 치수</Text>
          <Text style={styles.unitNote}>Unit: cm</Text>
        </View>
        {renderMeasureRow('가슴단면', chest, setChest, chestError)}
        {renderMeasureRow('어깨너비', shoulder, setShoulder, shoulderError)}
        {renderMeasureRow('총장', length, setLength, lengthError)}

        {/* 측정 가이드 */}
        <View style={styles.guideRow}>
          <View style={styles.guideThumb}>
            <MaterialCommunityIcons name="tshirt-crew-outline" size={40} color={colors.gray500} />
          </View>
          <View style={styles.guideTextWrap}>
            <Text style={styles.guideTitle}>측정 가이드</Text>
            <Text style={styles.guideDesc}>옷을 평평하게 놓고 겨드랑이 사이의 단면을 측정해 주세요.</Text>
          </View>
        </View>

        {/* 더 정확하게 (선택 항목) */}
        <TouchableOpacity style={styles.optionalToggle} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
          <View style={styles.optionalLeft}>
            <MaterialCommunityIcons name="tune-variant" size={18} color={colors.black} />
            <Text style={styles.optionalTitle}>더 정확하게 (선택 항목)</Text>
          </View>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.black} />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.optionalBody}>
            <View style={styles.measureRow}>
              <Text style={styles.measureLabel}>소매길이</Text>
              <View style={styles.measureInputBox}>
                <TextInput
                  style={styles.measureInput}
                  value={sleeve}
                  onChangeText={(t) => setSleeve(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                  textAlign="right"
                />
                <Text style={styles.measureUnit}>cm</Text>
              </View>
            </View>
            <View style={styles.measureRow}>
              <Text style={styles.measureLabel}>허리단면</Text>
              <View style={styles.measureInputBox}>
                <TextInput
                  style={styles.measureInput}
                  value={waist}
                  onChangeText={(t) => setWaist(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                  placeholder="--"
                  placeholderTextColor="#878D96"
                  textAlign="right"
                />
                <Text style={styles.measureUnit}>cm</Text>
              </View>
            </View>
            <View style={styles.measureRow}>
              <Text style={styles.measureLabel}>신축성</Text>
              <View style={styles.stretchRow}>
                {STRETCH_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.stretchChip, stretch === s && styles.stretchChipActive]}
                    onPress={() => setStretch(s)}
                  >
                    <Text style={[styles.stretchText, stretch === s && styles.stretchTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <PrimaryButton
          title={loading ? '등록 중...' : '피팅 결과 보기'}
          disabled={!requiredFilled || !!hasError || loading}
          style={styles.cta}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  title: { marginTop: 4 },
  uploadBox: {
    marginTop: 20,
    height: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray300,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  uploadPreview: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
  uploadText: { fontFamily: font.medium, fontSize: 16, lineHeight: 24, color: colors.gray700 },
  fieldLabel: {
    marginTop: 20,
    marginBottom: 8,
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.gray700,
  },
  fieldLabelInline: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.gray700,
  },
  chipRow: { gap: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 17,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: colors.gray700 },
  chipTextActive: { color: colors.white },
  sizeBox: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  sizeInput: { flex: 1, fontFamily: font.regular, fontSize: 18, color: colors.black, padding: 0 },
  requiredHeader: {
    marginTop: 24,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitNote: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700 },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  measureLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  measureLabel: { fontFamily: font.medium, fontSize: 16, lineHeight: 24, color: colors.gray700 },
  measureInputBox: {
    width: 167,
    height: 40,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    paddingLeft: 12,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
  },
  measureInputError: { borderWidth: 2, borderColor: colors.error },
  measureInput: { flex: 1, fontFamily: font.semibold, fontSize: 20, color: colors.ink, padding: 0 },
  measureUnit: { fontFamily: font.medium, fontSize: 12, letterSpacing: 0.12, color: '#878D96' },
  errorBox: {
    marginTop: 12,
    backgroundColor: '#FDECEC',
    borderRadius: 4,
    padding: 16,
    gap: 4,
  },
  errorTitle: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: colors.error },
  errorMsg: { fontFamily: font.regular, fontSize: 12, lineHeight: 17, color: colors.error },
  guideRow: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  guideThumb: {
    width: 70,
    height: 70,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTextWrap: { flex: 1 },
  guideTitle: { fontFamily: font.medium, fontSize: 14, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700 },
  guideDesc: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700, marginTop: 2 },
  optionalToggle: {
    marginTop: 20,
    height: 50,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionalLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionalTitle: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: colors.black },
  optionalBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.gray200,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stretchRow: { flexDirection: 'row', gap: 8 },
  stretchChip: {
    paddingHorizontal: 14,
    height: 36,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stretchChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  stretchText: { fontFamily: font.regular, fontSize: 14, color: colors.gray700 },
  stretchTextActive: { color: colors.white },
  cta: { marginTop: 24 },
});
