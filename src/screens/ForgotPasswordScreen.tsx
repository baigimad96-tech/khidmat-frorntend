import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Text, 
  SafeAreaView, 
  StatusBar, 
  Modal, 
  ActivityIndicator, 
  Alert 
} from 'react-native';

const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password?email=${email}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setLoading(false);
        setModalVisible(true);
      } else {
        const errorData = await response.json();
        setLoading(false);
        Alert.alert("Request Failed", errorData.message || "Could not send OTP. Please try again.");
      }
    } catch (error) {
      setLoading(false);
      console.error("Network Error:", error);
      Alert.alert(
        "Network Error", 
        "Unable to connect to the server. Please check your internet or Ngrok status."
      );
    }
  };

  const closeModalAndNavigate = () => {
    setModalVisible(false);
    navigation.navigate('ResetPassword', { email: email });
  };

  return (
    <SafeAreaView style={styles.main}>
      <StatusBar barStyle="light-content" backgroundColor="#16476A" />
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModalAndNavigate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.statusDot, { backgroundColor: '#059669' }]} />
            
            <Text style={styles.modalTitle}>Check Email</Text>
            <Text style={styles.modalBody}>
              We've sent a password reset code to{"\n"}
              <Text style={{color: '#16476A', fontWeight: 'bold'}}>{email || 'your email'}</Text>
            </Text>
            
            <TouchableOpacity 
              style={styles.modalBtnMain} 
              onPress={closeModalAndNavigate}
            >
              <Text style={styles.modalBtnTextMain}>ENTER CODE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.logoText}>40 NSEW</Text>
        <Text style={styles.h1}>Forgot Password</Text>
        <Text style={styles.h2}>WE WILL SEND A RESET CODE TO YOUR EMAIL</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput 
          style={styles.input} 
          placeholder="user@domain.com" 
          placeholderTextColor="#94A3B8"
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address"
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.btnMain, loading && { opacity: 0.8 }]} 
          onPress={handleSendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>SEND CODE</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.footerLink}
          disabled={loading}
        >
          <Text style={styles.footerText}>Back to <Text style={styles.logLink}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#F0F5F5', padding: 25 },
  header: { marginTop: 60, marginBottom: 40, alignItems: 'center' },
  logoText: { fontSize: 22, fontWeight: '900', color: '#16476A', marginBottom: 5 },
  h1: { fontSize: 32, fontWeight: '900', color: '#16476A', letterSpacing: -1 },
  h2: { fontSize: 10, color: '#16476A', textAlign: 'center', marginTop: 10, fontWeight: '800', letterSpacing: 1.2, opacity: 0.6 },
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 30, 
    padding: 25, 
    elevation: 10, 
    shadowColor: '#16476A', 
    shadowOpacity: 0.1, 
    shadowRadius: 15 
  },
  label: { fontSize: 10, fontWeight: '900', color: '#16476A', marginBottom: 8, letterSpacing: 1, opacity: 0.6 },
  input: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 15, 
    padding: 16, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    marginBottom: 25, 
    color: '#16476A',
    fontWeight: '700'
  },
  btnMain: { 
    backgroundColor: '#16476A', 
    paddingVertical: 18, 
    borderRadius: 15, 
    alignItems: 'center',
    elevation: 4
  },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  footerLink: { marginTop: 25, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  logLink: { color: '#16476A', fontWeight: '900' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 71, 106, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
    elevation: 20
  },
  statusDot: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    marginBottom: 15 
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#16476A',
    marginBottom: 8
  },
  modalBody: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
    fontWeight: '600'
  },
  modalBtnMain: {
    backgroundColor: '#16476A',
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center'
  },
  modalBtnTextMain: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1
  }
});