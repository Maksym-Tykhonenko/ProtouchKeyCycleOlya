import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const BG = '#C6021E';
const CARD_BG = '#A60018';

const { width: W, height: H } = Dimensions.get('window');
const isSmall = W <= 360 || H <= 640;
const isBigIPhone = Platform.OS === 'ios' && Math.max(W, H) >= 900;
const EXTRA_TOP = Platform.OS === 'android' ? 20 : (isBigIPhone ? 0 : 20);

const FONT_BOOST = isSmall ? 1.12 : 1.18;
const fs = (n: number) => Math.round(n * FONT_BOOST);

const IMG_BASE = 397;
const FEATURE_CARD_W = 354;
const FEATURE_CARD_H = 216;
const DISC_CARD_W = 354;
const DISC_CARD_H = 465;
const CTA_W = 354;
const CTA_H = 70;

type Slide =
  | { kind: 'feature'; key: string; image: any; title: string; text: string }
  | { kind: 'disclaimer'; key: string; title: string; bullets: string[]; showTimer?: boolean };

const SLIDES: Slide[] = [
  {
    kind: 'feature',
    key: 's1',
    image: require('../assets/lock-shield.png'),
    title: 'Stay Secure, Stay Smart',
    text:
      'Protouch helps you remember to\nchange passwords regularly and keep\nyour digital life safe.',
  },
  {
    kind: 'feature',
    key: 's2',
    image: require('../assets/calendar.png'),
    title: 'Custom Intervals',
    text:
      'Choose how often you want to be\nreminded. When time’s up, Protouch\nresets the countdown for the next\ncycle.',
  },
  {
    kind: 'feature',
    key: 's3',
    image: require('../assets/tips.png'),
    title: 'Learn & Save Tips',
    text:
      'Get simple, actionable cybersecurity\nadvice. Save the ones that matter most.',
  },
  {
    kind: 'feature',
    key: 's4',
    image: require('../assets/key.png'),
    title: 'Built-in Password Generator',
    text:
      'Use Apple’s iCloud Keychain to create\nstrong, unique passwords instantly.',
  },
  {
    kind: 'feature',
    key: 's5',
    image: require('../assets/settings.png'),
    title: 'Total Control',
    text:
      'Configure vibration, auto-hide, and\nnotifications just the way you want.',
  },
  {
    kind: 'disclaimer',
    key: 's6',
    title: 'Security Disclaimer',
    showTimer: true,
    bullets: [
      'Your security is our priority.',
      'Protouch will never ask you to enter or store your personal passwords in the app.',
      'Do not type or paste any of your existing passwords into any field.',
      'Use the iCloud Keychain Generator to safely create new secure passwords that are stored in your Apple ecosystem.',
      'We are a reminder tool — not a password manager.',
      'Stay smart. Stay safe.',
      'Let Protouch help you build better habits — without ever knowing your passwords.',
    ],
  },
  {
    kind: 'disclaimer',
    key: 's7',
    title: 'Security Disclaimer',
    bullets: [
      'Your security is our priority.',
      'Protouch will never ask you to enter or store your personal passwords in the app.',
      'Do not type or paste any of your existing passwords into any field.',
      'Use the iCloud Keychain Generator to safely create new secure passwords that are stored in your Apple ecosystem.',
      'We are a reminder tool — not a password manager.',
      'Stay smart. Stay safe.',
      'Let Protouch help you build better habits — without ever knowing your passwords.',
    ],
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(15);

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  const insets = useSafeAreaInsets();
  const topPad = Math.max(16, insets.top + 8 + EXTRA_TOP);
  const bottomPad = Math.max(22, insets.bottom + 12);
  const dotsArea = 14;
  const homeBarArea = 24;

  const slide = useMemo(() => SLIDES[idx], [idx]);

  const btnScale = Math.min(1, (W - 48) / CTA_W);
  const btnW = Math.round(CTA_W * btnScale);
  const btnH = Math.round(CTA_H * btnScale);
  const buttonArea = btnH + 24;

  const imgScale = Math.min(1, (W - 48) / IMG_BASE, (H * 0.42) / IMG_BASE);
  const imgSize = Math.round(IMG_BASE * imgScale);

  const discWidthScale = Math.min(1, (W - 48) / DISC_CARD_W);
  const discW = Math.round(DISC_CARD_W * discWidthScale);
  const discMaxHByWidth = Math.round(DISC_CARD_H * discWidthScale);
  const discAvailH = Math.max(
    240,
    H - topPad - bottomPad - dotsArea - homeBarArea - buttonArea - 16
  );
  const discH = Math.max(
    240,
    Math.min(discMaxHByWidth, Math.floor(discAvailH * (isSmall ? 0.68 : 0.76)))
  );

  const featWidthScale = Math.min(1, (W - 48) / FEATURE_CARD_W);
  const featW = Math.round(FEATURE_CARD_W * featWidthScale);
  const featMaxHByWidth = Math.round(FEATURE_CARD_H * featWidthScale);
  const featureAvailH = Math.max(
    120,
    H - topPad - bottomPad - dotsArea - homeBarArea - buttonArea - imgSize - 16
  );
  const featH = Math.max(120, Math.min(featMaxHByWidth, featureAvailH));

  useEffect(() => {
    fade.setValue(0);
    scale.setValue(0.94);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    if (slide.kind === 'disclaimer' && slide.showTimer) {
      setLeft(15);
      const t = setInterval(() => {
        setLeft(prev => {
          if (prev <= 1) {
            clearInterval(t);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [idx]);

  const onNext = () => {
    if (idx < SLIDES.length - 1) setIdx(i => i + 1);
    else navigation.replace('Tabs');
  };

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View
        style={[
          s.inner,
          {
            paddingTop: topPad,
            paddingBottom: bottomPad,
            opacity: fade,
            transform: [{ scale }],
          },
        ]}
      >
        {slide.kind === 'feature' && (
          <View style={s.imageWrap}>
            <Image source={slide.image} style={{ width: imgSize, height: imgSize }} resizeMode="contain" />
          </View>
        )}

        {slide.kind === 'feature' ? (
          <View style={[s.featureCard, { width: featW, height: featH }]}>
            <Text style={[s.cardTitle, { fontSize: fs(15) }]} numberOfLines={2}>{slide.title}</Text>
            <Text style={[s.cardText, { fontSize: fs(isSmall ? 12 : 13), lineHeight: fs(18) }]}>{slide.text}</Text>
          </View>
        ) : (
          <View style={[s.discCard, { width: discW, height: discH }]}>
            <View style={s.discHeader}>
              <Text style={{ fontSize: fs(14) }}>🔒</Text>
              <Text style={[s.discTitle, { fontSize: fs(15) }]} numberOfLines={1}>{slide.title}</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingRight: 4 }}>
              {slide.bullets.map((b, i) => (
                <View key={i} style={s.bulletRow}>
                  <Text style={{ color: '#FFF', marginTop: 1, fontSize: fs(14) }}>✅</Text>
                  <Text style={[s.bulletText, { fontSize: fs(13), lineHeight: fs(18) }]}>{b}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Pressable
          onPress={onNext}
          disabled={slide.kind === 'disclaimer' && slide.showTimer && left > 0}
          style={[
            s.cta,
            { width: btnW, height: btnH },
            slide.kind === 'disclaimer' && slide.showTimer && left > 0 && { opacity: 0.7 },
          ]}
        >
          <Text style={[s.ctaTxt, { fontSize: fs(16) }]}>
            {slide.kind === 'disclaimer'
              ? slide.showTimer
                ? (left > 0 ? `${left} seconds` : 'Next')
                : 'Ok'
              : 'Next'}
          </Text>
        </Pressable>

        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === idx && s.dotActive]} />
          ))}
        </View>

        <View style={s.homeBar} />
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  imageWrap: { alignItems: 'center', justifyContent: 'center' },

  featureCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignSelf: 'center',
  },
  cardTitle: { color: '#FFF', fontWeight: '800', textAlign: 'center' },
  cardText: { marginTop: 6, color: '#FDE7EB', textAlign: 'center' },

  discCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  discHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  discTitle: { color: '#FFF', fontWeight: '800' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bulletText: { color: '#FFF', flexShrink: 1, flex: 1 },

  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center', marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#FFF' },

  cta: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  ctaTxt: { color: '#000', fontWeight: '800' },

  homeBar: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    marginBottom: 20,
    alignSelf: 'center',
  },
});
