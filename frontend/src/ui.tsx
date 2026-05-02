// Reusable UI components
import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, Spacing } from './theme';

export function Button({
  title, onPress, variant = 'primary', loading, disabled, testID, style,
}: { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost'; loading?: boolean; disabled?: boolean; testID?: string; style?: ViewStyle }) {
  const isDisabled = disabled || loading;
  const bg = variant === 'primary' ? Colors.primary : variant === 'secondary' ? Colors.bg : 'transparent';
  const textColor = variant === 'primary' ? '#fff' : Colors.text;
  const borderColor = variant === 'secondary' ? Colors.text : 'transparent';
  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        { backgroundColor: bg, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', borderWidth: variant === 'secondary' ? 1.5 : 0, borderColor, opacity: isDisabled ? 0.6 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function Input({ value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, testID, multiline, numberOfLines }: any) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View
      style={{
        backgroundColor: focused ? Colors.bg : Colors.bgAlt,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: focused ? Colors.text : 'transparent',
        paddingHorizontal: 16,
        paddingVertical: multiline ? 12 : 14,
      }}
    >
      <RNTextInputWrapper
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        testID={testID}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

import { TextInput } from 'react-native';
function RNTextInputWrapper(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={Colors.textMuted}
      style={{ fontSize: 15, color: Colors.text, padding: 0, minHeight: props.multiline ? 80 : 22, textAlignVertical: props.multiline ? 'top' : 'center' }}
    />
  );
}

export function Chip({ label, active, onPress, testID }: { label: string; active?: boolean; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: active ? Colors.text : Colors.border,
        backgroundColor: active ? Colors.text : Colors.bgAlt,
      }}
    >
      <Text style={{ color: active ? '#fff' : Colors.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ backgroundColor: Colors.surface, borderRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }, style]}>{children}</View>
  );
}

export function Divider() { return <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md }} />; }

export function Pill({ text, color = Colors.primary, bg = Colors.primaryLight, testID }: { text: string; color?: string; bg?: string; testID?: string }) {
  return (
    <View testID={testID} style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start' }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>{text}</Text>
    </View>
  );
}

export const sharedStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
