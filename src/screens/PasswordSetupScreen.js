import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { signup } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { colors, font, type } from '../theme';

/** Figma: 09_D_비밀번호 설정 (29:6137) — 비밀번호 만들기 (실시간 검증) */
export default function PasswordSetupScreen({ navigation, route }) {
  const email = route?.params?.email || '';
  const isSignup = route?.params?.isSignup ?? true;
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();

  const lengthOk = password.length >= 8;
  const comboOk = /[a-zA-Z]/.test(password) && /\d/.test(password);
  const valid = lengthOk && comboOk;

  const handleSubmit = async () => {
    if (!valid) return;
    setLoading(true);
    try {
      if (isSignup) {
        // 가입 → 토큰 바로 발급, 로그인 따로 안 함
        const { token, userId } = await signup(email, password, true);
        await saveAuth(token, userId);
        navigation.reset({ index: 0, routes: [{ name: 'ProfileStep1' }] });
      } else {
        // 비밀번호 재설정 (현재 API에 reset 엔드포인트 없음 — 가입 플로우만 처리)
        navigation.navigate('ProfileStep1');
      }
    } catch (e) {
      if (e.code === 'EMAIL_TAKEN') {
        Alert.alert('이미 가입된 이메일', '로그인 화면으로 이동합니다.');
        navigation.navigate('PasswordAuth', { email });
      } else if (e.code === 'PASSWORD_TOO_LONG') {
        Alert.alert('비밀번호 오류', '비밀번호가 너무 길어요. 한글은 24자까지 가능합니다.');
      } else {
        Alert.alert('오류', e.message || '가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <View style={styles.headlineBlock}>
            <Text style={type.h1}>비밀번호를 만들어 주세요</Text>
            <Text style={type.body}>안전한 로그인을 위해 8자 이상, 영문과 숫자를 조합해주세요.</Text>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.pwLabel}>비밀번호</Text>
            <View style={styles.pwBox}>
              <TextInput
                style={styles.pwInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
                placeholder="••••••••"
                placeholderTextColor={colors.gray300}
                autoFocus
              />
              <TouchableOpacity onPress={() => setSecure(!secure)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name={secure ? 'eye' : 'eye-off'} size={16} color={colors.gray700} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 실시간 검증 규칙 */}
          <View style={styles.rules}>
            <View style={styles.ruleRow}>
              <Feather name="check-circle" size={13} color={lengthOk ? colors.success : '#878D96'} />
              <Text style={[styles.ruleText, lengthOk && styles.ruleTextOk]}>8자 이상</Text>
            </View>
            <View style={styles.ruleRow}>
              <Feather name="check-circle" size={13} color={comboOk ? colors.success : '#878D96'} />
              <Text style={[styles.ruleText, comboOk && styles.ruleTextOk]}>영문, 숫자 포함</Text>
            </View>
          </View>

          <View style={styles.bottom}>
            <PrimaryButton
              title={loading ? '처리 중...' : '완료'}
              variant={valid && !loading ? 'primary' : 'disabled'}
              disabled={!valid || loading}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20 },
  headlineBlock: { marginTop: 24, gap: 12 },
  fieldWrap: { marginTop: 24, gap: 4 },
  pwLabel: { fontFamily: font.medium, fontSize: 15, color: '#484848' },
  pwBox: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  pwInput: { flex: 1, fontFamily: font.semibold, fontSize: 14, color: colors.ink, padding: 0 },
  rules: { marginTop: 12, gap: 8 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: {
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: '#878D96',
  },
  ruleTextOk: { color: colors.success },
  bottom: { marginTop: 'auto', marginBottom: 24 },
});
