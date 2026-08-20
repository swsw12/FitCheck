import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import Checkbox from '../components/Checkbox';
import { colors, font, type } from '../theme';

/** Figma: 09_A_이메일 (29:4647) */
export default function EmailAuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  const valid = email.trim().length > 0 && agreed;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppHeader onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <View style={styles.headlineBlock}>
            <Text style={type.h1}>이메일로 시작하기</Text>
            <Text style={type.body}>
              입력하신 신체 데이터는 안전하게 보관되며, 더 정확한 사이즈 추천을 위해 계정이 필요합니다.
            </Text>
          </View>

          <TextField
            label="이메일"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            style={styles.field}
          />

          <View style={styles.bottom}>
            <View style={styles.agreeRow}>
              <Checkbox checked={agreed} onChange={setAgreed} />
              <Text style={styles.agreeText}>
                만 14세 이상이며, <Text style={styles.underline}>이용약관</Text>과{' '}
                <Text style={styles.underline}>개인정보 처리방침</Text>에 동의합니다
              </Text>
            </View>
            <PrimaryButton
              title="로그인"
              disabled={!valid}
              onPress={() => navigation.navigate('PasswordAuth', { email: email.trim() })}
            />
            <PrimaryButton
              title="회원가입"
              variant={valid ? 'outline' : 'disabled'}
              disabled={!valid}
              onPress={() => navigation.navigate('PasswordSetup', { email: email.trim(), isSignup: true })}
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
  field: { marginTop: 32 },
  bottom: { marginTop: 'auto', marginBottom: 24, gap: 16 },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  agreeText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  underline: { textDecorationLine: 'underline' },
});
