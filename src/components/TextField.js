import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, font } from '../theme';

/**
 * 라벨 + 인풋 (Figma: Email Input 패턴 — 14px Medium 라벨, 보더 #C5C6CA, radius 4)
 */
export default function TextField({
  label,
  error,
  helper,
  right,
  style,
  inputStyle,
  ...inputProps
}) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputBox, error && styles.inputBoxError]}>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor="#878D96"
          {...inputProps}
        />
        {right}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helper ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 4 },
  label: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.28,
    color: colors.ink,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    paddingHorizontal: 17,
    backgroundColor: colors.white,
  },
  inputBoxError: { borderColor: colors.error },
  input: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 15,
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.ink,
    padding: 0,
  },
  errorText: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, color: colors.error, marginTop: 2 },
  helperText: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, color: colors.gray500, marginTop: 2 },
});
