import React, { useState, useRef } from 'react';
import { 
  View, TextInput, TouchableOpacity, StyleSheet, ScrollView, Text, 
  SafeAreaView, ActivityIndicator, StatusBar, Modal, Dimensions, Keyboard, FlatList 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import StepIndicator from '../components/StepIndicator'; 
import { ROLES } from '../constants/roles'; 

const { width } = Dimensions.get('window');
const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';
const PRIMARY_GREEN = '#42b212'; // Aapka naya green color

const InputField = ({ label, field, form, setForm, half, ...props }: any) => (
  <View style={[styles.fieldBox, half && { flex: 1 }]}>
    <Text style={styles.fLabel}>{label}</Text>
    <TextInput
      style={styles.fInput}
      value={form[field]}
      onChangeText={(v) => setForm({ ...form, [field]: v })}
      placeholderTextColor="#94A3B8" 
      selectionColor={PRIMARY_GREEN}
      {...props}
    />
  </View>
);

export default function RegistrationScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); 
  const [mapVisible, setMapVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const webViewRef = useRef<any>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState({ title: '', body: '', isError: false });
  const [isSuccessFinish, setIsSuccessFinish] = useState(false);

  const [form, setForm] = useState<any>({
    userId: null,
    phone: '', 
    otpCode: '', 
    firstName: '', middleName: '', lastName: '',
    role: '', 
    gender: '', 
    dateOfBirth: '', 
    email: '',
    whatsappNumber: '',
    alternatePhone: '',
    bio: '',
    addressRequest: null,
    donorType: 'INDIVIDUAL',
    currentCity:""
  });

  const commonHeaders = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' };

  // --- LOGIC (RETAINED) ---
  const handleSendOTP = async () => {
    if (!form.phone || form.phone.length < 10) {
      return showPopup("Wait", "Enter a valid phone number", true);
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/auth/registration/send-otp`, { phone: form.phone.trim() }, { headers: commonHeaders });
      setOtpSent(true);
      showPopup("OTP Sent", "Code sent to " + form.phone);
    } catch (error: any) {
      showPopup("Error", error.response?.data?.message || "Failed to send OTP", true);
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (!form.otpCode) return showPopup("Wait", "Enter OTP", true);
    setLoading(true);
    try {
      const resp = await axios.post(`${BASE_URL}/auth/registration/verify-otp`, { phone: form.phone.trim(), otpCode: form.otpCode.trim() }, { headers: commonHeaders });
      if (resp.status === 200 || resp.status === 201) {
        const uid = resp.data?.userId || resp.data?.data?.userId;
        setForm((prev: any) => ({ ...prev, userId: uid })); 
        setStep(2); 
      }
    } catch (e: any) { 
      showPopup("Error", e.response?.data?.message || "Invalid OTP", true); 
    } finally { setLoading(false); }
  };

  const processLocationData = async (lat: number, lng: number) => {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`, { headers: { 'User-Agent': 'KhidmatApp/1.0' } });
      const data = await resp.json();
      const addr = data.address || {};
      const addressRequest = {
        road: addr.road || addr.pedestrian || "Local Road",
        locality: addr.neighbourhood || addr.suburb || addr.subdistrict || "N/A",
        city: addr.city || addr.town || addr.village || "N/A",
        district: addr.state_district || "N/A",
        state: addr.state || "N/A",
        pincode: addr.postcode || "N/A",
        country: addr.country || "India",
        fullAddress: data.display_name,
        latitude: lat,
        longitude: lng
      };
      setForm((prev: any) => ({ ...prev, addressRequest }));
      setMapVisible(false);
    } catch (err) { console.log(err); }
  };

  const searchLocation = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${text}&countrycodes=in`, { headers: { 'User-Agent': 'KhidmatApp/1.0' } });
        const data = await resp.json();
        setSearchResults(data);
      } catch (err) { console.log(err); }
    } else { setSearchResults([]); }
  };

  const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>body { margin: 0; } #map { height: 100vh; width: 100vw; }</style></head><body><div id="map"></div><script>var map = L.map('map', {zoomControl: false}).setView([23.2556, 77.3990], 15);L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);var marker = L.marker([23.2556, 77.3990], {draggable: true}).addTo(map);map.on('click', function(e) {marker.setLatLng(e.latlng);window.ReactNativeWebView.postMessage(JSON.stringify({lat: e.latlng.lat, lng: e.latlng.lng}));});marker.on('dragend', function() {var p = marker.getLatLng();window.ReactNativeWebView.postMessage(JSON.stringify({lat: p.lat, lng: p.lng}));});</script></body></html>`;

  const showPopup = (title: string, body: string, isError = false, isFinish = false) => {
    setModalMsg({ title, body, isError });
    setIsSuccessFinish(isFinish);
    setModalVisible(true);
  };

  const handleFinalSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.addressRequest) {
        return showPopup("Wait", "Please complete all fields and location", true);
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/auth/registration/complete-profile`, form, { headers: commonHeaders });
      showPopup("Success", "Account created successfully", false, true);
    } catch (error) { showPopup("Error", "Failed to register", true); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.mapHeader}>
            <TextInput style={styles.searchInput} placeholder="Search area..." onChangeText={searchLocation} placeholderTextColor="#94A3B8" />
            <TouchableOpacity onPress={() => setMapVisible(false)}><Text style={styles.closeBtn}>Close</Text></TouchableOpacity>
          </View>
          {searchResults.length > 0 && (
            <View style={styles.searchDropdown}>
              <FlatList data={searchResults} renderItem={({item}) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => {
                  webViewRef.current?.injectJavaScript(`map.setView([${item.lat}, ${item.lon}], 17); marker.setLatLng([${item.lat}, ${item.lon}]);`);
                  processLocationData(parseFloat(item.lat), parseFloat(item.lon));
                  setSearchResults([]);
                }}><Text numberOfLines={1} style={{color: '#1E293B'}}>{item.display_name}</Text></TouchableOpacity>
              )} />
            </View>
          )}
          <WebView ref={webViewRef} source={{ html: mapHtml }} onMessage={(e) => {
            const { lat, lng } = JSON.parse(e.nativeEvent.data);
            processLocationData(lat, lng);
          }} />
        </SafeAreaView>
      </Modal>

      {/* Popup Modal */}
      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <View style={[styles.modalIcon, { backgroundColor: modalMsg.isError ? '#FEE2E2' : '#f0fdf4' }]}>
             <Text style={{fontSize: 30, color: modalMsg.isError ? '#EF4444' : PRIMARY_GREEN}}>{modalMsg.isError ? '!' : '✓'}</Text>
          </View>
          <Text style={styles.modalTitle}>{modalMsg.title}</Text>
          <Text style={styles.modalBody}>{modalMsg.body}</Text>
          <TouchableOpacity style={styles.modalBtn} onPress={() => { setModalVisible(false); if(isSuccessFinish) navigation.navigate('Login'); }}>
            <Text style={{color:'#FFF', fontWeight:'bold', letterSpacing: 1}}>CONTINUE</Text>
          </TouchableOpacity>
        </View></View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
            <Text style={styles.hTitle}>Register</Text>
            <Text style={styles.hSub}>Join Khidmat - Step into Service</Text>
        </View>
        
        <StepIndicator step={step}  />
        
        <View style={styles.formCard}>
          {step === 1 ? (
            <View>
              <InputField label="Phone Number" field="phone" form={form} setForm={setForm} keyboardType="phone-pad" placeholder="91318 46422" editable={!otpSent} />
              {otpSent && <InputField label="Verification Code" field="otpCode" form={form} setForm={setForm} keyboardType="number-pad" placeholder="6-digit OTP" autoFocus />}
              
              <TouchableOpacity style={styles.pBtn} onPress={otpSent ? handleVerifyOTP : handleSendOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.pBtnText}>{otpSent ? "VERIFY NOW" : "SEND OTP"}</Text>}
              </TouchableOpacity>
              
              {otpSent && (
                <TouchableOpacity onPress={() => setOtpSent(false)} style={{marginTop: 20, alignSelf: 'center'}}>
                  <Text style={{color: PRIMARY_GREEN, fontWeight: '700'}}>Change Phone Number</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.row}>
                <InputField label="First Name" field="firstName" form={form} setForm={setForm} half placeholder="Rahul" />
                <InputField label="Middle Name" field="middleName" form={form} setForm={setForm} half placeholder="Kumar" />
              </View>
              <InputField label="Last Name" field="lastName" form={form} setForm={setForm} placeholder="Sharma" />
              
              <View style={styles.row}>
                <View style={{flex:1, marginBottom: 18}}>
                    <Text style={styles.fLabel}>Gender</Text>
                    <View style={styles.pickerBox}>
                        <Picker selectedValue={form.gender} dropdownIconColor={PRIMARY_GREEN} onValueChange={(v) => setForm({...form, gender: v})}>
                            <Picker.Item label="Select" value="" style={{fontSize: 14}} />
                            <Picker.Item label="Male" value="MALE" />
                            <Picker.Item label="Female" value="FEMALE" />
                        </Picker>
                    </View>
                </View>
                <InputField label="Birth Date" field="dateOfBirth" form={form} setForm={setForm} half placeholder="YYYY-MM-DD" />
              </View>

              <InputField label="Email Address" field="email" form={form} setForm={setForm} keyboardType="email-address" placeholder="name@email.com" />
              <InputField label="Current City" field="currentCity" form={form} setForm={setForm} placeholder="Indore" />

              <TouchableOpacity style={styles.locBtn} onPress={() => { Keyboard.dismiss(); setMapVisible(true); }}>
                  <Text style={styles.locBtnText}>
                    {form.addressRequest ? "📍 " + form.addressRequest.city : "📍 Pin your location on Map"}
                  </Text>
              </TouchableOpacity>

              <View style={styles.row}>
                <InputField label="WhatsApp" field="whatsappNumber" form={form} setForm={setForm} half keyboardType="phone-pad" placeholder="+91" />
                <InputField label="Alt Phone" field="alternatePhone" form={form} setForm={setForm} half keyboardType="phone-pad" placeholder="Optional" />
              </View>

              <InputField label="Short Bio" field="bio" form={form} setForm={setForm} multiline numberOfLines={3} placeholder="Tell us something about yourself..." />
              
              <Text style={styles.fLabel}>Select Role</Text>
              <View style={styles.pickerBox}>
                <Picker selectedValue={form.role} dropdownIconColor={PRIMARY_GREEN} onValueChange={(v) => setForm({...form, role: v})}>
                  <Picker.Item label="Select Role" value="" />
                  {ROLES.map((r: any) => <Picker.Item key={r.value} label={r.label} value={r.value} />)}
                </Picker>
              </View>

              <TouchableOpacity style={styles.pBtn} onPress={handleFinalSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.pBtnText}>COMPLETE REGISTRATION</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 24 },
  head: { marginBottom: 30, alignItems: 'flex-start' },
  hTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  hSub: { fontSize: 15, color: '#64748B', marginTop: 4, fontWeight: '500' },
  
  formCard: { backgroundColor: '#FFFFFF', marginTop: 10 },
  
  fieldBox: { marginBottom: 20 },
  fLabel: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  fInput: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    color: '#0F172A', 
    fontSize: 16,
    fontWeight: '600'
  },
  
  row: { flexDirection: 'row', gap: 14 },
  
  pickerBox: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    justifyContent: 'center',
    height: 60,
    overflow: 'hidden'
  },
  
  pBtn: { 
    backgroundColor: PRIMARY_GREEN, 
    paddingVertical: 18, 
    borderRadius: 18, 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  pBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  
  locBtn: { 
    backgroundColor: '#f0fdf4', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 20, 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: PRIMARY_GREEN, 
    borderStyle: 'dashed'
  },
  locBtnText: { color: PRIMARY_GREEN, fontWeight: '800', fontSize: 14 },
  
  mapHeader: { flexDirection: 'row', padding: 15, alignItems: 'center', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  searchInput: { flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 12, fontSize: 15, color: '#000' },
  closeBtn: { marginLeft: 15, color: PRIMARY_GREEN, fontWeight: '800' },
  
  searchDropdown: { position: 'absolute', top: 75, left: 15, right: 15, backgroundColor: '#FFF', zIndex: 10, borderRadius: 12, elevation: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, maxHeight: 250 },
  resultItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 30, padding: 32, alignItems: 'center' },
  modalIcon: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  modalBody: { marginVertical: 18, textAlign: 'center', color: '#64748B', fontSize: 16, lineHeight: 24, fontWeight: '500' },
  modalBtn: { backgroundColor: PRIMARY_GREEN, width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 4 }
});