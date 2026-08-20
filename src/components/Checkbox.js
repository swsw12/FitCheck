import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';

/** 체크박스 (Figma: Background+Border — 20px, radius 2, 보더 #C5C6CA) */
export default function Checkbox({ checked, onChange }) {
  return (
    <TouchableOpacity
      onPress={() => onChange && onChange(!checked)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Feather name="check" size={14} color={colors.white} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 20,
    height: 20,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: '#FCF8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
});
