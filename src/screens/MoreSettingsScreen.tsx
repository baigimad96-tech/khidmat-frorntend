import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal, ActivityIndicator, StatusBar } from 'react-native';
import axios from 'axios';

const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function MoreSettingsScreen({ route, navigation }: any) {
  const { user } = route.params || {};
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.user?.role === 'ADMIN';
  const isSurveyor = user?.user?.role === 'SURVEYOR';

  const handleLogout = async () => {
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${user?.accessToken}` }
      });
      setShowLogoutModal(false);
      navigation.replace('Login');
    } catch (error) {
      navigation.replace('Login'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Administrator Section */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administrator</Text>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('UserManagement', { user })}
            >
              <Text style={styles.menuLabel}>User Management</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { marginTop: 12 }]} 
              onPress={() => navigation.navigate('DoneeApproval', { user })}
            >
              <View style={{flex: 1}}>
                <Text style={styles.menuLabel}>Donee Approval</Text>
                <Text style={styles.subLabel}>Approve survey completed donees</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { marginTop: 12 }]} 
              onPress={() => navigation.navigate('AdminAssignment', { user })}
            >
              <Text style={styles.menuLabel}>Assign Surveyors</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Surveyor Section */}
        {isSurveyor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Field Operations</Text>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('SurveyorTasks', { user })}
            >
              <Text style={styles.menuLabel}>My Assigned Tasks</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Security</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('ChangePassword', { user })}
          >
            <Text style={styles.menuLabel}>Change Password</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, {marginTop: 12}]} 
            onPress={() => setShowLogoutModal(true)}
          >
            <Text style={[styles.menuLabel, {color: '#EF4444'}]}>Logout Account</Text>
            <Text style={[styles.arrow, {color: '#EF4444'}]}>→</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>App Version 1.0.4</Text>
      </ScrollView>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.logoutIconCircle}>
                <Text style={{fontSize: 30}}>⚠️</Text>
            </View>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalBody}>Are you sure you want to sign out of your account?</Text>
            
            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={[styles.modalBtn, {backgroundColor: '#F8FAFC'}]} 
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={{color: '#64748B', fontWeight: '800'}}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, {backgroundColor: '#000'}]} 
                onPress={handleLogout}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{color: '#FFF', fontWeight: '800'}}>LOGOUT</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    paddingHorizontal: 25, 
    paddingTop: 20, 
    paddingBottom: 15, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  scroll: { padding: 25 },
  section: { marginBottom: 35 },
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#94A3B8', 
    marginBottom: 15, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5 
  },
  menuItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    paddingVertical: 20, 
    paddingHorizontal: 20, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  menuLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  subLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '500' },
  arrow: { fontSize: 18, color: '#0F172A', fontWeight: 'bold' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 30, padding: 30, alignItems: 'center' },
  logoutIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF1F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
  modalBody: { textAlign: 'center', color: '#64748B', marginBottom: 30, fontSize: 15, lineHeight: 22 },
  modalBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  versionText: { textAlign: 'center', color: '#CBD5E1', fontSize: 12, fontWeight: '600', marginTop: 10 }
});