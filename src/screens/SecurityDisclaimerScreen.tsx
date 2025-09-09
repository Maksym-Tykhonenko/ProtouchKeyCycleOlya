import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { COLORS } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'SecurityDisclaimer'>;

const { width: W, height: H } = Dimensions.get('window');
const isBigIPhone = Platform.OS === 'ios' && Math.max(W, H) >= 900;
const EXTRA_TOP = Platform.OS === 'android' ? 20 : (isBigIPhone ? 0 : 20);

export default function SecurityDisclaimerScreen({ navigation }: Props) {
  const [sec, setSec] = useState(15);
  const insets = useSafeAreaInsets();
  const topPad = Math.max(12, insets.top + 8 + EXTRA_TOP);

  useEffect(() => {
    if (sec <= 0) return;
    const t = setTimeout(() => setSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);

  const onOk = () => navigation.replace('Tabs');

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.headerWrap, { paddingTop: topPad }]}>
        <Text style={s.header}>Security Disclaimer</Text>
      </View>

      <View style={s.card}>
        <View style={s.badge}><Text style={s.badgeTxt}>🛡️</Text></View>

        <Text style={s.title}>Your security is our priority.</Text>

        <View style={s.list}>
          <Bullet>We never ask you to type or paste your passwords into the app.</Bullet>
          <Bullet>Use Apple iCloud Keychain (or your device’s password manager) to safely create and store strong passwords.</Bullet>
          <Bullet>This app is a reminder tool — not a password manager.</Bullet>
          <Bullet>Stay smart. Keep your credentials private.</Bullet>
        </View>

        {sec > 0 ? (
          <View style={[s.btn, s.btnDisabled]}>
            <Text style={s.btnTxt}>{sec} seconds</Text>
          </View>
        ) : (
          <Pressable style={s.btn} onPress={onOk}>
            <Text style={s.btnTxt}>OK</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
      <Text style={{ color: '#fff', fontSize: 12 }}>•</Text>
      <Text style={s.item}>{children as any}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  headerWrap: { paddingHorizontal: 16, paddingBottom: 8, alignItems: 'center' },
  header: { color: '#fff', fontSize: 18, fontWeight: '800' },

  card: {
    margin: 16, borderRadius: 16, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  badge: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  badgeTxt: { fontSize: 18 },
  title: { color: '#fff', fontWeight: '800', marginBottom: 10 },
  list: { marginTop: 6, marginBottom: 16 },
  item: { color: '#fff', opacity: 0.95, fontSize: 12, lineHeight: 18 },

  btn: {
    height: 48, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { color: COLORS.primary, fontWeight: '800' },
});