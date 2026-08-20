import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import PrimaryButton from '../components/PrimaryButton';
import { login } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { getProfile } from '../api/profile';
import { colors, font, type } from '../theme';

/** Figma: 09_B_비밀번호 (29:5612) */
export default function PasswordAuthScreen({ navigation, route }) {
  const email = route?.params?.email || '';
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const { saveAuth } = useAuth();

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const { token, userId } = await login(email, password);
      await saveAuth(token, userId);

      // 프로필 존재 여부 확인 → 있으면 MyFittings, 없으면 ProfileStep1
      try {
        await getProfile();
        navigation.reset({ index: 0, routes: [{ name: 'MyFittings' }] });
      } catch (profileErr) {
        if (profileErr.code === 'PROFILE_NOT_FOUND') {
          navigation.reset({ index: 0, routes: [{ name: 'ProfileStep1' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'ProfileStep1' }] });
        }
      }
    } catch (e) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      if (newCount >= 5) {
        navigation.navigate('LoginLocked', { email });
      } else {
        Alert.alert('로그인 실패', `이메일 또는 비밀번호를 확인해 주세요. (${newCount}/5)`);
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
          <Text style={[type.h1, styles.title]}>비밀번호를 입력해 주세요</Text>

          {/* 이메일 (읽기 전용 + 수정하기) */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>이메일</Text>
            <View style={styles.emailBox}>
              <Text style={styles.emailText}>{email}</Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.editLink}>수정하기</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 비밀번호 */}
          <View style={styles.fieldWrap}>
            <Text style={styles.pwLabel}>비밀번호</Text>
            <View style={styles.pwBox}>
              <TextInput
                style={styles.pwInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
                autoFocus
              />
              <TouchableOpacity onPress={() => setSecure(!secure)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name={secure ? 'eye' : 'eye-off'} size={16} color={colors.gray700} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => navigation.navigate('NewDeviceCode', { email })}
          >
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>

          <View style={styles.bottom}>
            <PrimaryButton
              title={loading ? '로그인 중...' : '로그인'}
              disabled={!password || loading}
              onPress={handleLogin}
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
  title: { marginTop: 24 },
  fieldWrap: { marginTop: 20, gap: 4 },
  label: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.ink,
  },
  emailBox: {
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
  editLink: {
    fontFamily: font.regular,
    fontSize: 14,
    color: '#878D96',
    textDecorationLine: 'underline',
  },
  pwLabel: { fontFamily: font.medium, fontSize: 15, color: '#484848' },
  pwBox: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  pwInput: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.navy,
    padding: 0,
  },
  forgotRow: { paddingVertical: 10, marginTop: 4, alignSelf: 'flex-start' },
  forgotText: { fontFamily: font.regular, fontSize: 14, color: '#484848' },
  bottom: { marginTop: 'auto', marginBottom: 24 },
});
