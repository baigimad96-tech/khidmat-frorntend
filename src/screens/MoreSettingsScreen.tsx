import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal, ActivityIndicator } from 'react-native';
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Administrator Section */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Administrator</Text>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('UserManagement', { user })}
            >
              <Text style={styles.menuLabel}>User Management</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            {/* NAYA SECTION: DONEE APPROVAL CARD */}
            <TouchableOpacity 
              style={[styles.menuItem, { marginTop: 15 }]} 
              onPress={() => navigation.navigate('DoneeApproval', { user })}
            >
              <View>
                <Text style={styles.menuLabel}>Donee Approval</Text>
                <Text style={styles.subLabel}>Approve survey completed donees</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { marginTop: 15, marginBottom: 25 }]} 
              onPress={() => navigation.navigate('AdminAssignment', { user })}
            >
              <Text style={styles.menuLabel}>Assign Surveyors</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Surveyor Section */}
        {isSurveyor && (
          <>
            <Text style={styles.sectionTitle}>Field Operations</Text>
            <TouchableOpacity 
              style={[styles.menuItem, { marginBottom: 25 }]} 
              onPress={() => navigation.navigate('SurveyorTasks', { user })}
            >
              <Text style={styles.menuLabel}>My Assigned Tasks</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionTitle}>Account & Security</Text>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('ChangePassword', { user })}
        >
          <Text style={styles.menuLabel}>Change Password</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, {marginTop: 20}]} 
          onPress={() => setShowLogoutModal(true)}
        >
          <Text style={[styles.menuLabel, {color: '#FF3B30'}]}>Logout Account</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout?</Text>
            <Text style={styles.modalBody}>Do you want to Logout</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={[styles.modalBtn, {backgroundColor: '#F1F5F9'}]} 
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={{color: '#64748B', fontWeight: 'bold'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, {backgroundColor: '#FF3B30'}]} 
                onPress={handleLogout}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{color: '#FFF', fontWeight: 'bold'}}>Logout</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 25, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#16476A' },
  scroll: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94A3B8', marginBottom: 15, textTransform: 'uppercase' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 18, elevation: 1 },
  menuLabel: { fontSize: 16, fontWeight: '700', color: '#16476A' },
  subLabel: { fontSize: 12, color: '#94A3B8', marginTop: 2 }, // Naya style sub-text ke liye
  arrow: { fontSize: 20, color: '#CBD5E1' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 25, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#16476A', marginBottom: 10 },
  modalBody: { textAlign: 'center', color: '#64748B', marginBottom: 25 },
  modalBtnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' }
});