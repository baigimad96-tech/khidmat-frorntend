import React, { useState, useCallback, memo, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Switch, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import axios from 'axios';
import { launchImageLibrary } from 'react-native-image-picker';

// Enums Import
import { 
  BANK_ACCOUNT_TYPES, HOUSING_STATUS, INCOME_RANGE, 
  EDUCATION_LEVELS, RELATIONSHIP_TYPES, HEALTH_STATUS, 
  NEED_CATEGORIES, URGENCY_LEVELS, GENDER_TYPES 
} from '../constants/roles';

// 1. STABLE INPUT COMPONENT
const StableInput = memo(({ label, val, onChange, kb = 'default', isNum = false }: any) => (
  <View style={styles.fWrap}>
    <Text style={styles.fLabel}>{label}</Text>
    <TextInput 
      style={styles.fInput} 
      value={val === null || val === undefined ? "" : val.toString()} 
      keyboardType={kb}
      autoCorrect={false}
      spellCheck={false}
      onChangeText={(t) => onChange(isNum ? (parseFloat(t) || 0) : t)} 
    />
  </View>
));

// 2. STABLE SELECT COMPONENT
const StableSelect = memo(({ label, val, options, onChange }: any) => (
  <View style={styles.fWrap}>
    <Text style={styles.fLabel}>{label}</Text>
    <View style={styles.pickerCont}>
      <Picker
        selectedValue={val}
        onValueChange={(v) => onChange(v)}
        dropdownIconColor="#16476A"
        mode="dropdown"
      >
        {options.map((opt: string) => (
          <Picker.Item key={opt} label={opt.replace(/_/g, ' ')} value={opt} style={{fontSize: 14}} />
        ))}
      </Picker>
    </View>
  </View>
));

export default function FillDoneeProfile({ route, navigation }: any) {
  const { user, assignmentId } = route.params;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [backendDoneeId, setBackendDoneeId] = useState<number | null>(null);

  const [form, setForm] = useState<any>({
    assignmentId: assignmentId || 0,
    bankAccount: { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "", branchName: "", accountType: "SAVINGS" },
    householdInfo: {
      totalFamilyMembers: 0, totalDependents: 0, earningMembers: 0, childrenCount: 0, childrenInSchool: 0,
      elderlyCount: 0, disabledMembers: 0, orphanedChildren: 0, singleParentHousehold: false, widowOrWidower: false,
      monthlyHouseholdIncome: 0, incomeRange: "LOW", primaryOccupation: "", primaryEarnerName: "", secondaryIncomeSource: "",
      totalMonthlyExpenses: 0, hasOutstandingDebt: false, debtAmount: 0, debtDetails: "", housingStatus: "RENTED",
      monthlyRent: 0, houseRooms: 0, ownsVehicle: false, ownsLand: false, hasSavings: false, hasLivestock: false
    },
    familyMembers: [{ name: "", relationship: "SELF", gender: "MALE", dateOfBirth: "1999-01-01", age: 0, isEarningMember: false, occupation: "", monthlyIncome: 0, isDependent: true, isDisabled: false, educationLevel: "PRIMARY", isInSchool: false, schoolName: "", healthStatus: "GOOD" }],
    needs: [{ category: "EDUCATION", title: "", description: "", urgencyLevel: "HIGH", priority: "HIGH", neededByDate: "2026-03-01", estimatedAmount: 0, preferredDonationType: "BOTH", beneficiaryCount: 0 }],
    references: [{ referenceName: "", relationship: "", phoneNumber: "", occupation: "", referenceType: "IMAM", importanceLevel: "HIGH", city: "", state: "", country: "India" }],
    surveyorReport: {
      visitGpsLatitude: 23.2599, visitGpsLongitude: 77.4126, residencePhotos: "", residenceCondition: "POOR", familyPresent: true,
      familyMembersVerified: 0, addressVerified: true, utilityBillVerified: true, familySizeVerified: true, incomeVerified: false,
      neighborsContacted: 0, neighborhoodFeedback: "", communityReputation: "GOOD", surveyorRemarks: "", recommendation: "RECOMMENDED", redFlags: "", strengths: ""
    }
  });

  // FETCH DONEE ID FROM ALL-DONEES ENDPOINT
  useEffect(() => {
    const fetchDoneeData = async () => {
      try {
        const res = await axios.get('https://perchable-freewheeling-faye.ngrok-free.dev/api/admin/users/all-donee', {
          headers: { Authorization: `Bearer ${user.accessToken}` }
        });
        // Find the donee that matches our assignmentId or specific criteria
        const found = res.data.find((d: any) => d.assignmentId === assignmentId || d.id === assignmentId);
        if (found) {
            setBackendDoneeId(found.id);
            console.log("Matched Backend Donee ID:", found.id);
        }
      } catch (e) {
        console.log("Error fetching all donees:", e);
      }
    };
    fetchDoneeData();
  }, [assignmentId]);

  const updateSection = useCallback((sec: string, f: string, v: any) => {
    setForm((p: any) => ({ ...p, [sec]: { ...p[sec], [f]: v } }));
  }, []);

  const updateArr = useCallback((sec: string, i: number, f: string, v: any) => {
    setForm((p: any) => {
      const data = [...p[sec]];
      data[i] = { ...data[i], [f]: v };
      return { ...p, [sec]: data };
    });
  }, []);

  const addArr = (sec: string, obj: any) => setForm((p: any) => ({ ...p, [sec]: [...p[sec], obj] }));

  // IMAGE PICKER & UPLOAD LOGIC (FIXED FOR BACKEND DTO)
 const pickAndUpload = async (docType: string) => {
  if (!backendDoneeId && !assignmentId) {
    Alert.alert("Error", "Donee ID not found. Please wait for data to load.");
    return;
  }

  const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.5 });
  
  // 1. Assets aur pehli file check karein
  if (result.didCancel || !result.assets || result.assets.length === 0) return;

  const file = result.assets[0];

  // 2. URI check karein (Isse TypeScript error 'possibly undefined' khatam ho jayega)
  if (!file.uri) {
    Alert.alert("Error", "Could not get image path");
    return;
  }

  const formData = new FormData();
  
  // Match 'private MultipartFile file'
  formData.append('file', {
    // Ab TypeScript ko pata hai ki file.uri confirm hai
    uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
    name: file.fileName || `${docType}.jpg`,
    type: file.type || 'image/jpeg',
  } as any);

  // Match 'private Long doneeId'
  formData.append('doneeId', (backendDoneeId || assignmentId).toString());
  
  // Match 'private DocumentType documentType'
  formData.append('documentType', docType);

  // Optional fields for safety
  formData.append('documentNumber', "");
  formData.append('issuingAuthority', "");

  setUploading(true);
  try {
    const response = await axios.post('https://perchable-freewheeling-faye.ngrok-free.dev/api/v1/donee/documents/upload', formData, {
      headers: { 
          'Content-Type': 'multipart/form-data', 
          Authorization: `Bearer ${user.accessToken}` 
      }
    });
    
    if(response.status === 200 || response.status === 201) {
      setUploadedDocs(prev => [...prev, docType]);
      Alert.alert("Success", `${docType.replace(/_/g, ' ')} Uploaded!`);
    }
  } catch (e: any) {
    console.log("Upload Error:", e.response?.data || e.message);
    Alert.alert("Upload Error", e.response?.data?.message || "Check server logs (500)");
  } finally {
    setUploading(false);
  }
};
  const submitFinal = async () => {
    setLoading(true);
    try {
      await axios.post('https://perchable-freewheeling-faye.ngrok-free.dev/api/v1/donee/profile', form, {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });
      Alert.alert("Success", "Profile Submitted Successfully");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", "Check Fields and Retry");
    } finally { setLoading(false); }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${((currentStep - 1) / 6) * 100}%` }]} />
      </View>
      {[1, 2, 3, 4, 5, 6, 7].map((step) => (
        <View key={step} style={styles.stepCircleWrapper}>
          <View style={[styles.stepCircle, currentStep >= step ? styles.activeCircle : styles.inactiveCircle]}>
            <Text style={[styles.stepText, currentStep >= step ? styles.activeText : styles.inactiveText]}>{step}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.cont}>
      {renderStepIndicator()}
      <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ padding: 20 }}>

        {currentStep === 1 && (
          <View>
            <Text style={styles.secH}>1. Bank Details</Text>
            <StableInput label="Holder Name" val={form.bankAccount.accountHolderName} onChange={(v:any)=>updateSection('bankAccount','accountHolderName',v)} />
            <StableInput label="A/C Number" val={form.bankAccount.accountNumber} kb="numeric" onChange={(v:any)=>updateSection('bankAccount','accountNumber',v)} />
            <StableInput label="IFSC Code" val={form.bankAccount.ifscCode} onChange={(v:any)=>updateSection('bankAccount','ifscCode',v)} />
            <StableInput label="Bank Name" val={form.bankAccount.bankName} onChange={(v:any)=>updateSection('bankAccount','bankName',v)} />
            <StableInput label="Branch Name" val={form.bankAccount.branchName} onChange={(v:any)=>updateSection('bankAccount','branchName',v)} />
            <StableSelect label="Account Type" val={form.bankAccount.accountType} options={BANK_ACCOUNT_TYPES} onChange={(v:any)=>updateSection('bankAccount','accountType',v)} />
          </View>
        )}

        {currentStep === 2 && (
          <View>
            <Text style={styles.secH}>2. Household Information</Text>
            <StableInput label="Total Family Members" val={form.householdInfo.totalFamilyMembers} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','totalFamilyMembers',v)} />
            <StableInput label="Total Dependents" val={form.householdInfo.totalDependents} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','totalDependents',v)} />
            <StableInput label="Earning Members" val={form.householdInfo.earningMembers} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','earningMembers',v)} />
            <StableInput label="Children Count" val={form.householdInfo.childrenCount} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','childrenCount',v)} />
            <StableInput label="In School" val={form.householdInfo.childrenInSchool} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','childrenInSchool',v)} />
            <StableInput label="Elderly Count" val={form.householdInfo.elderlyCount} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','elderlyCount',v)} />
            <StableInput label="Disabled Count" val={form.householdInfo.disabledMembers} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','disabledMembers',v)} />
            <StableInput label="Orphaned Count" val={form.householdInfo.orphanedChildren} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','orphanedChildren',v)} />
            
            <View style={styles.row}><Text style={styles.label}>Single Parent?</Text><Switch value={form.householdInfo.singleParentHousehold} onValueChange={(v)=>updateSection('householdInfo','singleParentHousehold',v)} /></View>
            <View style={styles.row}><Text style={styles.label}>Widow/Widower?</Text><Switch value={form.householdInfo.widowOrWidower} onValueChange={(v)=>updateSection('householdInfo','widowOrWidower',v)} /></View>
            
            <StableInput label="Monthly Income" val={form.householdInfo.monthlyHouseholdIncome} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','monthlyHouseholdIncome',v)} />
            <StableSelect label="Income Range" val={form.householdInfo.incomeRange} options={INCOME_RANGE} onChange={(v:any)=>updateSection('householdInfo','incomeRange',v)} />
            <StableInput label="Primary Occupation" val={form.householdInfo.primaryOccupation} onChange={(v:any)=>updateSection('householdInfo','primaryOccupation',v)} />
            <StableInput label="Primary Earner Name" val={form.householdInfo.primaryEarnerName} onChange={(v:any)=>updateSection('householdInfo','primaryEarnerName',v)} />
            <StableInput label="Secondary Income" val={form.householdInfo.secondaryIncomeSource} onChange={(v:any)=>updateSection('householdInfo','secondaryIncomeSource',v)} />
            <StableInput label="Total Expenses" val={form.householdInfo.totalMonthlyExpenses} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','totalMonthlyExpenses',v)} />
            
            <View style={styles.row}><Text style={styles.label}>Has Debt?</Text><Switch value={form.householdInfo.hasOutstandingDebt} onValueChange={(v)=>updateSection('householdInfo','hasOutstandingDebt',v)} /></View>
            {form.householdInfo.hasOutstandingDebt && (
              <View style={styles.card}>
                <StableInput label="Debt Amount" val={form.householdInfo.debtAmount} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','debtAmount',v)} />
                <StableInput label="Debt Details" val={form.householdInfo.debtDetails} onChange={(v:any)=>updateSection('householdInfo','debtDetails',v)} />
              </View>
            )}
            
            <StableSelect label="Housing Status" val={form.householdInfo.housingStatus} options={HOUSING_STATUS} onChange={(v:any)=>updateSection('householdInfo','housingStatus',v)} />
            <StableInput label="Monthly Rent" val={form.householdInfo.monthlyRent} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','monthlyRent',v)} />
            <StableInput label="Rooms" val={form.householdInfo.houseRooms} kb="numeric" isNum onChange={(v:any)=>updateSection('householdInfo','houseRooms',v)} />
            
            <View style={styles.row}><Text style={styles.label}>Vehicle?</Text><Switch value={form.householdInfo.ownsVehicle} onValueChange={(v)=>updateSection('householdInfo','ownsVehicle',v)} /></View>
            <View style={styles.row}><Text style={styles.label}>Land?</Text><Switch value={form.householdInfo.ownsLand} onValueChange={(v)=>updateSection('householdInfo','ownsLand',v)} /></View>
            <View style={styles.row}><Text style={styles.label}>Savings?</Text><Switch value={form.householdInfo.hasSavings} onValueChange={(v)=>updateSection('householdInfo','hasSavings',v)} /></View>
            <View style={styles.row}><Text style={styles.label}>Livestock?</Text><Switch value={form.householdInfo.hasLivestock} onValueChange={(v)=>updateSection('householdInfo','hasLivestock',v)} /></View>
          </View>
        )}

        {currentStep === 3 && (
          <View>
            <Text style={styles.secH}>3. Family Members Details</Text>
            {form.familyMembers.map((m: any, i: number) => (
              <View key={i} style={styles.card}>
                <StableInput label="Name" val={m.name} onChange={(v:any)=>updateArr('familyMembers',i,'name',v)} />
                <StableSelect label="Relationship" val={m.relationship} options={RELATIONSHIP_TYPES} onChange={(v:any)=>updateArr('familyMembers',i,'relationship',v)} />
                <StableSelect label="Gender" val={m.gender} options={GENDER_TYPES} onChange={(v:any)=>updateArr('familyMembers',i,'gender',v)} />
                <StableInput label="DOB" val={m.dateOfBirth} onChange={(v:any)=>updateArr('familyMembers',i,'dateOfBirth',v)} />
                <StableInput label="Age" val={m.age} kb="numeric" isNum onChange={(v:any)=>updateArr('familyMembers',i,'age',v)} />
                <View style={styles.row}><Text style={styles.label}>Earning?</Text><Switch value={m.isEarningMember} onValueChange={(v)=>updateArr('familyMembers',i,'isEarningMember',v)} /></View>
                <StableInput label="Occupation" val={m.occupation} onChange={(v:any)=>updateArr('familyMembers',i,'occupation',v)} />
                <StableInput label="Monthly Income" val={m.monthlyIncome} kb="numeric" isNum onChange={(v:any)=>updateArr('familyMembers',i,'monthlyIncome',v)} />
                <View style={styles.row}><Text style={styles.label}>Dependent?</Text><Switch value={m.isDependent} onValueChange={(v)=>updateArr('familyMembers',i,'isDependent',v)} /></View>
                <View style={styles.row}><Text style={styles.label}>Disabled?</Text><Switch value={m.isDisabled} onValueChange={(v)=>updateArr('familyMembers',i,'isDisabled',v)} /></View>
                <StableSelect label="Education" val={m.educationLevel} options={EDUCATION_LEVELS} onChange={(v:any)=>updateArr('familyMembers',i,'educationLevel',v)} />
                <View style={styles.row}><Text style={styles.label}>In School?</Text><Switch value={m.isInSchool} onValueChange={(v)=>updateArr('familyMembers',i,'isInSchool',v)} /></View>
                <StableInput label="School Name" val={m.schoolName} onChange={(v:any)=>updateArr('familyMembers',i,'schoolName',v)} />
                <StableSelect label="Health Status" val={m.healthStatus} options={HEALTH_STATUS} onChange={(v:any)=>updateArr('familyMembers',i,'healthStatus',v)} />
              </View>
            ))}
            <TouchableOpacity style={styles.addB} onPress={()=>addArr('familyMembers',{name:"", relationship: "OTHER", gender: "MALE"})}><Text style={styles.addText}>+ Add Member</Text></TouchableOpacity>
          </View>
        )}

        {currentStep === 4 && (
          <View>
            <Text style={styles.secH}>4. Needs</Text>
            {form.needs.map((n: any, i: number) => (
              <View key={i} style={styles.card}>
                <StableSelect label="Category" val={n.category} options={NEED_CATEGORIES} onChange={(v:any)=>updateArr('needs',i,'category',v)} />
                <StableInput label="Title" val={n.title} onChange={(v:any)=>updateArr('needs',i,'title',v)} />
                <StableInput label="Description" val={n.description} onChange={(v:any)=>updateArr('needs',i,'description',v)} />
                <StableSelect label="Urgency" val={n.urgencyLevel} options={URGENCY_LEVELS} onChange={(v:any)=>updateArr('needs',i,'urgencyLevel',v)} />
                <StableInput label="Priority" val={n.priority} onChange={(v:any)=>updateArr('needs',i,'priority',v)} />
                <StableInput label="Needed By Date" val={n.neededByDate} onChange={(v:any)=>updateArr('needs',i,'neededByDate',v)} />
                <StableInput label="Estimated Amount" val={n.estimatedAmount} kb="numeric" isNum onChange={(v:any)=>updateArr('needs',i,'estimatedAmount',v)} />
                <StableInput label="Donation Type" val={n.preferredDonationType} onChange={(v:any)=>updateArr('needs',i,'preferredDonationType',v)} />
                <StableInput label="Beneficiary Count" val={n.beneficiaryCount} kb="numeric" isNum onChange={(v:any)=>updateArr('needs',i,'beneficiaryCount',v)} />
              </View>
            ))}
            <TouchableOpacity style={styles.addB} onPress={()=>addArr('needs',{category:"EDUCATION"})}><Text style={styles.addText}>+ Add Need</Text></TouchableOpacity>
          </View>
        )}

        {currentStep === 5 && (
          <View>
            <Text style={styles.secH}>5. References</Text>
            {form.references.map((r: any, i: number) => (
              <View key={i} style={styles.card}>
                <StableInput label="Name" val={r.referenceName} onChange={(v:any)=>updateArr('references',i,'referenceName',v)} />
                <StableInput label="Relationship" val={r.relationship} onChange={(v:any)=>updateArr('references',i,'relationship',v)} />
                <StableInput label="Phone" val={r.phoneNumber} kb="numeric" onChange={(v:any)=>updateArr('references',i,'phoneNumber',v)} />
                <StableInput label="Occupation" val={r.occupation} onChange={(v:any)=>updateArr('references',i,'occupation',v)} />
                <StableInput label="Type (IMAM/LOCAL)" val={r.referenceType} onChange={(v:any)=>updateArr('references',i,'referenceType',v)} />
                <StableInput label="Importance" val={r.importanceLevel} onChange={(v:any)=>updateArr('references',i,'importanceLevel',v)} />
                <StableInput label="City" val={r.city} onChange={(v:any)=>updateArr('references',i,'city',v)} />
                 <StableInput label="State" val={r.state} onChange={(v:any)=>updateArr('references',i,'state',v)} />
                <StableInput label="Country" val={r.country} onChange={(v:any)=>updateArr('references',i,'country',v)} />
              </View>
            ))}
          </View>
        )}

        {currentStep === 6 && (
          <View>
            <Text style={styles.secH}>6. Surveyor Report</Text>
            <StableInput label="Latitude" val={form.surveyorReport.visitGpsLatitude} kb="numeric" isNum onChange={(v:any)=>updateSection('surveyorReport','visitGpsLatitude',v)} />
            <StableInput label="Longitude" val={form.surveyorReport.visitGpsLongitude} kb="numeric" isNum onChange={(v:any)=>updateSection('surveyorReport','visitGpsLongitude',v)} />
            <StableInput label="Residence Condition" val={form.surveyorReport.residenceCondition} onChange={(v:any)=>updateSection('surveyorReport','residenceCondition',v)} />
            <View style={styles.row}><Text style={styles.label}>Family Present?</Text><Switch value={form.surveyorReport.familyPresent} onValueChange={(v)=>updateSection('surveyorReport','familyPresent',v)} /></View>
            <StableInput label="Verified Members" val={form.surveyorReport.familyMembersVerified} kb="numeric" isNum onChange={(v:any)=>updateSection('surveyorReport','familyMembersVerified',v)} />
            <View style={styles.row}><Text style={styles.label}>Address Verified?</Text><Switch value={form.surveyorReport.addressVerified} onValueChange={(v)=>updateSection('surveyorReport','addressVerified',v)} /></View>
            <View style={styles.row}><Text style={styles.label}>Utility Bill Verified?</Text><Switch value={form.surveyorReport.utilityBillVerified} onValueChange={(v)=>updateSection('surveyorReport','utilityBillVerified',v)} /></View>
            <View style={styles.row}><Text style={styles.label}>Income Verified?</Text><Switch value={form.surveyorReport.incomeVerified} onValueChange={(v)=>updateSection('surveyorReport','incomeVerified',v)} /></View>
            <StableInput label="Neighbors Contacted" val={form.surveyorReport.neighborsContacted} kb="numeric" isNum onChange={(v:any)=>updateSection('surveyorReport','neighborsContacted',v)} />
            <StableInput label="Neighborhood Feedback" val={form.surveyorReport.neighborhoodFeedback} onChange={(v:any)=>updateSection('surveyorReport','neighborhoodFeedback',v)} />
            <StableInput label="Recommendation" val={form.surveyorReport.recommendation} onChange={(v:any)=>updateSection('surveyorReport','recommendation',v)} />
            <Text style={styles.fLabel}>Surveyor Remarks</Text>
            <TextInput style={styles.tArea} multiline value={form.surveyorReport.surveyorRemarks} onChangeText={(v)=>updateSection('surveyorReport','surveyorRemarks',v)} />
          </View>
        )}

        {currentStep === 7 && (
          <View>
            <Text style={styles.secH}>7. Documents</Text>
            <View style={styles.card}>
              {[
                { label: 'Aadhaar Card', value: 'AADHAAR_CARD' },
                { label: 'Income Proof', value: 'INCOME_PROOF' },
                { label: 'Utility Bill', value: 'UTILITY_BILL' },
                { label: 'Family Photo', value: 'FAMILY_PHOTO' },
                { label: 'Bank Statement', value: 'BANK_STATEMENT' }
              ].map((item) => {
                const isUploaded = uploadedDocs.includes(item.value);
                return (
                  <TouchableOpacity 
                    key={item.value} 
                    style={[styles.upRow, isUploaded && {borderColor: '#22C55E'}]} 
                    onPress={() => pickAndUpload(item.value)}
                    disabled={uploading}
                  >
                    <View style={{flex:1}}>
                      <Text style={styles.docName}>{item.label}</Text>
                      <Text style={{color: isUploaded ? '#22C55E' : '#64748B', fontSize: 11}}>
                        {isUploaded ? '✓ Uploaded Successfully' : 'Tap to select & upload'}
                      </Text>
                    </View>
                    <View style={[styles.upIcon, isUploaded && {backgroundColor: '#22C55E'}]}>
                      {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{color:'#FFF', fontWeight:'bold'}}>UP</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {uploading && <ActivityIndicator color="#16476A" style={{marginTop: 10}} />}
          </View>
        )}

        <View style={styles.navRow}>
          {currentStep > 1 && <TouchableOpacity style={styles.bBtn} onPress={()=>setCurrentStep(s=>s-1)}><Text style={styles.bText}>Back</Text></TouchableOpacity>}
          {currentStep < 7 ? (
            <TouchableOpacity style={styles.nBtn} onPress={()=>setCurrentStep(s=>s+1)}><Text style={{color:'#FFF', fontWeight:'bold'}}>Next</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.sBtn} onPress={submitFinal}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{color:'#FFF', fontWeight:'bold'}}>Submit All</Text>}
            </TouchableOpacity>
          )}
        </View>
        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cont: { flex: 1, backgroundColor: '#FFF' },
  stepContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 20, backgroundColor: '#F8FAFC' },
  progressBarBackground: { position: 'absolute', height: 4, backgroundColor: '#E2E8F0', left: 45, right: 45, top: 38, borderRadius: 2 },
  progressBarFill: { height: 4, backgroundColor: '#16476A', borderRadius: 2 },
  stepCircleWrapper: { alignItems: 'center' },
  stepCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, zIndex: 1 },
  activeCircle: { backgroundColor: '#16476A', borderColor: '#16476A' },
  inactiveCircle: { backgroundColor: '#FFF', borderColor: '#E2E8F0' },
  stepText: { fontSize: 12, fontWeight: 'bold' },
  activeText: { color: '#FFF' },
  inactiveText: { color: '#64748B' },
  secH: { fontSize: 22, fontWeight: 'bold', color: '#16476A', marginVertical: 20 },
  fWrap: { marginBottom: 15 },
  fLabel: { fontSize: 12, color: '#475569', marginBottom: 6, fontWeight: 'bold', textTransform: 'uppercase' },
  fInput: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', color: '#000' },
  pickerCont: { backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' },
  card: { padding: 15, backgroundColor: '#F1F5F9', borderRadius: 15, marginVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  tArea: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', height: 100, textAlignVertical: 'top' },
  addB: { padding: 15, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#16476A', borderRadius: 10, marginVertical: 15, backgroundColor: '#F0F9FF' },
  addText: { color: '#16476A', fontWeight: 'bold' },
  navRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  nBtn: { flex: 2, backgroundColor: '#16476A', padding: 18, borderRadius: 12, alignItems: 'center' },
  bBtn: { flex: 1, backgroundColor: '#F1F5F9', padding: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  bText: { color: '#475569', fontWeight: 'bold' },
  sBtn: { flex: 2, backgroundColor: '#22C55E', padding: 18, borderRadius: 12, alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  label: { fontSize: 15, color: '#1E293B' },
  upRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  docName: { fontWeight: 'bold', color: '#1E293B', fontSize: 14 },
  upIcon: { backgroundColor: '#16476A', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }
});