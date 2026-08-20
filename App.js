import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, Platform, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

import LandingScreen from './src/screens/LandingScreen';
import EmailAuthScreen from './src/screens/EmailAuthScreen';
import PasswordAuthScreen from './src/screens/PasswordAuthScreen';
import LoginLockedScreen from './src/screens/LoginLockedScreen';
import NewDeviceCodeScreen from './src/screens/NewDeviceCodeScreen';
import PasswordSetupScreen from './src/screens/PasswordSetupScreen';
import ProfileStep1Screen from './src/screens/ProfileStep1Screen';
import ProfileStep2Screen from './src/screens/ProfileStep2Screen';
import BodyPhotoUploadScreen from './src/screens/BodyPhotoUploadScreen';
import ClothingRegisterScreen from './src/screens/ClothingRegisterScreen';
import GenerationWaitingScreen from './src/screens/GenerationWaitingScreen';
import FittingResultScreen from './src/screens/FittingResultScreen';
import MyFittingsScreen from './src/screens/MyFittingsScreen';
import SizeCompareScreen from './src/screens/SizeCompareScreen';

const Stack = createNativeStackNavigator();

/**
 * 인증 상태가 복원된 뒤에만 네비게이터를 렌더.
 * 저장된 토큰이 있으면 랜딩/온보딩을 건너뛰고 내 피팅으로 시작한다.
 */
function RootNavigator() {
  const { loading, isLoggedIn } = useAuth();

  // 토큰 복원이 끝날 때까지 흰 화면 유지 (초기 라우트를 한 번만 정하기 위함)
  if (loading) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={isLoggedIn ? 'MyFittings' : 'Landing'}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}
      >
        {/* 인증 플로우 */}
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
        <Stack.Screen name="PasswordAuth" component={PasswordAuthScreen} />
        <Stack.Screen name="LoginLocked" component={LoginLockedScreen} />
        <Stack.Screen name="NewDeviceCode" component={NewDeviceCodeScreen} />
        <Stack.Screen name="PasswordSetup" component={PasswordSetupScreen} />
        <Stack.Screen name="PasswordReset" component={PasswordSetupScreen} />

        {/* 온보딩 4단계 */}
        <Stack.Screen name="ProfileStep1" component={ProfileStep1Screen} />
        <Stack.Screen name="ProfileStep2" component={ProfileStep2Screen} />
        <Stack.Screen name="BodyPhotoUpload" component={BodyPhotoUploadScreen} />
        <Stack.Screen name="ClothingRegister" component={ClothingRegisterScreen} />

        {/* 결과 플로우 */}
        <Stack.Screen name="GenerationWaiting" component={GenerationWaitingScreen} />
        <Stack.Screen name="FittingResult" component={FittingResultScreen} />
        <Stack.Screen name="MyFittings" component={MyFittingsScreen} />
        <Stack.Screen name="SizeCompare" component={SizeCompareScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  // 웹: 데스크톱 전체화면에서 늘어나 잘리지 않도록 모바일 고정 폭(휴대폰 프레임)으로 가운데 정렬.
  // 네이티브: 그대로 전체 화면 사용.
  const app = <RootNavigator />;

  return (
    <AuthProvider>
      <SafeAreaProvider>
        {Platform.OS === 'web' ? (
          <View style={styles.webShell}>
            <View style={styles.webFrame}>{app}</View>
          </View>
        ) : (
          app
        )}
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB', // 프레임 바깥 여백(회색)
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 430,          // 휴대폰 폭 고정
    alignSelf: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
});
