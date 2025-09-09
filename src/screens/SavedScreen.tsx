import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Image,
  Share,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  bg: '#C6021E',
  card: '#AD1528',
  field: '#9F1224',
  stroke: 'rgba(255,255,255,0.22)',
  white: '#FFFFFF',
  white80: 'rgba(255,255,255,0.85)',
  white60: 'rgba(255,255,255,0.6)',
  chip: '#8E1021',
};

const TAB_BAR_H = 100;
const { width: W, height: H } = Dimensions.get('window');
const isSmall = W < 360 || H < 680;
const FS = isSmall ? 0.94 : 1;
const SZ = isSmall ? 0.92 : 1;
const fs = (n: number) => Math.round(n * FS);

const STORE_KEY = 'protouch.saved.tips';

const RAW_TIPS = [
  'Use different passwords for each account.',
  'Enable two-factor authentication wherever possible.',
  'Avoid clicking on unknown email links.',
  'Update your software and apps regularly.',
  'Don’t reuse old passwords.',
  'Use a password manager or iCloud Keychain.',
  'Lock your phone and computer when not in use.',
  'Avoid using public Wi-Fi for sensitive actions.',
  'Watch out for phishing messages and fake websites.',
  'Don’t share your passwords with anyone.',
  'Use biometric authentication if available.',
  'Monitor your accounts for suspicious activity.',
  'Avoid using birthdays or names in passwords.',
  'Back up your data securely and regularly.',
  'Log out from services you no longer use.',
];

type Tip = { id: string; title: string; text: string };
const ALL_TIPS: Tip[] = RAW_TIPS.map((t, i) => ({ id: String(i + 1), title: `Tip #${i + 1}`, text: t }));

const isBigIPhone = Platform.OS === 'ios' && Math.max(W, H) >= 900;
const TOP_DELTA = Platform.OS === 'android' ? 20 : isBigIPhone ? -20 : 0;

