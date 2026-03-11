import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, 
  TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Image, StatusBar, Dimensions, Modal 
} from 'react-native';
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');
const BASE_URL = "https://taylor-unirritant-latina.ngrok-free.dev"; 
const PRIMARY_GREEN = '#42b212'; // Aapka color

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
    firstName: '', middleName: '', lastName: '', gender: '', dateOfBirth: '',
    whatsappNumber: '', alternatePhone: '', bio: '', email: '', phone: '', role: ''
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
        } else { setProfileImgUri(null); }
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* --- EDIT MODAL --- */}
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
                <Text style={styles.sectionHeader}>Personal Details</Text>
                <View style={styles.card}>
                   <Text style={styles.inputLabel}>First Name</Text>
                   <TextInput style={styles.modernInput} value={formData.firstName} selectionColor={PRIMARY_GREEN} onChangeText={(t)=>setFormData({...formData, firstName:t})} placeholder="First name" />
                   <Text style={styles.inputLabel}>Last Name</Text>
                   <TextInput style={styles.modernInput} value={formData.lastName} selectionColor={PRIMARY_GREEN} onChangeText={(t)=>setFormData({...formData, lastName:t})} placeholder="Last name" />
                   <View style={{flexDirection: 'row', gap: 12}}>
                    <View style={{flex: 1}}>
                      <Text style={styles.inputLabel}>Gender</Text>
                      <TextInput style={styles.modernInput} value={formData.gender} onChangeText={(t)=>setFormData({...formData, gender:t})} placeholder="M/F" />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.inputLabel}>Birthday</Text>
                      <TextInput style={styles.modernInput} value={formData.dateOfBirth} onChangeText={(t)=>setFormData({...formData, dateOfBirth:t})} placeholder="YYYY-MM-DD" />
                    </View>
                   </View>
                </View>
            </View>

            <View style={styles.editSection}>
                <Text style={styles.sectionHeader}>Contact Info</Text>
                <View style={styles.card}>
                   <Text style={styles.inputLabel}>WhatsApp Number</Text>
                   <TextInput style={styles.modernInput} selectionColor={PRIMARY_GREEN} value={formData.whatsappNumber} onChangeText={(t)=>setFormData({...formData, whatsappNumber:t})} keyboardType="phone-pad" />
                </View>
            </View>

            <View style={styles.editSection}>
                <Text style={styles.sectionHeader}>About You</Text>
                <View style={styles.card}>
                   <Text style={styles.inputLabel}>Bio</Text>
                   <TextInput style={[styles.modernInput, {height: 100, textAlignVertical: 'top'}]} selectionColor={PRIMARY_GREEN} multiline value={formData.bio} onChangeText={(t)=>setFormData({...formData, bio:t})} placeholder="Tell us about yourself..." />
                </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Header */}
      <View style={styles.headerWhite}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)}><Text style={{color: PRIMARY_GREEN, fontSize: 32, fontWeight:'bold'}}>≡</Text></TouchableOpacity>
          <Text style={styles.logoText}>Khidmat</Text>
          <View style={{width: 30}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
            <View style={styles.miniProfileCard}>
              <TouchableOpacity onPress={() => setOptionsModalVisible(true)} style={styles.miniAvatar}>
                 {fetching ? <ActivityIndicator size="small" color={PRIMARY_GREEN} /> : profileImgUri ? (
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
              <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.pencilBtn}><Text style={{fontSize: 20, color: PRIMARY_GREEN }}>✎</Text></TouchableOpacity>
            </View>

            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Hello, {formData.firstName}! 👋</Text>
              <Text style={styles.welcomeSub}>Manage your account settings and profile details here.</Text>
            </View>

            {/* --- ACTION CARDS (Green Theme) --- */}
            {formData.role === 'SURVEYOR' && (
              <TouchableOpacity style={styles.greenActionCard} onPress={() => navigation.navigate('Registration')}>
                <View style={{flex: 1}}>
                  <Text style={styles.actionTitleWhite}>Create Donee</Text>
                  <Text style={styles.actionSubWhite}>Register a new profile in the system</Text>
                </View>
                <View style={styles.arrowCircle}><Text style={styles.arrowIcon}>→</Text></View>
              </TouchableOpacity>
            )}

            {formData.role === 'DONOR' && (
              <TouchableOpacity style={styles.greenActionCard} onPress={() => navigation.navigate('AllApprovedDonees', { user })}>
                <View style={{flex: 1}}>
                  <Text style={styles.actionTitleWhite}>View Donees</Text>
                  <Text style={styles.actionSubWhite}>Browse families who need support</Text>
                </View>
                <View style={styles.arrowCircle}><Text style={styles.arrowIcon}>→</Text></View>
              </TouchableOpacity>
            )}
        </View>
      </ScrollView>

      {/* --- PHOTO OPTIONS MODAL --- */}
      <Modal visible={isOptionsModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.bottomOverlay} activeOpacity={1} onPress={() => setOptionsModalVisible(false)}>
          <View style={styles.optionsSheet}>
            <View style={styles.sheetBar} />
            <Text style={styles.sheetTitle}>Profile Photo</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: PRIMARY_GREEN}]} onPress={() => { 
                setOptionsModalVisible(false); 
                launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (r) => { 
                  if(r.assets) { setSelectedImage(r.assets[0]); setModalType('add'); setConfirmModalVisible(true); }
                }) 
              }}><Text style={{color: '#FFF', fontWeight: '800'}}>CHANGE</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#FEE2E2'}]} onPress={() => { setOptionsModalVisible(false); setModalType('remove'); setConfirmModalVisible(true); }} disabled={!profileImgUri}>
                <Text style={{color: '#EF4444', fontWeight: '800'}}>DELETE</Text></TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- CONFIRM MODAL --- */}
      <Modal visible={isConfirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.statusIcon, {backgroundColor: '#f0fdf4'}]}>
                <Text style={{fontSize: 30, color: PRIMARY_GREEN}}>?</Text>
            </View>
            <Text style={styles.modalTitle}>Confirm Action</Text>
            <Text style={styles.modalBody}>Are you sure you want to update your profile photo?</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor:'#F1F5F9'}]} onPress={()=>{setConfirmModalVisible(false); setSelectedImage(null);}}><Text style={{fontWeight:'700', color: '#475569'}}>No</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: PRIMARY_GREEN}]} onPress={()=>handleImageAction()}>
                {loading ? <ActivityIndicator color="#FFF"/> : <Text style={{color:'#FFF', fontWeight:'800'}}>YES, PROCEED</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- STATUS MODAL --- */}
      <Modal visible={statusModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
            <Text style={[styles.modalTitle, {color: statusMsg.isError ? '#EF4444' : PRIMARY_GREEN}]}>{statusMsg.title}</Text>
            <Text style={styles.modalBody}>{statusMsg.body}</Text>
            <TouchableOpacity style={styles.modalBtnMain} onPress={() => setStatusModalVisible(false)}><Text style={{color:'#FFF', fontWeight:'800'}}>CONTINUE</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  editContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  editNavbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 70, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  navCloseBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  navCloseText: { color: '#64748B', fontWeight: 'bold' },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  navSaveBtn: { backgroundColor: PRIMARY_GREEN, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  navSaveText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  editSection: { marginTop: 25, paddingHorizontal: 20 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: PRIMARY_GREEN, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#f8fafc', borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: '#F1F5F9' },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 8, marginTop: 10, textTransform: 'uppercase' },
  modernInput: { backgroundColor: '#FFF', borderRadius: 14, padding: 15, borderWidth: 1.5, borderColor: '#E2E8F0', color: '#0F172A', fontSize: 15, fontWeight: '600' },
  headerWhite: { height: 70, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25 },
  logoText: { color: '#0F172A', fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  mainContent: { padding: 25 },
  miniProfileCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, flexDirection: 'row', alignItems: 'center', elevation: 10, shadowColor: PRIMARY_GREEN, shadowOpacity: 0.1, shadowRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  miniAvatar: { width: 75, height: 75, borderRadius: 25, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: PRIMARY_GREEN },
  fullImg: { width: '100%', height: '100%' },
  miniInitial: { fontSize: 32, fontWeight: '800', color: PRIMARY_GREEN },
  miniInfo: { flex: 1, marginLeft: 15 },
  miniName: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  miniRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badge: { backgroundColor: PRIMARY_GREEN, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 8 },
  badgeTxt: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  miniPhone: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  pencilBtn: { position: 'absolute', top: 15, right: 15, width: 38, height: 38, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#dcfce7' },
  welcomeContainer: { marginTop: 35, alignItems: 'flex-start', paddingHorizontal: 5 },
  welcomeTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', marginBottom: 6 },
  welcomeSub: { fontSize: 15, color: '#64748B', lineHeight: 22, fontWeight: '500' },
  
  // Naya Green Action Card
  greenActionCard: { backgroundColor: PRIMARY_GREEN, flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 28, marginTop: 25, elevation: 8, shadowColor: PRIMARY_GREEN, shadowOpacity: 0.4, shadowRadius: 12 },
  actionTitleWhite: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  actionSubWhite: { fontSize: 13, color: '#dcfce7', marginTop: 4, fontWeight: '500' },
  arrowCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  arrowIcon: { fontSize: 22, color: '#FFF', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center' },
  statusIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 10 },
  modalBody: { textAlign: 'center', color: '#64748B', marginBottom: 25, fontSize: 15, lineHeight: 22, fontWeight: '500' },
  modalBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: { flex: 1, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalBtnMain: { backgroundColor: PRIMARY_GREEN, width: '100%', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  optionsSheet: { backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, paddingBottom: 50 },
  sheetBar: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 25 }
});