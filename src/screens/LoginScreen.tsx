import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, ActivityIndicator, StatusBar, Modal } from 'react-native';
import axios from 'axios';

const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev'; 

export default function LoginScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false); 
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState({ title: '', body: '', isError: false });
  const [tempUserData, setTempUserData] = useState<any>(null);

  const showPopup = (title: string, body: string, isError = false, userData = null) => {
    setModalMsg({ title, body, isError });
    setTempUserData(userData);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (!modalMsg.isError && tempUserData) {
      navigation.replace('MainApp', { user: tempUserData });
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) return showPopup("Wait!", "Please enter phone number", true);
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/auth/login/send-otp`, {
        phone: phoneNumber.trim() 
      });
      setIsOtpSent(true);
      showPopup("OTP Sent", "Please check your messages", false);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "User not found with this Phone Number";
      showPopup("Error", errMsg, true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return showPopup("Wait!", "Please enter the OTP", true);
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/login/verify-otp`, {
        phone: phoneNumber.trim(),
        otpCode: otpCode
      });

      // FIX: Aapke JSON structure (res.data.data) ke hisaab se check
      if (res.data && res.data.success && res.data.data) {
        showPopup("Success ✨", "Welcome back!", false, res.data.data); 
      } else {
        showPopup("Error", "Invalid OTP or response", true);
      }
    } catch (err: any) {
      const errMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : (err.response?.data?.message || "Invalid OTP");
      showPopup("Login Failed", errMsg, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.main}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F5F5" />
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={handleModalClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.statusDot, { backgroundColor: modalMsg.isError ? '#DC2626' : '#059669' }]} />
            <Text style={styles.modalTitle}>{modalMsg.title}</Text>
            <Text style={styles.modalBody}>{modalMsg.body}</Text>
            <TouchableOpacity 
              style={[styles.modalBtn, !modalMsg.isError && { backgroundColor: '#16476A', borderColor: '#16476A' }]} 
              onPress={handleModalClose}
            >
              <Text style={[styles.modalBtnText, !modalMsg.isError && { color: '#FFF' }]}>
                {modalMsg.isError ? 'TRY AGAIN' : 'CONTINUE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.logo}>WELCOME<Text style={{color: '#16476A'}}> BACK</Text></Text>
        <Text style={styles.h1}>Login</Text>
        <Text style={styles.h2}>OTP BASED SIGN IN</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>PHONE NUMBER</Text>
        <TextInput style={styles.input} placeholder="Enter Phone Number" placeholderTextColor="#94A3B8" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" editable={!isOtpSent} />
        {isOtpSent && (
          <>
            <Text style={styles.label}>ENTER OTP</Text>
            <View style={styles.passwordWrapper}>
              <TextInput style={styles.passwordInput} placeholder="6-Digit Code" placeholderTextColor="#94A3B8" keyboardType="number-pad" value={otpCode} onChangeText={setOtpCode} />
              <TouchableOpacity onPress={() => setIsOtpSent(false)} style={styles.toggleBtn}><Text style={styles.toggleText}>CHANGE</Text></TouchableOpacity>
            </View>
          </>
        )}
        {!isOtpSent ? (
          <TouchableOpacity style={styles.btnMain} onPress={handleSendOtp} disabled={loading}>{loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>SEND OTP</Text>}</TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnMain} onPress={handleVerifyOtp} disabled={loading}>{loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>VERIFY & SIGN IN</Text>}</TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.navigate('Registration')} style={styles.footerLink}><Text style={styles.footerText}>New here? <Text style={styles.signUpText}>Create Account</Text></Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#F0F5F5', padding: 25 }, 
  header: { marginTop: 60, marginBottom: 40, alignItems: 'center' },
  logo: { fontSize: 13, fontWeight: '900', color: '#64748B', letterSpacing: 4 },
  h1: { fontSize: 44, fontWeight: '900', color: '#16476A', marginTop: 8 },
  h2: { fontSize: 10, color: '#16476A', fontWeight: '800', marginTop: 4, letterSpacing: 1.5, opacity: 0.9 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 30, elevation: 12 },
  label: { fontSize: 11, fontWeight: '800', color: '#16476A', marginBottom: 8, opacity: 0.8 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 20, color: '#16476A', fontWeight: '600' },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 20 },
  passwordInput: { flex: 1, padding: 16, color: '#16476A', fontWeight: '600' },
  toggleBtn: { paddingHorizontal: 15 },
  toggleText: { color: '#16476A', fontSize: 10, fontWeight: '900' },
  btnMain: { backgroundColor: '#16476A', paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  footerLink: { marginTop: 25, alignItems: 'center' },
  footerText: { color: '#64748B', fontSize: 14 },
  signUpText: { color: '#16476A', fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(22, 71, 106, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 28, padding: 30, alignItems: 'center' },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#16476A', marginBottom: 8 },
  modalBody: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 20 },
  modalBtn: { backgroundColor: '#F0F5F5', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', width: '100%', alignItems: 'center' },
  modalBtnText: { color: '#16476A', fontWeight: '800' }
});