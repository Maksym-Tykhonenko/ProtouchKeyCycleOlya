import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';

const BG = '#C6021E';

const LOADER_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<style>html,body{height:100%;margin:0;background:transparent}
.root{height:100%;display:flex;align-items:center;justify-content:center}
.cssload-loading-center{position:absolute;background:#ff0000;height:56px;width:56px;left:68px;top:69px;transform:rotate(45deg);border-radius:6px;animation:pulse 1.3s ease infinite}
.cssload-loading{position:relative;width:141px;height:141px;margin-top:6px;transform:rotate(45deg)}
.cssload-loading:after,.cssload-loading:before{position:absolute;content:'';height:19px;width:19px;top:0;background:#ff5252;border-radius:6px}
.cssload-loading:after{right:0;animation:square-tr 2.6s ease infinite;animation-delay:.1625s}
.cssload-loading:before{animation:square-tl 2.6s ease infinite;animation-delay:.1625s}
.cssload-two{position:relative;top:-150px}
.cssload-two:after,.cssload-two:before{bottom:0;top:initial}
.cssload-two:after{animation:square-br 2.6s ease infinite reverse}
.cssload-two:before{animation:square-bl 2.6s ease infinite reverse}
@keyframes square-tl{0%{transform:translate(0,0)}25%{transform:translate(0,117.5px)}50%{transform:translate(117.5px,117.5px)}75%{transform:translate(117.5px,0)}}
@keyframes square-bl{0%{transform:translate(0,0)}25%{transform:translate(0,-117.5px)}50%{transform:translate(117.5px,-117.5px)}75%{transform:translate(117.5px,0)}}
@keyframes square-tr{0%{transform:translate(0,0)}25%{transform:translate(-117.5px,0)}50%{transform:translate(-117.5px,117.5px)}75%{transform:translate(0,117.5px)}}
@keyframes square-br{0%{transform:translate(0,0)}25%{transform:translate(-117.5px,0)}50%{transform:translate(-117.5px,-117.5px)}75%{transform:translate(0,-117.5px)}}
@keyframes pulse{0%,100%{transform:scale(1) rotate(45deg)}75%{transform:scale(.25) rotate(45deg)}}</style></head>
<body><div class="root"><div style="position:relative;width:188px;height:188px">
<span class="cssload-loading"></span><span class="cssload-loading cssload-two"></span><span class="cssload-loading-center"></span>
</div></div></body></html>`;

export default function LoaderScreen() {
  const webOpacity = useRef(new Animated.Value(1)).current;
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const imgScale   = useRef(new Animated.Value(Platform.OS === 'ios' ? 0.58 : 0.55)).current;

  const { width, height } = Dimensions.get('window');
  const isSmall = width <= 360 || height <= 640;
  const imgSize = Math.min(isSmall ? 180 : 240, Math.round(width * (isSmall ? 0.48 : 0.56)));

  useEffect(() => {
    const t1 = setTimeout(() => {
      // 1) прибираємо WebView fade-out
      Animated.timing(webOpacity, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // 2) паралельно показуємо лого
      Animated.parallel([
        Animated.timing(imgOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(imgScale, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 8000);

    return () => clearTimeout(t1);
  }, [webOpacity, imgOpacity, imgScale]);

  const imageSource: ImageSourcePropType = require('../assets/loader.png');

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      {/* Web loader: залишається у дереві, просто зникає */}
      <Animated.View style={[styles.webWrap, { opacity: webOpacity }]} pointerEvents="none">
        <WebView
          originWhitelist={['*']}
          source={{ html: LOADER_HTML }}
          style={styles.webview}
          containerStyle={{ backgroundColor: 'transparent' } as any}
          androidLayerType={Platform.OS === 'android' ? 'hardware' : 'none'}
        />
      </Animated.View>

      {/* Лого: керуємо прозорістю та масштабом */}
      <Animated.Image
        source={imageSource}
        resizeMode="contain"
        style={{
          width: imgSize,
          height: imgSize,
          opacity: imgOpacity,
          transform: [{ scale: imgScale }],
        }}
        //pointerEvents="none"
      />
    </View>
  );
}

//const BG = '#C6021E';
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  webWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  webview: { width: 220, height: 220, backgroundColor: 'transparent' },
});

