import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, SafeAreaView, TextInput,
  ActivityIndicator, TouchableOpacity, StatusBar, ScrollView, 
  Dimensions, Modal, Image, Alert, TouchableWithoutFeedback 
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');
const PRIMARY_GREEN = '#42b212';
const LIGHT_GREEN = '#f1fdf0';

// --- Interfaces ---
interface Need {
  id: number;
  title: string;
  category: 'FOOD' | 'MEDICAL' | 'EDUCATION' | 'HOUSING' | 'EMERGENCY' | 'BUSINESS' | 'UTILITIES' | 'OTHER';
  urgency: string;
  estimatedAmount: number;
  adminApproved: boolean;
  description?: string;
  amount_received?: number;
  remaining_amount?: number;
  is_fulfilled?: boolean;
}

interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
  age: number;
  gender: string;
  isEarningMember: boolean;
  health: string;
}

interface Donee {
  doneeId: number;
  fullName: string;
  gender: string;
  profilePhotoUrl: string | null;
  address: {
    fullAddress: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  familyMembers: FamilyMember[];
  needs: Need[];
}

interface DetailedDonee {
  donee_id: number;
  personal_info: {
    name: string;
    age: number;
    city: string;
    occupation: string;
  };
  family_info: {
    total_members: number;
    children: number;
    elderly: number;
    monthly_income: number;
    monthly_expenses: number;
  };
  needs: Array<{
    id: number;
    title: string;
    category: string;
    description: string;
    estimated_amount: number;
    amount_received: number;
    remaining_amount: number;
    urgency: string;
    donation_options: any;
    is_fulfilled: boolean;
  }>;

}

const CATEGORIES = ['FOOD', 'MEDICAL', 'EDUCATION', 'HOUSING', 'EMERGENCY', 'BUSINESS', 'UTILITIES', 'OTHER'];

export default function AllApprovedDonees({ route, navigation }: any) {
  const { user } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [donees, setDonees] = useState<Donee[]>([]); 
  const [search, setSearch] = useState('');
  const [selectedDonee, setSelectedDonee] = useState<Donee | null>(null);
  const [detailedDonee, setDetailedDonee] = useState<DetailedDonee | null>(null);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [selectedNeedIds, setSelectedNeedIds] = useState<number[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => { 
    if (user?.accessToken) fetchApprovedDonees(); 
  }, [user]);

  const fetchApprovedDonees = async () => {
    try {
      const res = await axios.get(`https://perchable-freewheeling-faye.ngrok-free.dev/api/v1/donor/all-approved-donee`, {
        headers: { 
          'Authorization': `Bearer ${user.accessToken}`, 
          'ngrok-skip-browser-warning': 'true' 
        }
      });
      if (res.data.success) {
        setDonees(res.data.donees);
      }
    } catch (e) { 
      console.log(e); 
      Alert.alert('Error', 'Failed to fetch donees list');
    } finally { 
      setLoading(false); 
    }
  };

  const fetchDetailedDonee = async (doneeId: number) => {
    setDetailedLoading(true);
    setDetailedError(null);
    setDetailedDonee(null);
    
    try {
      const res = await axios.get(`https://perchable-freewheeling-faye.ngrok-free.dev/api/v1/donor/donees/${doneeId}`, {
        headers: { 
          'Authorization': `Bearer ${user.accessToken}`, 
          'ngrok-skip-browser-warning': 'true' 
        }
      });
      
      if (res.data && res.data.personal_info) {
        setDetailedDonee(res.data);
      } else {
        setDetailedError('Invalid data structure received');
      }
    } catch (e: any) {
      let errorMessage = 'Failed to load details';
      if (e.response?.status === 404) {
        errorMessage = 'Donee not found';
      } else if (e.response?.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
      } else if (e.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      setDetailedError(errorMessage);
    } finally { 
      setDetailedLoading(false); 
    }
  };

  const handleSelectDonee = (donee: Donee) => {
    setSelectedDonee(donee);
    setSelectedNeedIds([]);
    if (donee.doneeId) {
      fetchDetailedDonee(donee.doneeId);
    } else {
      setDetailedError('Unable to get donee ID');
    }
  };

  const toggleNeedSelection = (id: number) => {
    setSelectedNeedIds(prev => 
      prev.includes(id) ? prev.filter(needId => needId !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selectedNeedIds.length === 0) return;
    
    // Prepare selected needs data
    const selectedNeeds = detailedDonee?.needs.filter(need => 
      selectedNeedIds.includes(need.id)
    ).map(need => ({
      id: need.id,
      category: need.category,
      title: need.title,
      estimatedAmount: need.estimated_amount,
      description: need.description,
      urgency: need.urgency
    })) || [];
    
    const totalAmount = selectedNeeds.reduce((sum, need) => sum + (need.estimatedAmount || 0), 0);
    
    // Navigate to Donation Summary
    navigation.navigate('DonationSummary', {
      donee: {
        id: selectedDonee?.doneeId,
        fullName: detailedDonee?.personal_info.name,
        address: selectedDonee?.address,
        gender: selectedDonee?.gender
      },
      selectedNeeds: selectedNeeds,
      totalAmount: totalAmount,
      user: user
    });
  };

  const getIcon = (cat: string) => {
    switch(cat?.toUpperCase()) {
      case 'FOOD': return '🍲';
      case 'MEDICAL': return '🏥';
      case 'EDUCATION': return '🎓';
      case 'HOUSING': return '🏠';
      case 'EMERGENCY': return '🚨';
      case 'BUSINESS': return '💼';
      case 'UTILITIES': return '🔌';
      default: return '📦';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch(urgency?.toUpperCase()) {
      case 'IMMEDIATE': return '#FF4444';
      case 'MODERATE': return '#FFA500';
      case 'LOW': return '#42b212';
      default: return '#94A3B8';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch(gender?.toUpperCase()) {
      case 'MALE': return '♂';
      case 'FEMALE': return '♀';
      default: return '👤';
    }
  };

  const filteredDonees = donees.filter((d) => {
    const matchesSearch = 
      d.fullName?.toLowerCase().includes(search.toLowerCase()) || 
      d.address?.city?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeFilter ? d.needs?.some(n => n.category === activeFilter) : true;
    return matchesSearch && matchesCategory;
  });

  const renderAvatar = (name: string, gender: string, size: number) => (
    <View style={[styles.avatarBase, { width: size, height: size, borderRadius: 15 }]}>
      <Text style={{ color: PRIMARY_GREEN, fontWeight: '900', fontSize: size * 0.4 }}>
        {name ? name[0].toUpperCase() : 'U'}
      </Text>
      <View style={styles.genderBadge}>
        <Text style={styles.genderBadgeText}>{getGenderIcon(gender)}</Text>
      </View>
    </View>
  );

  const renderDetailView = () => {
    if (!selectedDonee) return null;

    if (detailedLoading) {
      return (
        <View style={styles.whiteContainer}>
          <ActivityIndicator color={PRIMARY_GREEN} size="large" style={{marginTop: 50}} />
          <Text style={{textAlign: 'center', marginTop: 20, color: '#64748B'}}>Loading details...</Text>
        </View>
      );
    }

    if (detailedError) {
      return (
        <View style={styles.whiteContainer}>
          <Text style={{textAlign: 'center', color: '#FF4444', fontSize: 16, marginTop: 50}}>
            {detailedError}
          </Text>
          <TouchableOpacity 
            style={styles.retryBtn}
            onPress={() => fetchDetailedDonee(selectedDonee.doneeId)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!detailedDonee) {
      return (
        <View style={styles.whiteContainer}>
          <Text style={{textAlign: 'center', color: '#64748B', marginTop: 50}}>
            No details available
          </Text>
        </View>
      );
    }

    const adults = detailedDonee.family_info.total_members - detailedDonee.family_info.children;
    const monthlyDeficit = detailedDonee.family_info.monthly_expenses - detailedDonee.family_info.monthly_income;
    const totalAmount = detailedDonee.needs
      .filter(n => selectedNeedIds.includes(n.id))
      .reduce((sum, n) => sum + (n.estimated_amount || 0), 0);

    return (
      <View style={styles.whiteContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 30}}>
          {/* Personal Info Header */}
          <View style={styles.detailHeader}>
            {renderAvatar(detailedDonee.personal_info.name, selectedDonee.gender, 65)}
            <View style={{marginLeft: 15, flex: 1}}>
              <View style={styles.nameGenderRow}>
                <Text style={styles.detailName}>{detailedDonee.personal_info.name}</Text>
                <Text style={styles.genderText}>{getGenderIcon(selectedDonee.gender)} {selectedDonee.gender}</Text>
              </View>
              <Text style={styles.subInfoText}>
                Age: {detailedDonee.personal_info.age} • {detailedDonee.personal_info.occupation}
              </Text>
              {detailedDonee.personal_info.city && detailedDonee.personal_info.city !== '' && (
                <Text style={styles.subInfoText}>📍 {detailedDonee.personal_info.city}</Text>
              )}
            </View>
          </View>

          {/* Address Section */}
          {selectedDonee.address?.fullAddress && (
            <View style={styles.addressSectionDetail}>
              <Text style={{fontSize: 20}}>📍</Text>
              <Text style={styles.fullAddressDetailText}>{selectedDonee.address.fullAddress}</Text>
            </View>
          )}

          {/* Family Composition */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Family Composition</Text>
          <View style={styles.cardInfoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Adults</Text>
              <Text style={styles.infoVal}>{adults}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Children</Text>
              <Text style={styles.infoVal}>{detailedDonee.family_info.children}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Total</Text>
              <Text style={styles.infoVal}>{detailedDonee.family_info.total_members}</Text>
            </View>
          </View>

          {/* Financial Details */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Financial Details</Text>
          <View style={styles.financialRow}>
            <View style={styles.financialBox}>
              <Text style={styles.financialLabel}>Monthly Income</Text>
              <Text style={styles.financialValue}>₹{detailedDonee.family_info.monthly_income?.toLocaleString()}</Text>
            </View>
            <View style={styles.financialBox}>
              <Text style={styles.financialLabel}>Monthly Expenses</Text>
              <Text style={styles.financialValue}>₹{detailedDonee.family_info.monthly_expenses?.toLocaleString()}</Text>
            </View>
            <View style={[styles.financialBox, monthlyDeficit > 0 && {backgroundColor: '#FFF5F5'}]}>
              <Text style={styles.financialLabel}>Monthly Deficit</Text>
              <Text style={[styles.financialValue, monthlyDeficit > 0 && {color: '#FF4444'}]}>
                ₹{Math.abs(monthlyDeficit).toLocaleString()}
                {monthlyDeficit > 0 ? ' 🔴' : ' 🟢'}
              </Text>
            </View>
          </View>

          {/* Select Needs to Donate - Box Style from old code */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Select Needs to Donate</Text>
          <View style={styles.donateIconRow}>
            {detailedDonee.needs && detailedDonee.needs.length > 0 ? (
              detailedDonee.needs.map((need) => {
                const isSelected = selectedNeedIds.includes(need.id);
                const progress = need.amount_received && need.estimated_amount 
                  ? (need.amount_received / need.estimated_amount) * 100 
                  : 0;
                
                return (
                  <TouchableOpacity 
                    key={need.id} 
                    style={styles.donateIconItem} 
                    onPress={() => toggleNeedSelection(need.id)}
                  >
                    <View style={[styles.iconCircle, isSelected && { backgroundColor: PRIMARY_GREEN, borderColor: PRIMARY_GREEN }]}>
                      <Text style={{fontSize: 24}}>{getIcon(need.category)}</Text>
                    </View>
                    <Text style={[styles.donateLabel, isSelected && { fontWeight: '800', color: PRIMARY_GREEN }]}>
                      {need.category}
                    </Text>
                    {need.urgency && (
                      <View style={[styles.urgencyChipSmall, {backgroundColor: getUrgencyColor(need.urgency)}]}>
                        <Text style={styles.urgencyChipSmallText}>{need.urgency}</Text>
                      </View>
                    )}
                    {need.estimated_amount && (
                      <Text style={styles.needAmountSmall}>₹{need.estimated_amount?.toLocaleString()}</Text>
                    )}
                    {progress > 0 && (
                      <View style={styles.progressBarSmall}>
                        <View style={[styles.progressFillSmall, {width: `${progress}%`}]} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={{textAlign: 'center', color: '#64748B', padding: 20}}>
                No needs available for this donee
              </Text>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.greenBtn, selectedNeedIds.length === 0 && {backgroundColor: '#CBD5E1'}]} 
            disabled={selectedNeedIds.length === 0}
            onPress={handleContinue}
          >
            <View style={{alignItems: 'center'}}>
              <Text style={styles.continueText}>Continue ({selectedNeedIds.length})</Text>
              {selectedNeedIds.length > 0 && (
                <Text style={styles.totalAmountSub}>Total: ₹{totalAmount.toLocaleString()}</Text>
              )}
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Image Modal */}
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowImageModal(false);
            setImageLoading(false);
          }}
        >
          <TouchableWithoutFeedback onPress={() => setShowImageModal(false)}>
            <View style={styles.modalContainer}>
              <TouchableOpacity 
                style={styles.modalClose} 
                onPress={() => {
                  setShowImageModal(false);
                  setImageLoading(false);
                }}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
              
              <View style={styles.modalContent}>
                {imageLoading && (
                  <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                    <Text style={styles.loadingText}>Loading image...</Text>
                  </View>
                )}
                
                {selectedImage && (
                  <Image 
                    source={{uri: selectedImage, headers: { 'Authorization': `Bearer ${user.accessToken}` }}}
                    style={styles.modalImage}
                    resizeMode="contain"
                    onLoadStart={() => setImageLoading(true)}
                    onLoad={() => setImageLoading(false)}
                    onError={(e) => {
                      console.log('Image load error:', e.nativeEvent.error);
                      setImageLoading(false);
                      Alert.alert(
                        'Error',
                        'Failed to load image. Please check your internet connection.',
                        [{text: 'OK', onPress: () => setShowImageModal(false)}]
                      );
                    }}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  };

  const renderListView = () => (
    <View style={styles.whiteContainer}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={{fontSize: 16, color: PRIMARY_GREEN}}>🔍</Text>
          <TextInput 
            placeholder="Search name or city..." 
            style={styles.searchInput} 
            placeholderTextColor="#94A3B8" 
            value={search} 
            onChangeText={setSearch} 
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterBtn, showFilter && {backgroundColor: PRIMARY_GREEN}]} 
          onPress={() => setShowFilter(!showFilter)}
        >
          <Text style={{fontSize: 18, color: showFilter ? '#FFF' : PRIMARY_GREEN}}>⚡</Text>
        </TouchableOpacity>
      </View>

      {showFilter && (
        <View style={styles.filterDrawer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.chip, !activeFilter && styles.activeChip]} 
              onPress={() => setActiveFilter(null)}
            >
              <Text style={[styles.chipText, !activeFilter && styles.activeChipText]}>All</Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.chip, activeFilter === cat && styles.activeChip]} 
                onPress={() => setActiveFilter(cat)}
              >
                <Text style={{marginRight: 4}}>{getIcon(cat)}</Text>
                <Text style={[styles.chipText, activeFilter === cat && styles.activeChipText]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={PRIMARY_GREEN} size="large" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={filteredDonees}
          keyExtractor={(item) => item.doneeId.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleSelectDonee(item)}>
              <View style={styles.cardTop}>
                {renderAvatar(item.fullName, item.gender, 55)}
                <View style={styles.nameRow}>
                  <Text style={styles.nameText}>{item.fullName}</Text>
                  <View style={styles.mBadge}>
                    <Text style={styles.mText}>✓</Text>
                  </View>
                </View>
                <Text style={styles.arrow}>›</Text>
              </View>
              <View style={styles.addressRow}>
                <Text style={{fontSize: 16}}>📍</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {item.address?.fullAddress || "Address not provided"}
                </Text>
              </View>
              <View style={styles.tagsRow}>
                {item.needs?.map((need, idx) => (
                  <View key={idx} style={styles.tagItem}>
                    <Text style={{fontSize: 12}}>{getIcon(need.category)}</Text>
                    <Text style={styles.tagLabel}>{need.category}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_GREEN} />
      <View style={styles.greenHeader}>
        <TouchableOpacity onPress={() => selectedDonee ? setSelectedDonee(null) : navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logoText}>Approved Donees</Text>
      </View>
      {selectedDonee ? renderDetailView() : renderListView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PRIMARY_GREEN },
  greenHeader: { height: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
  backBtn: { color: '#FFF', fontSize: 28, marginRight: 20, fontWeight: '300' },
  logoText: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  whiteContainer: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  avatarBase: { backgroundColor: LIGHT_GREEN, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#dcfce7', position: 'relative' },
  genderBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: PRIMARY_GREEN, borderRadius: 12, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  genderBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 18, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#F1F5F9' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#000', fontWeight: '600' },
  filterBtn: { width: 55, height: 55, backgroundColor: '#F8FAFC', borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  filterDrawer: { marginBottom: 20 },
  chip: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, marginRight: 10, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  activeChip: { backgroundColor: PRIMARY_GREEN, borderColor: PRIMARY_GREEN },
  chipText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  activeChipText: { color: '#FFF' },
  
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, marginBottom: 15, elevation: 3, shadowColor: PRIMARY_GREEN, shadowOpacity: 0.1, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
  nameText: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  mBadge: { backgroundColor: PRIMARY_GREEN, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  mText: { color: '#FFF', fontWeight: 'bold', fontSize: 10 },
  arrow: { fontSize: 24, color: PRIMARY_GREEN, fontWeight: 'bold' },
  addressRow: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 12 },
  addressText: { flex: 1, fontSize: 13, color: '#64748B', marginLeft: 8, fontWeight: '500', lineHeight: 18 },
  tagsRow: { flexDirection: 'row', marginTop: 12, gap: 8, flexWrap: 'wrap' },
  tagItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREEN, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#dcfce7' },
  tagLabel: { marginLeft: 5, color: PRIMARY_GREEN, fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
  
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  nameGenderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  detailName: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  genderText: { fontSize: 14, color: PRIMARY_GREEN, fontWeight: '600', backgroundColor: LIGHT_GREEN, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  subInfoText: { fontSize: 14, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  
  addressSectionDetail: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16, marginBottom: 10 },
  fullAddressDetailText: { flex: 1, marginLeft: 10, color: '#475569', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  
  divider: { height: 1.5, backgroundColor: '#F8FAFC', marginVertical: 25 },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: '#0F172A', marginBottom: 15, letterSpacing: -0.3 },
  
  cardInfoRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  infoBox: { flex: 1, backgroundColor: LIGHT_GREEN, padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#dcfce7' },
  infoLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' },
  infoVal: { fontSize: 22, fontWeight: '900', color: PRIMARY_GREEN, marginTop: 4 },
  
  financialRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  financialBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, alignItems: 'center' },
  financialLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  financialValue: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  
  // Needs boxes style from old code
  donateIconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 5 },
  donateIconItem: { alignItems: 'center', width: (width - 80) / 3, marginBottom: 15 },
  iconCircle: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  donateLabel: { marginTop: 8, fontSize: 11, color: '#64748B', textAlign: 'center', textTransform: 'uppercase', fontWeight: '700' },
  urgencyChipSmall: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  urgencyChipSmallText: { color: '#FFF', fontSize: 8, fontWeight: '700' },
  needAmountSmall: { marginTop: 4, fontSize: 11, fontWeight: '800', color: PRIMARY_GREEN },
  progressBarSmall: { width: 50, height: 3, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  progressFillSmall: { height: '100%', backgroundColor: PRIMARY_GREEN, borderRadius: 2 },
  
  greenBtn: { backgroundColor: PRIMARY_GREEN, height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 40, elevation: 4, shadowColor: PRIMARY_GREEN, shadowOpacity: 0.2, shadowRadius: 8 },
  continueText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  totalAmountSub: { color: '#ffffff', fontSize: 12, fontWeight: '700', opacity: 0.9, marginTop: 2 },
  
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.2)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  modalContent: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  imageLoadingContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  loadingText: { color: '#FFF', marginTop: 10, fontSize: 14 },
  modalImage: { width: width - 40, height: width - 40, borderRadius: 12 },
  retryBtn: { backgroundColor: PRIMARY_GREEN, padding: 12, borderRadius: 12, marginTop: 20, alignSelf: 'center', paddingHorizontal: 30 },
  retryText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});