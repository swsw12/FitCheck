import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setTokenGetter } from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = '@fitcheck_token';
const USER_KEY = '@fitcheck_userId';

/**
 * 저장소 추상화.
 * 웹(Vercel)에서는 @react-native-async-storage 가 네이티브 모듈을 못 찾아 reject 되므로
 * localStorage 를 직접 사용한다. 네이티브에서는 AsyncStorage 그대로.
 * 어떤 경우에도 예외를 던지지 않아 저장 실패가 로그인 자체를 막지 않는다.
 */
const storage = Platform.OS === 'web'
  ? {
      async getItem(key) {
        try { return globalThis.localStorage?.getItem(key) ?? null; } catch (e) { return null; }
      },
      async multiSet(pairs) {
        try { pairs.forEach(([k, v]) => globalThis.localStorage?.setItem(k, v)); } catch (e) {}
      },
      async multiRemove(keys) {
        try { keys.forEach((k) => globalThis.localStorage?.removeItem(k)); } catch (e) {}
      },
    }
  : {
      async getItem(key) {
        try { return await AsyncStorage.getItem(key); } catch (e) { return null; }
      },
      async multiSet(pairs) {
        try { await AsyncStorage.multiSet(pairs); } catch (e) {}
      },
      async multiRemove(keys) {
        try { await AsyncStorage.multiRemove(keys); } catch (e) {}
      },
    };

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
          storage.getItem(TOKEN_KEY),
          storage.getItem(USER_KEY),
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
    await storage.multiSet([
      [TOKEN_KEY, tokenStr],
      [USER_KEY, userStr],
    ]);
  }, []);

  /** 로그아웃 — 토큰을 버리면 그게 로그아웃이다 (JWT, 서버에 상태 없음) */
  const logout = useCallback(async () => {
    tokenRef.current = null;
    setToken(null);
    setUserId(null);
    await storage.multiRemove([TOKEN_KEY, USER_KEY]);
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
