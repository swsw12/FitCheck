import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, font } from '../theme';

/**
 * 상단 헤더 (Figma: 급여상세_타이틀 프레임)
 * 좌측 뒤로가기 아이콘 + 중앙 타이틀, 하단 2px 보더
 */
export default function AppHeader({ title = 'FitCheck AI', onBack, showBack = true }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconSlot}>
        {showBack && (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="chevron-left" size={22} color={colors.title} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.iconSlot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 17,
    paddingBottom: 19,
    borderBottomWidth: 2,
    borderBottomColor: colors.headerBorder,
    backgroundColor: colors.white,
  },
  iconSlot: { width: 20, alignItems: 'flex-start' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: font.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: colors.title,
  },
});
