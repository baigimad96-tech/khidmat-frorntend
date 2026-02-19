import React, { useState } from 'react';
import { 
  View, TextInput, TouchableOpacity, StyleSheet, Text, 
  SafeAreaView, StatusBar, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import axios from 'axios';

const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function ChangePasswordScreen({ route, navigation }: any) {
  const { user } = route.params || {};
  const token = user?.accessToken;
  const userId = user?.userId || user?.id; 
  
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState({ title: '', body: '', isError: false });

  const showPopup = (title: string, body: string, isError = false) => {
    setModalMsg({ title, body, isError });
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (!modalMsg.isError && modalMsg.title === "Success ✨") {
      navigation.goBack();
    }
  };

  const handleChangePassword = async () => {
    if (!token || !userId) {
      return showPopup("Error", "Session details missing. Please login again.", true);
    }

    if (!oldPass || !newPass || !confirmPass) {
      return showPopup("Wait!", "Fields cannot be empty", true);
    }

    if (newPass !== confirmPass) {
      return showPopup("Error", "New password and confirm password do not match", true);
    }

    setLoading(true);

    try {
      const response = await axios.put(
        `${BASE_URL}/user/change-password/${userId}`, 
        {
          oldPassword: oldPass,
          newPassword: newPass,
          confirmPassword: confirmPass
        },
        {
          headers: {
             'Authorization': `Bearer ${token}`, 
             'Content-Type': 'application/json',
             'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      setLoading(false);
      showPopup("Success ✨", "Password updated successfully!", false);

    } catch (error: any) {
      setLoading(false);
      const msg = error.response?.data?.message || "Password change failed";
      showPopup("Failed", msg, true);
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
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <View>
                <Text style={styles.h1}>Update Password</Text>
            </View>
          </View>

          <View style={styles.card}>
            
            <Text style={styles.label}>CURRENT PASSWORD</Text>
            <View style={styles.passwordWrapper}>
              <TextInput 
                style={styles.passwordInput} 
                secureTextEntry={!showOld} 
                value={oldPass} 
                onChangeText={setOldPass} 
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowOld(!showOld)} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>{showOld ? "HIDE" : "SHOW"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>NEW PASSWORD</Text>
            <View style={styles.passwordWrapper}>
              <TextInput 
                style={styles.passwordInput} 
                secureTextEntry={!showNew} 
                value={newPass} 
                onChangeText={setNewPass} 
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>{showNew ? "HIDE" : "SHOW"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
            <View style={styles.passwordWrapper}>
              <TextInput 
                style={styles.passwordInput} 
                secureTextEntry={!showConfirm} 
                value={confirmPass} 
                onChangeText={setConfirmPass} 
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>{showConfirm ? "HIDE" : "SHOW"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.btnMain, loading && { opacity: 0.7 }]} 
              onPress={handleChangePassword} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>UPDATE NOW</Text>
              )}
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, backgroundColor: '#F0F5F5' },
  header: { marginTop: 40, marginBottom: 40, paddingHorizontal: 25, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 20, backgroundColor: '#FFF', padding: 10, borderRadius: 12, elevation: 2 },
  backArrow: { fontSize: 20, color: '#16476A', fontWeight: '900' },
  h1: { fontSize: 28, fontWeight: '900', color: '#16476A', marginTop: 4 },
  
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 32, 
    padding: 30, 
    marginHorizontal: 25,
    shadowColor: '#16476A', 
    shadowOpacity: 0.1, 
    shadowRadius: 20,
    elevation: 12 
  },
  label: { fontSize: 11, fontWeight: '800', color: '#16476A', marginBottom: 8, opacity: 0.8 },
  
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: '#16476A',
    fontWeight: '600',
  },
  toggleBtn: {
    paddingHorizontal: 15,
  },
  toggleText: {
    color: '#16476A',
    fontSize: 10,
    fontWeight: '900',
  },

  btnMain: { 
    backgroundColor: '#16476A', 
    paddingVertical: 18, 
    borderRadius: 18, 
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#16476A',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6
  },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 71, 106, 0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center'
  },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#16476A', marginBottom: 8 },
  modalBody: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 20 },
  modalBtn: {
    backgroundColor: '#F0F5F5',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    alignItems: 'center'
  },
  modalBtnText: { color: '#16476A', fontWeight: '800' }
});