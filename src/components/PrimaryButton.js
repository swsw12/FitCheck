import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, font } from '../theme';

/**
 * 주요 CTA 버튼 (Figma: Button — bg #051A2B, radius 4, py 16)
 * variant: 'primary' | 'outline' | 'disabled'
 */
export default function PrimaryButton({ title, onPress, variant = 'primary', disabled: disabledProp, style, textStyle }) {
  const disabled = variant === 'disabled' || !!disabledProp;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'outline' && { color: colors.ink },
          disabled && { color: colors.gray500 },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.navy },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  disabled: { backgroundColor: colors.gray200 },
  text: {
    fontFamily: font.medium,
    fontSize: 20,
    lineHeight: 28,
    color: colors.white,
    textAlign: 'center',
  },
});
