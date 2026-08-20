import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { colors, font, type } from '../theme';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

/** Figma: 09_C_코드(새 기기) (29:5875) — 새 기기 인증코드 입력 */
export default function NewDeviceCodeScreen({ navigation, route }) {
  const email = route?.params?.email || 'j***@example.com';
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(RESEND_SECONDS);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] || '');
  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);
  const canResend = remaining === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <View style={styles.headlineBlock}>
            <Text style={type.h1}>메일로 받은 인증코드를 넣어주세요</Text>
            <Text style={type.body}>
              처음 보는 기기라서 한 번 더 확인할게요.{'\n'}
              <Text style={{ fontFamily: font.medium }}>내 사진을 지키기 위한 절차예요.</Text>
            </Text>
          </View>

          {/* 발송 이메일 */}
          <View style={styles.emailBox}>
            <Text style={styles.emailText}>{email} 으로 보냈어요</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.editLink}>수정하기</Text>
            </TouchableOpacity>
          </View>

          {/* 인증코드 6자리 */}
          <Text style={styles.codeLabel}>인증코드</Text>
          <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
            <View style={styles.codeRow}>
              {digits.map((d, i) => (
                <View
                  key={i}
                  style={[styles.codeCell, i === activeIndex && styles.codeCellActive]}
                >
                  <Text style={styles.codeDigit}>{d}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
          />

          {/* 타이머 + 재발송 */}
          <View style={styles.timerRow}>
            <View style={styles.timerLeft}>
              <Feather name="clock" size={13} color={colors.blue} />
              <Text style={styles.timerValue}>
                00:{String(remaining).padStart(2, '0')}
              </Text>
              <Text style={styles.timerText}>후에 재발송 할 수 있어요</Text>
            </View>
            <TouchableOpacity
              disabled={!canResend}
              style={[styles.resendBtn, !canResend && { opacity: 0.5 }]}
              onPress={() => setRemaining(RESEND_SECONDS)}
            >
              <Feather name="rotate-cw" size={12} color={colors.gray700} />
              <Text style={styles.resendText}>재발송</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottom}>
            <PrimaryButton title="확인" onPress={() => navigation.navigate('ProfileStep1')} />
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
  emailBox: {
    marginTop: 24,
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emailText: { fontFamily: font.regular, fontSize: 16, color: '#878D96' },
  editLink: { fontFamily: font.regular, fontSize: 14, color: '#878D96', textDecorationLine: 'underline' },
  codeLabel: { marginTop: 24, fontFamily: font.medium, fontSize: 15, color: '#484848' },
  codeRow: { flexDirection: 'row', gap: 13, marginTop: 4, height: 60, alignItems: 'center' },
  codeCell: {
    width: 48,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: '#FCF8F8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  codeCellActive: { borderWidth: 2, borderColor: colors.blue },
  codeDigit: { fontFamily: font.semibold, fontSize: 20, color: colors.ink },
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  timerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerValue: {
    fontFamily: font.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: colors.blue,
  },
  timerText: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700 },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  resendText: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.12, color: colors.gray700 },
  bottom: { marginTop: 'auto', marginBottom: 24 },
});