export default function SavedScreen() {
  const nav = useNavigation<any>();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const insets = useSafeAreaInsets();
  const topPad = Math.max(12, insets.top + 8 + TOP_DELTA);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      setSavedIds(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); runEnter(); return undefined; }, [load]));

  const savedTips = useMemo(() => ALL_TIPS.filter(t => savedIds.has(t.id)), [savedIds]);

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      AsyncStorage.setItem(STORE_KEY, JSON.stringify(Array.from(next))).catch(() => {});
      return next;
    });
  };

  const onShare = async (tip: Tip) => {
    try { await Share.share({ message: `${tip.title}\n${tip.text}` }); } catch {}
  };

  const contX = useRef(new Animated.Value(W * 0.5)).current;
  const contScale = useRef(new Animated.Value(0.98)).current;
  const contTilt = useRef(new Animated.Value(1)).current;
  const contOpacity = useRef(new Animated.Value(0)).current;

  const runEnter = useCallback(() => {
    contX.setValue(W * 0.5);
    contScale.setValue(0.98);
    contTilt.setValue(1);
    contOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(contX, { toValue: 0, useNativeDriver: true, damping: 12, stiffness: 140, mass: 0.7 }),
      Animated.spring(contScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 140, mass: 0.7 }),
      Animated.timing(contTilt, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(contOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [contX, contScale, contTilt, contOpacity]);

  const stepA = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const runCascade = useCallback(() => {
    stepA.forEach(v => v.setValue(0));
    Animated.stagger(
      90,
      stepA.map(v => Animated.timing(v, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }))
    ).start();
  }, [stepA]);

  const stepStyle = (i: number) => ({
    opacity: stepA[i].interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [
      { translateY: stepA[i].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: stepA[i].interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
    ],
  });

  const itemAnims = useRef<Animated.Value[]>([]);
  const ensureItemAnims = (len: number) => {
    if (itemAnims.current.length !== len) {
      itemAnims.current = Array.from({ length: len }, (_, i) => itemAnims.current[i] ?? new Animated.Value(0));
    }
  };

  const animateList = useCallback((len: number) => {
    ensureItemAnims(len);
    const anims = itemAnims.current.slice(0, len).map(v => {
      v.setValue(0);
      return Animated.timing(v, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    });
    Animated.stagger(70, anims).start();
  }, []);

  const itemStyle = (i: number) => ({
    opacity: (itemAnims.current[i] ?? new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [
      { translateY: (itemAnims.current[i] ?? new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: (itemAnims.current[i] ?? new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
      { rotateZ: (itemAnims.current[i] ?? new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: ['2deg', '0deg'] }) },
    ],
  });

  useEffect(() => {
    if (savedTips.length > 0) animateList(savedTips.length);
    else runCascade();
  }, [savedTips.length, animateList, runCascade]);

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View
        style={{
          flex: 1,
          opacity: contOpacity,
          transform: [
            { perspective: 800 },
            { translateX: contX },
            { rotateY: contTilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-12deg'] }) },
            { scale: contScale },
          ],
        }}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 16, paddingBottom: TAB_BAR_H + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {savedTips.length === 0 ? (
            <>
              <Animated.View style={[s.headerPill, stepStyle(0)]}>
                <Text style={s.headerPillTxt}>SAVED reccomendations</Text>
              </Animated.View>

              <Animated.View style={[s.emptyWrap, { marginTop: 24 * SZ }, stepStyle(1)]}>
                <Image
                  source={require('../assets/tips.png')}
                  style={{ width: (isSmall ? 130 : 150) * SZ, height: (isSmall ? 130 : 150) * SZ }}
                  resizeMode="contain"
                />
              </Animated.View>

              <Animated.Text style={[s.emptyTxt, stepStyle(2)]}>
                There is no reccomendations now
              </Animated.Text>

              <Animated.View style={[stepStyle(2), { alignSelf: 'stretch' }]}>
                <Pressable style={[s.bigBtn, { marginTop: 14 * SZ }]} onPress={() => nav.navigate('TIPS')}>
                  <Text style={s.bigBtnTxt}>View all</Text>
                </Pressable>
              </Animated.View>
            </>
          ) : (
            <>
              <View style={s.headerPill}>
                <Text style={s.headerPillTxt}>SAVED reccomendations</Text>
              </View>

              {savedTips.map((tip, i) => (
                <Animated.View key={tip.id} style={[s.card, itemStyle(i)]}>
                  <Text style={s.tipTitle}>{tip.title}</Text>
                  <Text style={s.tipText}>{tip.text}</Text>

                  <View style={s.actionsRow}>
                    <SmallIconBtn
                      label="🔖"
                      active
                      onPress={() => toggleSave(tip.id)}
                      accessibilityLabel="Remove from saved"
                    />
                    <SmallIconBtn
                      label="↗️"
                      onPress={() => onShare(tip)}
                      accessibilityLabel="Share tip"
                    />
                  </View>
                </Animated.View>
              ))}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function SmallIconBtn({
  label,
  onPress,
  active,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        s.iconBtn,
        active && s.iconBtnActive,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[s.iconTxt, active && { color: '#C6021E' }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  headerPill: {
    marginTop: 8 * SZ,
    height: 42 * SZ,
    borderRadius: 21 * SZ,
    backgroundColor: '#940F22',
    borderWidth: 1,
    borderColor: C.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPillTxt: { color: C.white, fontWeight: '800', fontSize: fs(15) },

  emptyWrap: {
    marginTop: 16 * SZ,
    height: (isSmall ? 170 : 190) * SZ,
    borderRadius: 14 * SZ,
    backgroundColor: '#C6021E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTxt: {
    marginTop: 12 * SZ,
    color: C.white80,
    textAlign: 'center',
    fontSize: fs(13),
  },

  bigBtn: {
    height: 56 * SZ,
    borderRadius: 28 * SZ,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBtnTxt: { fontSize: fs(16), fontWeight: '800', color: '#000' },

  card: {
    marginTop: 12 * SZ,
    padding: 14 * SZ,
    borderRadius: 18 * SZ,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.stroke,
  },
  tipTitle: { color: C.white, fontWeight: '800', marginBottom: 4 * SZ, fontSize: fs(15) },
  tipText: { color: C.white80, lineHeight: fs(20), fontSize: fs(13) },

  actionsRow: {
    marginTop: 12 * SZ,
    flexDirection: 'row',
    gap: 10 * SZ,
  },
  iconBtn: {
    width: 38 * SZ,
    height: 38 * SZ,
    borderRadius: 12 * SZ,
    backgroundColor: C.chip,
    borderWidth: 1,
    borderColor: C.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: C.white, borderColor: C.white },
  iconTxt: { color: C.white, fontSize: fs(16), fontWeight: '600' },
});