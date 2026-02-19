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

const InputField = ({ label, field, form, setForm, half, ...props }: any) => (
  <View style={[styles.fieldBox, half && { flex: 1 }]}>
    <Text style={styles.fLabel}>{label}</Text>
    <TextInput
      style={styles.fInput}
      value={form[field]}
      onChangeText={(v) => setForm({ ...form, [field]: v })}
      placeholderTextColor="#94A3B8" 
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

  const handleSendOTP = async () => {
    if (!form.phone || form.phone.length < 10) {
      return showPopup("Invalid Phone", "Please enter a valid phone number", true);
    }
    
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/auth/registration/send-otp`, 
        { phone: form.phone.trim() }, 
        { headers: commonHeaders }
      );
      setOtpSent(true);
      showPopup("OTP Sent", "Verification code has been sent to " + form.phone);
    } catch (error: any) {
      console.log("OTP Error:", error.response?.data);
      showPopup("Error", error.response?.data?.message || "Failed to send OTP", true);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. VERIFY OTP ---
const handleVerifyOTP = async () => {
    if (!form.otpCode) return showPopup("Wait!", "Enter OTP", true);
    setLoading(true);
    try {
      const resp = await axios.post(`${BASE_URL}/auth/registration/verify-otp`, 
        { phone: form.phone.trim(), otpCode: form.otpCode.trim() }, 
        { headers: commonHeaders }
      );

      console.log("Verify Response:", resp.data); // Debugging ke liye zaroori hai

      // Step jump logic: Agar status 200 hai toh aage badho
      if (resp.status === 200 || resp.status === 201) {
        // Data nikalne ke liye multiple paths check karein
        const uid = resp.data?.userId || resp.data?.data?.userId;
        
        setForm((prev: any) => ({ ...prev, userId: uid })); 
        setStep(2); // Forcefully changing step here
      } else {
        showPopup("Error", "Could not verify. Please try again.", true);
      }
    } catch (e: any) { 
      console.log("Verify Error:", e.response?.data);
      showPopup("Error", e.response?.data?.message || "Invalid OTP code", true); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- 3. OPENSTREETMAP LOGIC ---
  const processLocationData = async (lat: number, lng: number) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'User-Agent': 'KhidmatApp/1.0' } }
      );
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
    } catch (err) { console.log("Map Error:", err); }
  };

  const searchLocation = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${text}&countrycodes=in`, 
          { headers: { 'User-Agent': 'KhidmatApp/1.0' } });
        const data = await resp.json();
        setSearchResults(data);
      } catch (err) { console.log(err); }
    } else { setSearchResults([]); }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>body { margin: 0; } #map { height: 100vh; width: 100vw; }</style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            var map = L.map('map', {zoomControl: false}).setView([23.2556, 77.3990], 15);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
            var marker = L.marker([23.2556, 77.3990], {draggable: true}).addTo(map);
            map.on('click', function(e) {
                marker.setLatLng(e.latlng);
                window.ReactNativeWebView.postMessage(JSON.stringify({lat: e.latlng.lat, lng: e.latlng.lng}));
            });
            marker.on('dragend', function() {
                var p = marker.getLatLng();
                window.ReactNativeWebView.postMessage(JSON.stringify({lat: p.lat, lng: p.lng}));
            });
        </script>
    </body>
    </html>
  `;

  const showPopup = (title: string, body: string, isError = false, isFinish = false) => {
    setModalMsg({ title, body, isError });
    setIsSuccessFinish(isFinish);
    setModalVisible(true);
  };

  const handleFinalSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.addressRequest) {
        return showPopup("Wait!", "Please fill names and select location on map", true);
    }
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/auth/registration/complete-profile`, form, { headers: commonHeaders });
      showPopup("Success ✨", "Account Created!", false, true);
    } catch (error) { showPopup("Error", "Registration failed", true); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#16476A" />

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.mapHeader}>
            <TextInput style={styles.searchInput} placeholder="Search area..." onChangeText={searchLocation} />
            <TouchableOpacity onPress={() => setMapVisible(false)}><Text style={styles.closeBtn}>Back</Text></TouchableOpacity>
          </View>
          {searchResults.length > 0 && (
            <View style={styles.searchDropdown}>
              <FlatList data={searchResults} renderItem={({item}) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => {
                  webViewRef.current?.injectJavaScript(`map.setView([${item.lat}, ${item.lon}], 17); marker.setLatLng([${item.lat}, ${item.lon}]);`);
                  processLocationData(parseFloat(item.lat), parseFloat(item.lon));
                  setSearchResults([]);
                }}><Text numberOfLines={1}>{item.display_name}</Text></TouchableOpacity>
              )} />
            </View>
          )}
          <WebView ref={webViewRef} source={{ html: mapHtml }} onMessage={(e) => {
            const { lat, lng } = JSON.parse(e.nativeEvent.data);
            processLocationData(lat, lng);
          }} />
        </SafeAreaView>
      </Modal>

      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{modalMsg.title}</Text>
          <Text style={styles.modalBody}>{modalMsg.body}</Text>
          <TouchableOpacity style={styles.modalBtn} onPress={() => { setModalVisible(false); if(isSuccessFinish) navigation.navigate('Login'); }}>
            <Text style={{color:'#FFF', fontWeight:'bold'}}>OK</Text>
          </TouchableOpacity>
        </View></View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
            <Text style={styles.logoText}>KHIDMAT</Text>
            <Text style={styles.hTitle}>Create Account</Text>
        </View>
        <StepIndicator step={step} />
        
        <View style={styles.formCard}>
          {step === 1 ? (
            <View>
              <InputField label="PHONE NUMBER" field="phone" form={form} setForm={setForm} keyboardType="phone-pad" placeholder="+91..." editable={!otpSent} />
              {otpSent && <InputField label="OTP CODE" field="otpCode" form={form} setForm={setForm} keyboardType="number-pad" placeholder="Enter 6 digit OTP" />}
              <TouchableOpacity style={styles.pBtn} onPress={otpSent ? handleVerifyOTP : handleSendOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.pBtnText}>{otpSent ? "VERIFY" : "SEND OTP"}</Text>}
              </TouchableOpacity>
              {otpSent && (
                <TouchableOpacity onPress={() => setOtpSent(false)} style={{marginTop: 15, alignSelf: 'center'}}>
                  <Text style={{color: '#16476A', fontWeight: 'bold'}}>Change Number</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.row}>
                <InputField label="FIRST NAME" field="firstName" form={form} setForm={setForm} half />
                <InputField label="MIDDLE NAME" field="middleName" form={form} setForm={setForm} half />
              </View>
              <InputField label="LAST NAME" field="lastName" form={form} setForm={setForm} />
              <View style={styles.row}>
                <View style={{flex:1}}>
                    <Text style={styles.fLabel}>GENDER</Text>
                    <View style={styles.pickerBox}>
                        <Picker selectedValue={form.gender} onValueChange={(v) => setForm({...form, gender: v})}>
                            <Picker.Item label="Select" value="" /><Picker.Item label="Male" value="MALE" /><Picker.Item label="Female" value="FEMALE" />
                        </Picker>
                    </View>
                </View>
                <InputField label="DOB (YYYY-MM-DD)" field="dateOfBirth" form={form} setForm={setForm} half placeholder="1998-05-14" />
              </View>
              <InputField label="EMAIL" field="email" form={form} setForm={setForm} keyboardType="email-address" />
                            <InputField label="city" field="currentCity" form={form} setForm={setForm}/>

              <TouchableOpacity style={styles.locBtn} onPress={() => { Keyboard.dismiss(); setMapVisible(true); }}>
                 <Text style={styles.locBtnText}>📍 {form.addressRequest ? "Location: " + form.addressRequest.city : "Tap to Select Location on Map"}</Text>
              </TouchableOpacity>
              <View style={styles.row}>
                <InputField label="WHATSAPP #" field="whatsappNumber" form={form} setForm={setForm} half keyboardType="phone-pad" />
                <InputField label="ALT PHONE" field="alternatePhone" form={form} setForm={setForm} half keyboardType="phone-pad" />
              </View>
              <InputField label="BIO" field="bio" form={form} setForm={setForm} multiline numberOfLines={3} />
              <Text style={styles.fLabel}>ROLE</Text>
              <View style={styles.pickerBox}>
                <Picker selectedValue={form.role} onValueChange={(v) => setForm({...form, role: v})}>
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
  safe: { flex: 1, backgroundColor: '#F0F5F5' },
  scroll: { padding: 25 },
  head: { marginBottom: 20, alignItems: 'center' },
  logoText: { fontSize: 24, fontWeight: '900', color: '#16476A' },
  hTitle: { fontSize: 28, fontWeight: '900', color: '#16476A' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 30, padding: 25, elevation: 10 },
  fieldBox: { marginBottom: 15 },
  fLabel: { fontSize: 10, fontWeight: '900', color: '#16476A', marginBottom: 6, opacity: 0.6 },
  fInput: { backgroundColor: '#F8FAFC', borderRadius: 15, padding: 14, borderWidth: 1.5, borderColor: '#E2E8F0', color: '#16476A', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  pickerBox: { backgroundColor: '#F8FAFC', borderRadius: 15, marginBottom: 15, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center' },
  pBtn: { backgroundColor: '#16476A', paddingVertical: 16, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  pBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  locBtn: { backgroundColor: '#E0F2FE', padding: 15, borderRadius: 15, marginBottom: 15, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#16476A' },
  locBtnText: { color: '#16476A', fontWeight: '800', textAlign:'center' },
  mapHeader: { flexDirection: 'row', padding: 15, alignItems: 'center', backgroundColor: '#FFF' },
  searchInput: { flex: 1, backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10 },
  closeBtn: { marginLeft: 10, color: '#16476A', fontWeight: 'bold' },
  searchDropdown: { position: 'absolute', top: 75, left: 15, right: 15, backgroundColor: '#FFF', zIndex: 10, borderRadius: 10, elevation: 5, maxHeight: 200 },
  resultItem: { padding: 15, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 20, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#16476A' },
  modalBody: { marginVertical: 15, textAlign: 'center' },
  modalBtn: { backgroundColor: '#16476A', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 10 }
});