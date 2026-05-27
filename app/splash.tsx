// app/splash.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const topIconAnim = useRef(new Animated.Value(-150)).current;
  const bottomIconAnim = useRef(new Animated.Value(150)).current;
  
  // حركات النصوص من اليمين واليسار
  const sareeAnim = useRef(new Animated.Value(200)).current;
  const sareeFastAnim = useRef(new Animated.Value(-200)).current;
  
  const logoScaleAnim = useRef(new Animated.Value(0.3)).current;
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // تشغيل جميع الحركات المتزامنة
    Animated.parallel([
      // حركة الأيقونة العلوية (نزول)
      Animated.timing(topIconAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      // حركة الأيقونة السفلية (صعود)
      Animated.timing(bottomIconAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      // حركة "Saree3" من اليمين
      Animated.timing(sareeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(0.8)),
      }),
      // حركة "سريع" من اليسار
      Animated.timing(sareeFastAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(0.8)),
      }),
      // تكبير الشعار
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      // ظهور الشعار
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // ظهور النص السفلي بعد 0.6 ثانية
    setTimeout(() => {
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 600);

    // ❌ تم إزالة router.push - الانتقال يتم من _layout.tsx
  }, []);

  // تحويلات للحركات
  const textTranslateY = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const textOpacity = textAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const topIconOpacity = topIconAnim.interpolate({
    inputRange: [-150, -50, 0],
    outputRange: [0, 0.6, 1],
  });

  const bottomIconOpacity = bottomIconAnim.interpolate({
    inputRange: [0, 50, 150],
    outputRange: [1, 0.6, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.content}>
        {/* الأيقونة العلوية (icon2) */}
        <Animated.View
          style={[
            styles.iconContainer,
            styles.topIcon,
            {
              transform: [{ translateY: topIconAnim }],
              opacity: topIconOpacity,
            },
          ]}
        >
          <Image
            source={require('../assets/images/icon2.png')}
            style={styles.topIconImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* الشعار - نصان متحركان من اليمين واليسار */}
        <View style={styles.logoContainer}>
          {/* "سريع" يتحرك من اليسار */}
          <Animated.View style={{ transform: [{ translateX: sareeFastAnim }] }}>
            <Text style={styles.logoText}>سريع</Text>
          </Animated.View>
          
          {/* الخط السفلي */}
          <View style={styles.logoUnderline} />
          
          {/* "Saree3" يتحرك من اليمين */}
          <Animated.View style={{ transform: [{ translateX: sareeAnim }] }}>
            <Text style={styles.logoSubText}>Saree3</Text>
          </Animated.View>
        </View>

        {/* الأيقونة السفلية (icon1) */}
        <Animated.View
          style={[
            styles.iconContainer,
            styles.bottomIcon,
            {
              transform: [{ translateY: bottomIconAnim }],
              opacity: bottomIconOpacity,
            },
          ]}
        >
          <Image
            source={require('../assets/images/icon1.png')}
            style={styles.bottomIconImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* النصوص السفلية والمؤشر */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.tagline}>توصيل سريع وآمن</Text>
          <Text style={styles.subTagline}>الطرود الخفيفة في غزة</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.dotContainer}>
              <Animated.View style={[styles.dot, { transform: [{ scale: textAnim }] }]} />
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIcon: {
    top: '25%',
  },
  bottomIcon: {
    bottom: '25%',
  },
  topIconImage: {
    width: 100,
    height: 100,
  },
  bottomIconImage: {
    width: 110,
    height: 110,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: '100%',
  },
  logoText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 2,
    textAlign: 'center',
  },
  logoUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#2E7D32',
    borderRadius: 2,
    marginVertical: 8,
  },
  logoSubText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    letterSpacing: 3,
    textAlign: 'center',
  },
  textContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    width: '100%',
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  subTagline: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
  },
  progressContainer: {
    marginTop: 30,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#2E7D32',
  },
});