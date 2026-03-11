import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, Alert, ScrollView, TextInput, Modal, StatusBar 
} from 'react-native';
import axios from 'axios';

const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function AdminAssignmentScreen({ route }: any) {
  const { user } = route.params;
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  
  const [donees, setDonees] = useState<any[]>([]);
  const [surveyors, setSurveyors] = useState<any[]>([]);
  const [filteredSurveyors, setFilteredSurveyors] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedDonee, setSelectedDonee] = useState<any>(null);
  const [showSurveyorModal, setShowSurveyorModal] = useState(false);
  const [selectedSurveyor, setSelectedSurveyor] = useState<any>(null);

  const [visitDate, setVisitDate] = useState("2026-03-15");
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("Routine verification visit.");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const doneeRes = await axios.get(`${BASE_URL}/api/admin/users/all-donee`, {
        headers: { 
          Authorization: `Bearer ${user.accessToken}`, 
          'ngrok-skip-browser-warning': 'true' 
        }
      });
      
      const surveyorRes = await axios.get(`${BASE_URL}/api/admin/users/all-available-surveyor`, {
        headers: { 
          Authorization: `Bearer ${user.accessToken}`, 
          'ngrok-skip-browser-warning': 'true' 
        }
      });

      const allDonees = doneeRes.data.donees || [];
      const pendingDonees = allDonees.filter((d: any) => d.verificationStatus !== "APPROVED");
      
      setDonees(pendingDonees);
      const svs = surveyorRes.data?.surveyors || [];
      setSurveyors(svs);
      setFilteredSurveyors(svs);
    } catch (e) {
      Alert.alert("Error", "Data loading failed");
    } finally { 
      setLoading(false); 
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredSurveyors(surveyors);
    } else {
      const filtered = surveyors.filter((s) => 
        s.fullName?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSurveyors(filtered);
    }
  };

  const handleAssignment = async () => {
    if (!selectedSurveyor) return Alert.alert("Required", "Please select a surveyor first.");
    setAssigning(true);
    try {
      await axios.post(`${BASE_URL}/api/v1/admin/assignments`, {
        doneeId: selectedDonee.doneeId,
        surveyorId: selectedSurveyor.surveyorId, 
        scheduledVisitDate: visitDate,
        priority: priority,
        assignmentNotes: notes
      }, { headers: { Authorization: `Bearer ${user.accessToken}` } });
      
      Alert.alert("Success ✨", "Surveyor assigned successfully!");
      setSelectedDonee(null);
      setSelectedSurveyor(null);
      fetchData();
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || "Assignment failed";
      Alert.alert("Error", errorMsg);
    } finally { setAssigning(false); }
  };

  // --- SUB-SCREEN: ASSIGNMENT FORM ---
  if (selectedDonee) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedDonee(null)} style={styles.backCircle}>
                <Text style={{fontSize: 20, fontWeight: '900'}}>←</Text>
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>Assign Surveyor</Text>
        </View>

        <ScrollView style={styles.detailContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.profileBox}>
            <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{(selectedDonee.fullName || 'D')[0]}</Text>
            </View>
            <Text style={styles.titleText}>{selectedDonee.fullName}</Text>
            <Text style={styles.phoneSubText}>📞 {selectedDonee.phone}</Text>
            
            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoRow}><Text style={styles.labelSmall}>CITY</Text><Text style={styles.infoValue}>{selectedDonee.currentCity}</Text></View>
              <View style={styles.infoRow}><Text style={styles.labelSmall}>LOCALITY</Text><Text style={styles.infoValue}>{selectedDonee.locality || 'N/A'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.labelSmall}>PINCODE</Text><Text style={styles.infoValue}>{selectedDonee.postalCode}</Text></View>
            </View>
          </View>

          <View style={styles.formBox}>
            <Text style={styles.formSectionTitle}>Assignment Setup</Text>

            <Text style={styles.inputLabel}>CHOOSE SURVEYOR</Text>
            <TouchableOpacity style={styles.dropdownInput} onPress={() => {
              setFilteredSurveyors(surveyors);
              setShowSurveyorModal(true);
            }}>
              <Text style={{color: selectedSurveyor ? '#000' : '#94A3B8', fontWeight: '600'}}>
                {selectedSurveyor 
                  ? `✅ ${selectedSurveyor.fullName}` 
                  : "Select available personnel..."}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>VISIT DATE (YYYY-MM-DD)</Text>
            <TextInput style={styles.modernInput} value={visitDate} onChangeText={setVisitDate} placeholder="2026-03-10" />

            <Text style={styles.inputLabel}>URGENCY LEVEL</Text>
            <View style={styles.priorityGroup}>
              {['NORMAL', 'HIGH', 'URGENT'].map(p => (
                <TouchableOpacity 
                    key={p} 
                    style={[styles.pButton, priority === p && styles.pActive]} 
                    onPress={() => setPriority(p)}
                >
                  <Text style={[styles.pButtonText, priority === p && {color: '#FFF'}]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAssignment} disabled={assigning}>
              {assigning ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>CONFIRM ASSIGNMENT</Text>}
            </TouchableOpacity>
          </View>
          <View style={{height: 40}} />
        </ScrollView>

        {/* SURVEYOR SELECTION MODAL */}
        <Modal visible={showSurveyorModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalHeaderTitle}>Available Surveyors</Text>
              <View style={styles.modalSearchWrapper}>
                <TextInput 
                    style={styles.modalSearchInput}
                    placeholder="Search by name..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
              </View>
              <FlatList 
                data={filteredSurveyors}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.modalListItem} 
                    onPress={() => { setSelectedSurveyor(item); setShowSurveyorModal(false); setSearchQuery(''); }}
                  >
                    <View>
                        <Text style={styles.listNameText}>{item.fullName}</Text>
                        <Text style={styles.listPhoneText}>ID: {item.surveyorId} • 📞 {item.phone}</Text>
                    </View>
                    <Text style={{fontSize: 18}}>➕</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptySearchTxt}>No surveyors found.</Text>}
              />
              <TouchableOpacity onPress={() => setShowSurveyorModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnTxt}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // --- MAIN SCREEN: REQUEST LIST ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.mainHeader}>
          <Text style={styles.mainHeaderTitle}>Verification Requests</Text>
          <Text style={styles.mainHeaderSub}>Assign surveyors to new applicants</Text>
      </View>

      {loading && donees.length === 0 ? (
          <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" color="#000" /></View>
      ) : (
        <FlatList 
            data={donees}
            keyExtractor={(item) => item.doneeId.toString()}
            renderItem={({item}) => (
            <TouchableOpacity style={styles.mainCard} onPress={() => setSelectedDonee(item)}>
                <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarTxt}>{(item.fullName || 'D')[0]}</Text>
                </View>
                <View style={{flex: 1, marginLeft: 15}}>
                    <Text style={styles.cardNameTxt}>{item.fullName}</Text>
                    <Text style={styles.cardLocTxt}>{item.currentCity} • {item.phone}</Text>
                </View>
                <Text style={{fontSize: 20, color: '#CBD5E1'}}>›</Text>
            </TouchableOpacity>
            )}
            contentContainerStyle={{padding: 20}}
            ListEmptyComponent={
                <View style={styles.emptyBox}>
                    <Text style={{fontSize: 50, marginBottom: 10}}>✅</Text>
                    <Text style={styles.emptyBoxTitle}>All Caught Up!</Text>
                    <Text style={styles.emptyBoxSub}>No pending verification requests found.</Text>
                </View>
            }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Header Styles
  mainHeader: { backgroundColor: '#000', padding: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
  mainHeaderTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  mainHeaderSub: { color: '#94A3B8', fontSize: 13, marginTop: 5, fontWeight: '600' },
  
  detailHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
  backCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  detailHeaderTitle: { marginLeft: 15, fontSize: 18, fontWeight: '800', color: '#000' },

  // List Screen Styles
  mainCard: { 
    backgroundColor: '#FFF', padding: 16, borderRadius: 24, marginBottom: 15, 
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 
  },
  cardAvatar: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  cardAvatarTxt: { fontSize: 20, fontWeight: '900' },
  cardNameTxt: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  cardLocTxt: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },

  // Detail Screen Styles
  detailContainer: { flex: 1, paddingHorizontal: 20 },
  profileBox: { alignItems: 'center', padding: 25, backgroundColor: '#F8FAFC', borderRadius: 30, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarLarge: { width: 80, height: 80, borderRadius: 25, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarLargeText: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  titleText: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  phoneSubText: { fontSize: 14, color: '#64748B', marginTop: 5, fontWeight: '700' },
  divider: { width: '100%', height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
  infoGrid: { width: '100%', gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  labelSmall: { fontWeight: '800', fontSize: 11, color: '#94A3B8' },
  infoValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },

  // Form Styles
  formBox: { marginTop: 25 },
  formSectionTitle: { fontSize: 18, fontWeight: '900', color: '#000', marginBottom: 5 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', marginTop: 20, marginBottom: 8 },
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center' },
  modernInput: { padding: 16, borderRadius: 15, backgroundColor: '#F1F5F9', color: '#000', fontWeight: '700', fontSize: 14 },
  arrow: { fontSize: 12, color: '#000' },
  priorityGroup: { flexDirection: 'row', gap: 10 },
  pButton: { flex: 1, padding: 14, borderRadius: 15, borderWidth: 2, borderColor: '#F1F5F9', alignItems: 'center' },
  pActive: { backgroundColor: '#000', borderColor: '#000' },
  pButtonText: { fontSize: 11, fontWeight: '900', color: '#64748B' },
  primaryBtn: { backgroundColor: '#000', padding: 18, borderRadius: 18, marginTop: 35, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, maxHeight: '85%' },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', alignSelf: 'center', borderRadius: 10, marginBottom: 20 },
  modalHeaderTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  modalSearchWrapper: { backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 15, marginBottom: 15 },
  modalSearchInput: { padding: 14, fontWeight: '700' },
  modalListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listNameText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  listPhoneText: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '600' },
  modalCloseBtn: { marginTop: 20, padding: 18, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 15 },
  modalCloseBtnTxt: { color: '#EF4444', fontWeight: '900', fontSize: 13 },

  // Empty State
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyBoxTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  emptyBoxSub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 50, fontWeight: '600' },
  emptySearchTxt: { textAlign: 'center', marginVertical: 30, color: '#94A3B8', fontWeight: '700' }
});