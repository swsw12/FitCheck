import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setTokenGetter } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = '@fitcheck_token';
const USER_KEY = '@fitcheck_userId';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 항상 최신 토큰을 가리키는 ref — effect 실행 순서와 무관하게 api/client 가 즉시 읽을 수 있다
  const tokenRef = useRef(null);

  // api/client 에 토큰 getter 주입 (ref 기반이라 한 번만 등록하면 됨)
  useEffect(() => {
    setTokenGetter(() => tokenRef.current);
  }, []);

  // 앱 시작 시 저장된 토큰 복원
  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (savedToken) {
          tokenRef.current = savedToken;
          setToken(savedToken);
          setUserId(savedUser);
        }
      } catch (e) {
        // 무시 — 토큰 없이 시작
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** 로그인/가입 성공 시 호출 */
  const saveAuth = useCallback(async (newToken, newUserId) => {
    const tokenStr = String(newToken);
    const userStr = String(newUserId ?? '');
    tokenRef.current = tokenStr;
    setToken(tokenStr);
    setUserId(userStr);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, tokenStr],
      [USER_KEY, userStr],
    ]);
  }, []);

  /** 로그아웃 — 토큰을 버리면 그게 로그아웃이다 (JWT, 서버에 상태 없음) */
  const logout = useCallback(async () => {
    tokenRef.current = null;
    setToken(null);
    setUserId(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, userId, loading, isLoggedIn: !!token, saveAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
