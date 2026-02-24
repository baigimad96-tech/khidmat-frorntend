import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, SafeAreaView, TextInput,
  ActivityIndicator, TouchableOpacity, StatusBar, ScrollView 
} from 'react-native';
import axios from 'axios';

// --- Interfaces ---
interface Need {
  id: number;
  category: 'FOOD' | 'MEDICAL' | 'EDUCATION' | 'HOUSING' | 'EMERGENCY' | 'BUSINESS' | 'UTILITIES' | 'OTHER';
}

interface FamilyMember {
  id: number;
  age: number;
}

interface Donee {
  fullName: string;
  gender: string;
  address: { fullAddress: string, city: string } | null;
  familyMembers: FamilyMember[];
  needs: Need[];
}

const CATEGORIES = ['FOOD', 'MEDICAL', 'EDUCATION', 'HOUSING', 'EMERGENCY', 'BUSINESS', 'UTILITIES', 'OTHER'];

export default function AllApprovedDonees({ route, navigation }: any) {
  const { user } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [donees, setDonees] = useState<Donee[]>([]); 
  const [search, setSearch] = useState('');
  const [selectedDonee, setSelectedDonee] = useState<Donee | null>(null);
  const [selectedNeedIds, setSelectedNeedIds] = useState<number[]>([]);
  
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => { 
    if (user?.accessToken) fetchApprovedDonees(); 
  }, [user]);

  const fetchApprovedDonees = async () => {
    try {
      const res = await axios.get(`https://perchable-freewheeling-faye.ngrok-free.dev/api/v1/donor/all-approved-donee`, {
        headers: { 'Authorization': `Bearer ${user.accessToken}`, 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.data.success) setDonees(res.data.donees);
    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  const toggleNeedSelection = (id: number) => {
    setSelectedNeedIds(prev => 
      prev.includes(id) ? prev.filter(needId => needId !== id) : [...prev, id]
    );
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

  const filteredDonees = donees.filter((d) => {
    const matchesSearch = 
      d.fullName?.toLowerCase().includes(search.toLowerCase()) || 
      d.address?.city?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeFilter ? d.needs?.some(n => n.category === activeFilter) : true;
    return matchesSearch && matchesCategory;
  });

  const renderAvatar = (name: string, size: number) => (
    <View style={[styles.avatarBase, { width: size, height: size, borderRadius: size/2 }]}>
      <Text style={{ color: '#16476A', fontWeight: 'bold', fontSize: size * 0.4 }}>
        {name ? name[0].toUpperCase() : 'U'}
      </Text>
    </View>
  );

  // --- DETAIL VIEW (Ab scope ke andar hai) ---
  const renderDetailView = () => {
    if (!selectedDonee) return null;
    const adults = selectedDonee.familyMembers?.filter(m => m.age >= 18).length || 0;
    const children = selectedDonee.familyMembers?.filter(m => m.age < 18).length || 0;

    return (
      <View style={styles.whiteContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.detailHeader}>
             {renderAvatar(selectedDonee.fullName, 65)}
             <Text style={styles.detailName}>
               {selectedDonee.fullName} 
               <View style={styles.mBadge}></View>
             </Text>
          </View>
          <View style={styles.addressSectionDetail}>
            <Text style={{fontSize: 22}}>📍</Text>
            <Text style={styles.fullAddressDetailText}>{selectedDonee.address?.fullAddress}</Text>
          </View>
          <Text style={styles.subInfoText}>Age: 39 Years      Gender: {selectedDonee.gender}</Text>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Family Details</Text>
          <Text style={styles.familyLine}>Adult: {adults}       Children: {children}</Text>
          <Text style={styles.familyLine}>Total family Members: {selectedDonee.familyMembers?.length}</Text>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Donate</Text>
          <View style={styles.donateIconRow}>
             {selectedDonee.needs.map((need) => {
                const isSelected = selectedNeedIds.includes(need.id);
                return (
                  <TouchableOpacity key={need.id} style={styles.donateIconItem} onPress={() => toggleNeedSelection(need.id)}>
                    <View style={[styles.iconCircle, isSelected && { backgroundColor: '#16476A', borderColor: '#16476A' }]}>
                      <Text style={{fontSize: 24}}>{getIcon(need.category)}</Text>
                    </View>
                    <Text style={[styles.donateLabel, isSelected && { fontWeight: 'bold', color: '#16476A' }]}>{need.category}</Text>
                  </TouchableOpacity>
                );
             })}
          </View>
          <TouchableOpacity style={styles.continueBtn}><Text style={styles.continueText}>Continue ({selectedNeedIds.length})</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // --- LIST VIEW ---
  const renderListView = () => (
    <View style={styles.whiteContainer}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={{fontSize: 18}}>🔍</Text>
          <TextInput placeholder="Search name or city..." style={styles.searchInput} placeholderTextColor="#94A3B8" value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={[styles.filterBtn, showFilter && {backgroundColor: '#16476A'}]} onPress={() => setShowFilter(!showFilter)}>
          <Text style={{fontSize: 20, color: showFilter ? '#FFF' : '#000'}}>⏳</Text>
        </TouchableOpacity>
      </View>

      {showFilter && (
        <View style={styles.filterDrawer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={[styles.chip, !activeFilter && styles.activeChip]} onPress={() => setActiveFilter(null)}>
              <Text style={[styles.chipText, !activeFilter && styles.activeChipText]}>All</Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat} style={[styles.chip, activeFilter === cat && styles.activeChip]} onPress={() => setActiveFilter(cat)}>
                <Text style={{marginRight: 4}}>{getIcon(cat)}</Text>
                <Text style={[styles.chipText, activeFilter === cat && styles.activeChipText]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#16476A" size="large" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={filteredDonees}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => { setSelectedDonee(item); setSelectedNeedIds([]); }}>
              <View style={styles.cardTop}>
                {renderAvatar(item.fullName, 55)}
                <View style={styles.nameRow}>
                  <Text style={styles.nameText}>{item.fullName}</Text>
                  <View style={styles.mBadge}></View>
                </View>
                <Text style={styles.arrow}>→</Text>
              </View>
              <View style={styles.addressRow}>
                <Text style={{fontSize: 18}}>📍</Text>
                <Text style={styles.addressText} numberOfLines={2}>{item.address?.fullAddress || "No Address"}</Text>
              </View>
              <View style={styles.tagsRow}>
                {item.needs?.map((need, idx) => (
                  <View key={idx} style={styles.tagItem}>
                    <Text style={{fontSize: 14}}>{getIcon(need.category)}</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#16476A" />
      <View style={styles.blackHeader}>
         <TouchableOpacity onPress={() => selectedDonee ? setSelectedDonee(null) : navigation.goBack()}>
           <Text style={styles.backBtn}>←</Text>
         </TouchableOpacity>
         <Text style={styles.logoText}>40 NSEW</Text>
      </View>
      {selectedDonee ? renderDetailView() : renderListView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#16476A' },
  blackHeader: { height: 80, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { color: '#FFF', fontSize: 30, marginRight: 70 },
  logoText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  whiteContainer: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  avatarBase: { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 30, paddingHorizontal: 15, height: 55 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#000' },
  filterBtn: { width: 55, height: 55, backgroundColor: '#F1F5F9', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  filterDrawer: { marginBottom: 20 },
  chip: { flexDirection: 'row', backgroundColor: '#F1F5F9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  activeChip: { backgroundColor: '#16476A', borderColor: '#16476A' },
  chipText: { color: '#64748B', fontWeight: '500' },
  activeChipText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 25, padding: 18, marginBottom: 15, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
  nameText: { fontSize: 19, fontWeight: 'bold', color: '#1E293B' },
  mBadge: { backgroundColor: '#E11D48', paddingHorizontal: 6, borderRadius: 4, marginLeft: 8 },
  mText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  arrow: { fontSize: 22, color: '#000' },
  addressRow: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  addressText: { flex: 1, fontSize: 14, color: '#64748B', marginLeft: 8 },
  tagsRow: { flexDirection: 'row', marginTop: 15, gap: 15 },
  tagItem: { flexDirection: 'row', alignItems: 'center' },
  tagLabel: { marginLeft: 6, color: '#475569', fontWeight: '600', textTransform: 'capitalize' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  detailName: { fontSize: 22, fontWeight: 'bold', marginLeft: 15, color: '#1E293B' },
  addressSectionDetail: { flexDirection: 'row', marginBottom: 10 },
  fullAddressDetailText: { flex: 1, marginLeft: 10, color: '#475569', fontSize: 15 },
  subInfoText: { fontSize: 15, color: '#64748B', marginLeft: 32 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  familyLine: { fontSize: 15, color: '#475569', marginBottom: 8 },
  donateIconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 10 },
  donateIconItem: { alignItems: 'center', width: 75 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', elevation: 2, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F1F5F9' },
  donateLabel: { marginTop: 8, fontSize: 11, color: '#475569', textAlign: 'center', textTransform: 'capitalize' },
  continueBtn: { backgroundColor: '#16476A', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  continueText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});