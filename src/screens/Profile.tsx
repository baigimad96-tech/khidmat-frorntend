import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, 
  TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Image, StatusBar, Dimensions, Modal 
} from 'react-native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');
const BASE_URL = "https://perchable-freewheeling-faye.ngrok-free.dev"; 

export default function ProfileScreen({ route, navigation }: any) {
  const { user } = route.params || {};

  const token = user?.accessToken;
  const userId = user?.user?.userId || user?.userId || user?.id; 

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isOptionsModalVisible, setOptionsModalVisible] = useState(false);
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'remove'>('remove');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ title: '', body: '', isError: false });
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [profileImgUri, setProfileImgUri] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    whatsappNumber: '',
    alternatePhone: '',
    bio: '',
    email: '',
    phone: '', 
    role: ''
  });

  const showStatus = (title: string, body: string, isError = false) => {
    setStatusMsg({ title, body, isError });
    setStatusModalVisible(true);
  };

  const fetchProfile = useCallback(async () => {
    if (!token || !userId) return;
    setFetching(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/user/profile/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.data && res.data.success) {
        const d = res.data.data;
        setFormData({
          firstName: d.firstName || d.firsName || '',
          middleName: d.middleName || '',
          lastName: d.lastName || '',
          gender: d.gender || '',
          dateOfBirth: d.dateOfBirth || '',
          whatsappNumber: d.whatsappNumber || '',
          alternatePhone: d.alternatePhone || '',
          bio: d.bio || '',
          email: d.email || '',
          phone: d.phone || '',
          role: d.role || ''
        });
        const path = d.profilePhotoUrl || d.imagePath;
        if (path) {
           const fileName = path.split('/').pop();
           setProfileImgUri(`${BASE_URL}/api/profile/image/${fileName}?t=${new Date().getTime()}`);
        } else {
           setProfileImgUri(null);
        }
      }
    } catch (e) { console.log("Fetch Error:", e); } finally { setFetching(false); }
  }, [token, userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleImageAction = async () => {
    if (!userId || !token) return;
    setLoading(true);
    try {
      if (modalType === 'add' && selectedImage) {
        const data = new FormData();
        data.append('image', { uri: selectedImage.uri, type: selectedImage.type || 'image/jpeg', name: 'profile.jpg' } as any);
        await axios.post(`${BASE_URL}/api/profile/image/${userId}`, data, { 
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' } 
        });
        showStatus("Success ✨", "Photo updated!");
      } else if (modalType === 'remove') {
        await axios.delete(`${BASE_URL}/api/profile/image/${userId}`, { 
          headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } 
        });
        showStatus("Deleted 🗑️", "Photo removed!");
      }
      setSelectedImage(null);
      setTimeout(() => fetchProfile(), 1000); 
    } catch (e) { showStatus("Error", "Action failed", true); } finally { 
        setLoading(false); 
        setConfirmModalVisible(false); 
    }
  };

  const handleUpdateDetails = async () => {
    setLoading(true);
    try {
      const payload = { ...formData, gender: formData.gender ? formData.gender.toUpperCase() : '' };
      await axios.put(`${BASE_URL}/api/v1/user/profile/${userId}`, payload, { 
        headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } 
      });
      setEditModalVisible(false);
      showStatus("Success ✨", "Profile updated!");
      fetchProfile();
    } catch (e: any) { 
        showStatus("Error", e.response?.data?.message || "Update failed", true); 
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#16476A" />

      {/* --- MODERN EDIT MODAL --- */}
      <Modal visible={isEditModalVisible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.editContainer}>
          <View style={styles.editNavbar}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.navCloseBtn}>
              <Text style={styles.navCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleUpdateDetails} disabled={loading} style={styles.navSaveBtn}>
              {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.navSaveText}>SAVE</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
            <View style={styles.editSection}>
               <Text style={styles.sectionHeader}>👤 Personal Details</Text>
               <View style={styles.card}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput style={styles.modernInput} value={formData.firstName} onChangeText={(t)=>setFormData({...formData, firstName:t})} placeholder="Enter first name" />
                  <Text style={styles.inputLabel}>Middle Name</Text>
                  <TextInput style={styles.modernInput} value={formData.middleName} onChangeText={(t)=>setFormData({...formData, middleName:t})} placeholder="Optional" />
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput style={styles.modernInput} value={formData.lastName} onChangeText={(t)=>setFormData({...formData, lastName:t})} placeholder="Enter last name" />
                  <View style={{flexDirection: 'row', gap: 12}}>
                    <View style={{flex: 1}}>
                      <Text style={styles.inputLabel}>Gender</Text>
                      <TextInput style={styles.modernInput} value={formData.gender} onChangeText={(t)=>setFormData({...formData, gender:t})} placeholder="MALE/FEMALE" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.inputLabel}>Birthday</Text>
                      <TextInput style={styles.modernInput} value={formData.dateOfBirth} onChangeText={(t)=>setFormData({...formData, dateOfBirth:t})} placeholder="YYYY-MM-DD" />
                    </View>
                  </View>
               </View>
            </View>

            <View style={styles.editSection}>
               <Text style={styles.sectionHeader}>📞 Contact Info</Text>
               <View style={styles.card}>
                  <Text style={styles.inputLabel}>WhatsApp Number</Text>
                  <TextInput style={styles.modernInput} value={formData.whatsappNumber} onChangeText={(t)=>setFormData({...formData, whatsappNumber:t})} keyboardType="phone-pad" />
                  <Text style={styles.inputLabel}>Alternate Phone</Text>
                  <TextInput style={styles.modernInput} value={formData.alternatePhone} onChangeText={(t)=>setFormData({...formData, alternatePhone:t})} keyboardType="phone-pad" />
               </View>
            </View>

            <View style={styles.editSection}>
               <Text style={styles.sectionHeader}>📝 About You</Text>
               <View style={styles.card}>
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput style={[styles.modernInput, {height: 100, textAlignVertical: 'top'}]} multiline value={formData.bio} onChangeText={(t)=>setFormData({...formData, bio:t})} placeholder="Briefly describe yourself..." />
               </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Header */}
      <View style={styles.headerBlue}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)}><Text style={{color:'#FFF', fontSize: 28}}>≡</Text></TouchableOpacity>
          <Text style={styles.logoText}>40 NSEW</Text>
          <View style={{width: 30}} />
      </View>

      {/* Main Content Card */}
      <View style={styles.mainContent}>
          <View style={styles.miniProfileCard}>
            <TouchableOpacity onPress={() => setOptionsModalVisible(true)} style={styles.miniAvatar}>
               {fetching ? <ActivityIndicator size="small" /> : profileImgUri ? (
                <Image 
                  key={profileImgUri} 
                  source={{ uri: profileImgUri, headers: { 'ngrok-skip-browser-warning': 'true', 'Authorization': `Bearer ${token}` } }} 
                  style={styles.fullImg} 
                  resizeMode="cover" 
                />
               ) : <Text style={styles.miniInitial}>{formData.firstName ? formData.firstName[0].toUpperCase() : 'U'}</Text>}
            </TouchableOpacity>
            <View style={styles.miniInfo}>
                <Text style={styles.miniName}>{formData.firstName} {formData.lastName}</Text>
                <View style={styles.miniRow}>
                  <View style={styles.badge}><Text style={styles.badgeTxt}>{formData.role}</Text></View>
                  <Text style={styles.miniPhone}>{formData.phone || 'No Phone'}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.pencilBtn}><Text style={{fontSize: 20}}>✎</Text></TouchableOpacity>
          </View>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Hello, {formData.firstName}! 👋</Text>
            <Text style={styles.welcomeSub}>Your current ID is {userId}. Update your details using the edit icon above.</Text>
          </View>
      </View>

      {/* Photo Options Modal */}
      <Modal visible={isOptionsModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.bottomOverlay} activeOpacity={1} onPress={() => setOptionsModalVisible(false)}>
          <View style={styles.optionsSheet}>
            <Text style={styles.sheetTitle}>Profile Photo</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#F1F5F9'}]} onPress={() => { 
                setOptionsModalVisible(false); 
                launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (r) => { 
                  if(r.assets) { setSelectedImage(r.assets[0]); setModalType('add'); setConfirmModalVisible(true); }
                }) 
              }}><Text style={{color: '#16476A', fontWeight: 'bold'}}>CHANGE</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#FEE2E2'}]} onPress={() => { setOptionsModalVisible(false); setModalType('remove'); setConfirmModalVisible(true); }} disabled={!profileImgUri}>
                <Text style={{color: '#EF4444', fontWeight: 'bold'}}>DELETE</Text></TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirm Action Modal (Preview Logic Fixed) */}
      <Modal visible={isConfirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalType === 'add' && selectedImage && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                <Text style={styles.previewLabel}>NEW PREVIEW</Text>
              </View>
            )}
            <Text style={styles.modalTitle}>Confirm Action</Text>
            <Text style={styles.modalBody}>Do you want to proceed with this photo update?</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#F1F5F9'}]} onPress={()=>{setConfirmModalVisible(false); setSelectedImage(null);}}><Text>No</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#16476A'}]} onPress={()=>handleImageAction()}>
                {loading ? <ActivityIndicator color="#FFF"/> : <Text style={{color:'#FFF', fontWeight:'bold'}}>Yes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal visible={statusModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
            <Text style={[styles.modalTitle, {color: statusMsg.isError ? '#EF4444' : '#16476A'}]}>{statusMsg.title}</Text>
            <Text style={styles.modalBody}>{statusMsg.body}</Text>
            <TouchableOpacity style={styles.modalBtnMain} onPress={() => setStatusModalVisible(false)}><Text style={{color:'#FFF', fontWeight:'bold'}}>OK</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  editContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  editNavbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  navCloseBtn: { width: 35, height: 35, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  navCloseText: { color: '#64748B', fontWeight: 'bold' },
  navTitle: { fontSize: 17, fontWeight: '800', color: '#16476A' },
  navSaveBtn: { backgroundColor: '#16476A', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  navSaveText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  editSection: { marginTop: 20, paddingHorizontal: 20 },
  sectionHeader: { fontSize: 13, fontWeight: '900', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 5, marginTop: 12 },
  modernInput: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', color: '#16476A', fontSize: 15 },
  headerBlue: { height: 70, backgroundColor: '#16476A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  logoText: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  mainContent: { padding: 20 },
  miniProfileCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 15, flexDirection: 'row', alignItems: 'center', elevation: 8, shadowColor: '#16476A', shadowOpacity: 0.15, shadowRadius: 10 },
  miniAvatar: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#E2E8F0' },
  fullImg: { width: '100%', height: '100%' },
  miniInitial: { fontSize: 28, fontWeight: 'bold', color: '#16476A' },
  miniInfo: { flex: 1, marginLeft: 15 },
  miniName: { fontSize: 18, fontWeight: 'bold', color: '#16476A' },
  miniRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  badge: { backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  badgeTxt: { fontSize: 9, fontWeight: 'bold', color: '#0369A1' },
  miniPhone: { fontSize: 12, color: '#64748B' },
  pencilBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  welcomeContainer: { marginTop: 40, alignItems: 'center', paddingHorizontal: 30 },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#16476A', marginBottom: 10 },
  welcomeSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#16476A', marginBottom: 10 },
  modalBody: { textAlign: 'center', color: '#64748B', marginBottom: 25, fontSize: 14 },
  modalBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  modalBtnMain: { backgroundColor: '#16476A', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  optionsSheet: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#16476A', textAlign: 'center', marginBottom: 25 },
  previewContainer: { alignItems: 'center', marginBottom: 15 },
  previewImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#16476A' },
  previewLabel: { fontSize: 10, fontWeight: 'bold', color: '#16476A', marginTop: 5 }
});