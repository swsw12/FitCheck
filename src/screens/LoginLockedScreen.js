import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { colors, font, type } from '../theme';

const LOCK_SECONDS = 10 * 60;

/** Figma: 09_B_5회 실패 (29:4968) — 계정 잠김 안내 */
export default function LoginLockedScreen({ navigation, route }) {
  const [remaining, setRemaining] = useState(LOCK_SECONDS - 1);

  useEffect(() => {
    const t = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={[type.h1, styles.title]}>계정 잠김 안내</Text>
        <Text style={[type.body, styles.desc]}>
          비밀번호를 5회 잘못 입력하여{'\n'}보안을 위해 10분간 로그인이 제한됩니다.
        </Text>

        <View style={styles.lockBox}>
          <Text style={styles.lockLabel}>잠김 해제까지 남은 시간</Text>
          <Text style={styles.lockTimer}>{mm}:{ss}</Text>
        </View>

        <TouchableOpacity style={styles.helpRow}>
          <Text style={styles.helpText}>
            도움이 필요하신가요? <Text style={styles.underline}>고객센터 문의</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.bottom}>
          <PrimaryButton
            title="비밀번호 다시 설정하기"
            variant="outline"
            textStyle={styles.outlineText}
            onPress={() => navigation.navigate('PasswordReset', { email: route?.params?.email })}
          />
          <PrimaryButton
            title="로그인"
            onPress={() => navigation.navigate('PasswordAuth', { email: route?.params?.email })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  body: { flex: 1, paddingHorizontal: 20 },
  title: { marginTop: 24 },
  desc: { marginTop: 12 },
  lockBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 4,
    padding: 25,
    alignItems: 'center',
    gap: 4,
  },
  lockLabel: {
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: '#878D96',
  },
  lockTimer: {
    fontFamily: font.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0.4,
    color: colors.black,
  },
  helpRow: { alignItems: 'center', paddingVertical: 4, marginTop: 24 },
  helpText: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: '#878D96',
  },
  underline: { textDecorationLine: 'underline' },
  bottom: { marginTop: 'auto', marginBottom: 24, gap: 16 },
  outlineText: { color: colors.navy },
});
