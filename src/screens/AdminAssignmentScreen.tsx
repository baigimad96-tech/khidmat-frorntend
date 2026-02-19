import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, Alert, ScrollView, TextInput, Modal 
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

  const [visitDate, setVisitDate] = useState("2026-02-20");
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("Routine verification visit.");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const doneeRes = await axios.get(`${BASE_URL}/api/admin/users/all-donee`, {
        headers: { Authorization: `Bearer ${user.accessToken}`, 'ngrok-skip-browser-warning': 'true' }
      });
      
      const surveyorRes = await axios.get(`${BASE_URL}/api/admin/users/all-available-surveyor`, {
        headers: { Authorization: `Bearer ${user.accessToken}`, 'ngrok-skip-browser-warning': 'true' }
      });

      setDonees(doneeRes.data.donees || []);
      
      // Updated to match your API response structure
      const svs = surveyorRes.data?.surveyors || [];
      setSurveyors(svs);
      setFilteredSurveyors(svs);
    } catch (e) {
      Alert.alert("Error", "Data loading failed");
    } finally { setLoading(false); }
  };

  // Search Logic updated for fullName
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
  if (!selectedSurveyor) return Alert.alert("Wait", "Surveyor select karein");
  setAssigning(true);
  try {
    await axios.post(`${BASE_URL}/api/v1/admin/assignments`, {
      doneeId: selectedDonee.doneeId,
      // userId ki jagah surveyorId bhejein
      surveyorId: selectedSurveyor.surveyorId, 
      scheduledVisitDate: visitDate,
      priority: priority,
      assignmentNotes: notes
    }, { headers: { Authorization: `Bearer ${user.accessToken}` } });
    
    Alert.alert("Success ✨", "Surveyor assigned!");
    setSelectedDonee(null);
    setSelectedSurveyor(null);
    fetchData();
  } catch (e: any) {
    // Agar ab bhi error aaye toh message check karne ke liye:
    const errorMsg = e.response?.data?.message || "Assignment failed";
    Alert.alert("Error", errorMsg);
  } finally { setAssigning(false); }
};

  if (selectedDonee) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.detailContainer} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setSelectedDonee(null)} style={styles.backBtn}>
            <Text style={styles.backBtnTxt}>← Back to Requests</Text>
          </TouchableOpacity>

          <View style={styles.profileBox}>
            <Text style={styles.title}>{selectedDonee.fullName}</Text>
            <Text style={styles.phoneSub}>📞 {selectedDonee.phone}</Text>
            
            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoRow}><Text style={styles.labelSmall}>ROAD:</Text><Text style={styles.infoValue}>{selectedDonee.road || 'N/A'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.labelSmall}>LOCALITY:</Text><Text style={styles.infoValue}>{selectedDonee.locality || 'N/A'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.labelSmall}>CITY:</Text><Text style={styles.infoValue}>{selectedDonee.currentCity}</Text></View>
              <View style={styles.infoRow}><Text style={styles.labelSmall}>STATE:</Text><Text style={styles.infoValue}>{selectedDonee.state}</Text></View>
              <View style={styles.infoRow}><Text style={styles.labelSmall}>PINCODE:</Text><Text style={styles.infoValue}>{selectedDonee.postalCode}</Text></View>
            </View>
          </View>

          <View style={styles.formBox}>
            <Text style={styles.formTitle}>Assignment Details</Text>

            <Text style={styles.label}>SELECT AVAILABLE SURVEYOR</Text>
            <TouchableOpacity style={styles.normalDropdown} onPress={() => {
              setFilteredSurveyors(surveyors);
              setShowSurveyorModal(true);
            }}>
              <Text style={{color: selectedSurveyor ? '#000' : '#888', flex: 1}}>
                {selectedSurveyor 
                  ? `${selectedSurveyor.fullName} (${selectedSurveyor.phone})` 
                  : "Search available surveyors..."}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            <Text style={styles.label}>VISIT DATE</Text>
            <TextInput style={styles.input} value={visitDate} onChangeText={setVisitDate} />

            <Text style={styles.label}>URGENCY</Text>
            <View style={styles.priorityGroup}>
              {['NORMAL', 'HIGH', 'URGENT'].map(p => (
                <TouchableOpacity key={p} style={[styles.pButton, priority === p && styles.pActive]} onPress={() => setPriority(p)}>
                  <Text style={{color: priority === p ? '#FFF' : '#16476A', fontSize: 12, fontWeight: 'bold'}}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.assignBtn} onPress={handleAssignment} disabled={assigning}>
              {assigning ? <ActivityIndicator color="#FFF" /> : <Text style={styles.assignBtnText}>ASSIGN NOW</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal visible={showSurveyorModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.simpleListContainer}>
              <Text style={styles.modalHeader}>Available Surveyors</Text>
              <TextInput 
                style={styles.searchInput}
                placeholder="🔍 Search name..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
              />
              <FlatList 
                data={filteredSurveyors}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.listItem} 
                    onPress={() => { setSelectedSurveyor(item); setShowSurveyorModal(false); setSearchQuery(''); }}
                  >
                    {/* Fixed Display Field */}
                    <Text style={styles.listName}>{item.fullName}</Text>
                    <Text style={styles.listPhone}>📞 {item.phone || 'N/A'}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: '#999'}}>No surveyors found.</Text>}
              />
              <TouchableOpacity onPress={() => setShowSurveyorModal(false)} style={styles.cancelBtn}>
                <Text style={{color: '#EF4444', fontWeight: 'bold'}}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerText}>Verification Requests</Text></View>
      <FlatList 
        data={donees}
        keyExtractor={(item) => item.doneeId.toString()}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedDonee(item)}>
            <Text style={styles.cardName}>{item.fullName}</Text>
            <Text style={styles.cardInfo}>{item.currentCity} | {item.phone}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{padding: 15}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#16476A' },
  headerText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', padding: 18, borderRadius: 12, marginBottom: 12, elevation: 2 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  cardInfo: { fontSize: 13, color: '#64748B', marginTop: 4 },
  detailContainer: { flex: 1, padding: 15 },
  backBtn: { marginBottom: 15 },
  backBtnTxt: { color: '#16476A', fontWeight: 'bold' },
  profileBox: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  phoneSub: { fontSize: 16, color: '#16476A', marginTop: 4, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  infoGrid: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  labelSmall: { fontWeight: 'bold', width: 95, fontSize: 11, color: '#94A3B8' },
  infoValue: { fontSize: 14, color: '#334155', fontWeight: '500' },
  formBox: { marginTop: 20, backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 2 },
  formTitle: { fontSize: 17, fontWeight: 'bold', color: '#16476A' },
  label: { fontSize: 10, fontWeight: 'bold', marginTop: 15, color: '#64748B' },
  normalDropdown: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, marginTop: 6, backgroundColor: '#F8FAFC' },
  arrow: { fontSize: 12, color: '#16476A' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 10, marginTop: 6, color: '#000', backgroundColor: '#F8FAFC' },
  priorityGroup: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#16476A', borderRadius: 8, alignItems: 'center' },
  pActive: { backgroundColor: '#16476A' },
  assignBtn: { backgroundColor: '#16476A', padding: 16, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  assignBtnText: { color: '#FFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  simpleListContainer: { backgroundColor: '#FFF', width: '92%', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  searchInput: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  listItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listName: { fontSize: 16, fontWeight: '600' },
  listPhone: { fontSize: 13, color: '#059669', fontWeight: 'bold' },
  cancelBtn: { marginTop: 20, alignItems: 'center' }
});