import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  View, TextInput, TouchableOpacity, StyleSheet, Text, 
  ActivityIndicator, StatusBar, KeyboardAvoidingView, 
  Platform, Dimensions, Alert, Image
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://taylor-unirritant-latina.ngrok-free.dev'; 
const PRIMARY_GREEN = '#42b212'; // Naya Green Color
const LIGHT_GREY = '#F8FAFC';
const TEXT_DARK = '#0F172A';

export default function LoginScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false); 
  const [isSuccess, setIsSuccess] = useState(false); 
  const [userData, setUserData] = useState<any>(null);

  const handleSendOtp = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit number");
      return;
    }
    setLoading(true);
    try {
      const fullNumber = `+91${phoneNumber.trim()}`;
      await axios.post(`${BASE_URL}/auth/login/send-otp`, { phone: fullNumber });
      setIsOtpSent(true);
    } catch (err: any) {
      Alert.alert("Failed", "Server error. Try again later.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return;
    setLoading(true);
    try {
      const fullNumber = `+91${phoneNumber.trim()}`;
      const res = await axios.post(`${BASE_URL}/auth/login/verify-otp`, { 
        phone: fullNumber, otpCode 
      });
      if (res.data?.success) {
        setUserData(res.data.data);
        setIsSuccess(true);
      }
    } catch (err: any) { Alert.alert("Error", "Invalid OTP code"); }
    finally { setLoading(false); }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.successScreen}>
        <View style={styles.successContent}>
          <View style={styles.successIconWrapper}>
             <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Verified!</Text>
          <Text style={styles.successSub}>Your identity has been confirmed.</Text>
          
          {/* Ye raha wide button */}
          <TouchableOpacity 
            style={[styles.greenBtn, { width: width * 0.8 }]} 
            onPress={() => navigation.replace('MainApp', { user: userData })}
          >
            <Text style={styles.btnTextWhite}>GET STARTED</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.inner}>
          
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../logo/KHIDMAT APP.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.heading}>{!isOtpSent ? "Welcome Back" : "Verify OTP"}</Text>
            <Text style={styles.subHeading}>
              {!isOtpSent ? "Enter your phone number to continue" : `We've sent a code to +91 ${phoneNumber}`}
            </Text>
          </View>

          <View style={styles.formSection}>
            {!isOtpSent ? (
              <View style={styles.inputStack}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryBox}>
                    <Text style={styles.countryText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput 
                    style={styles.mainInput} 
                    placeholder="00000 00000" 
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.otpStack}>
                <TextInput 
                  style={styles.otpInvisibleInput} 
                  keyboardType="number-pad" 
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  autoFocus
                />
                <View style={styles.otpRow}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.otpCircle, 
                        { 
                          borderColor: otpCode[i] ? PRIMARY_GREEN : '#E2E8F0',
                          backgroundColor: otpCode[i] ? '#f1fdf0' : '#FFF'
                        }
                      ]}
                    >
                      <Text style={styles.otpValue}>{otpCode[i] || ""}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.greenBtn, loading && { opacity: 0.7 }]} 
              onPress={!isOtpSent ? handleSendOtp : handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.btnTextWhite}>{!isOtpSent ? "CONTINUE" : "VERIFY NOW"}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity onPress={() => !isOtpSent ? navigation.navigate('Registration') : setIsOtpSent(false)}>
              <Text style={styles.footerText}>
                {!isOtpSent ? "Don't have an account? " : "Entered wrong number? "}
                <Text style={styles.linkText}>{!isOtpSent ? "Register" : "Go Back"}</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { 
    flex: 1, 
    paddingHorizontal: 35, 
    alignItems: 'center' 
  },
  topSection: { 
    marginTop: 60, 
    alignItems: 'center', 
    marginBottom: 35 
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
  },
  logoImage: { width: '100%', height: '100%' },
  heading: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: TEXT_DARK, 
    textAlign: 'center', 
    letterSpacing: -0.8
  },
  subHeading: { 
    fontSize: 15, 
    color: '#64748B', 
    marginTop: 8, 
    fontWeight: '500', 
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20
  },
  formSection: { 
    width: '100%', 
    alignItems: 'center',
    marginTop: 10
  },
  inputStack: { width: '100%' },
  inputLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#475569', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5,
    marginLeft: 4
  },
  phoneInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: LIGHT_GREY, 
    borderRadius: 16, 
    height: 60, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    width: '100%',
  },
  countryBox: { borderRightWidth: 1, borderColor: '#CBD5E1', paddingRight: 12, marginRight: 15 },
  countryText: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  mainInput: { flex: 1, fontSize: 17, color: TEXT_DARK, fontWeight: '700', letterSpacing: 1 },
  otpStack: { width: '100%', alignItems: 'center' },
  otpRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%',
  },
  otpCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 12, 
    borderWidth: 2, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 2,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  otpValue: { fontSize: 20, fontWeight: '900', color: TEXT_DARK },
  otpInvisibleInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%', zIndex: 1 },
  greenBtn: { 
    backgroundColor: PRIMARY_GREEN, 
    height: 58, 
    width: '100%', // Ye sabhi buttons ko choda rakhta hai
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 35,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  btnTextWhite: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1.2 },
  bottomSection: { marginTop: 40, alignItems: 'center' },
  footerText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  linkText: { color: PRIMARY_GREEN, fontWeight: '800' },
  successScreen: { flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  successContent: { alignItems: 'center', paddingHorizontal: 40, width: '100%' },
  successIconWrapper: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    backgroundColor: PRIMARY_GREEN, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 25,
    elevation: 10,
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.5,
  },
  checkIcon: { color: '#FFF', fontSize: 40, fontWeight: 'bold' },
  successTitle: { fontSize: 28, fontWeight: '900', color: TEXT_DARK, marginBottom: 10 },
  successSub: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 30 }
});