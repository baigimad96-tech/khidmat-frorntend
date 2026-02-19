import React, { useState } from 'react';
import { 
  View, TextInput, TouchableOpacity, StyleSheet, Text, 
  SafeAreaView, StatusBar, Modal, ActivityIndicator, ScrollView 
} from 'react-native';

const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const [code, setCode] = useState(''); 
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState({ title: '', body: '', isError: false });

  const email = route.params?.email || 'User Account';

  const showPopup = (title: string, body: string, isError = false) => {
    setModalMsg({ title, body, isError });
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (!modalMsg.isError && modalMsg.title === "All Set!") {
      navigation.navigate('Login');
    }
  };

  const handleReset = async () => {
    if (!newPass || !confirmPass || !code) {
      return showPopup("Wait!", "Please fill in all fields.", true);
    }
    if (newPass !== confirmPass) {
      return showPopup("Mismatch", "Passwords do not match!", true);
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          newPassword: newPass,
          confirmPassword: confirmPass,
          otp: code 
        }),
      });

      if (response.ok) {
        showPopup("All Set!", "Your password has been updated successfully.", false);
      } else {
        const errorData = await response.json();
        showPopup("Reset Failed", errorData.message || "Invalid OTP.", true);
      }
    } catch (error) {
      showPopup("Network Error", "Unable to connect to server.", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#16476A" />
      
      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.statusDot, { backgroundColor: modalMsg.isError ? '#DC2626' : '#059669' }]} />
            <Text style={styles.modalTitle}>{modalMsg.title}</Text>
            <Text style={styles.modalBody}>{modalMsg.body}</Text>
            <TouchableOpacity style={styles.modalBtnMain} onPress={handleModalClose}>
              <Text style={styles.modalBtnTextMain}>{modalMsg.isError ? 'TRY AGAIN' : 'PROCEED TO LOGIN'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.logoText}>40 NSEW</Text>
          <Text style={styles.h1}>New Password</Text>
          <Text style={styles.h2}>SETTING UP FOR: {email.toLowerCase()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>OTP CODE</Text>
          <TextInput 
            style={styles.input} 
            placeholder="6-digit code" 
            placeholderTextColor="#94A3B8" 
            value={code} 
            onChangeText={setCode} 
            keyboardType="number-pad" 
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>NEW PASSWORD</Text>
            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Text style={styles.hideShowText}>{secureText ? "SHOW" : "HIDE"}</Text>
            </TouchableOpacity>
          </View>
          <TextInput 
            style={styles.input} 
            placeholder="••••••••" 
            secureTextEntry={secureText} 
            value={newPass} 
            onChangeText={setNewPass} 
            placeholderTextColor="#94A3B8" 
          />

          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <TextInput 
            style={styles.input} 
            placeholder="••••••••" 
            secureTextEntry={secureText} 
            value={confirmPass} 
            onChangeText={setConfirmPass} 
            placeholderTextColor="#94A3B8" 
          />
          <TouchableOpacity 
            style={[styles.btnMain, loading && { opacity: 0.8 }]} 
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>RESET PASSWORD</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#F0F5F5' },
  scroll: { padding: 25 },
  header: { marginTop: 40, marginBottom: 30, alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '900', color: '#16476A', marginBottom: 5 },
  h1: { fontSize: 32, fontWeight: '900', color: '#16476A', letterSpacing: -1 },
  h2: { fontSize: 10, color: '#16476A', textAlign: 'center', marginTop: 8, fontWeight: '800', opacity: 0.6 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 30, padding: 25, elevation: 10, shadowColor: '#16476A', shadowOpacity: 0.1, shadowRadius: 15 },
  label: { fontSize: 10, fontWeight: '900', color: '#16476A', marginBottom: 8, opacity: 0.6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hideShowText: { fontSize: 10, fontWeight: '900', color: '#16476A' },
  input: { backgroundColor: '#F8FAFC', borderRadius: 15, padding: 16, borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 20, color: '#16476A', fontWeight: '700' },
  btnMain: { backgroundColor: '#16476A', paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(22, 71, 106, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 28, padding: 30, alignItems: 'center' },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#16476A', marginBottom: 8 },
  modalBody: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 25, fontWeight: '600' },
  modalBtnMain: { backgroundColor: '#16476A', paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center' },
  modalBtnTextMain: { color: '#FFF', fontWeight: '800' }
});