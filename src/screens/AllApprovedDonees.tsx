import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, SafeAreaView, TextInput,
  ActivityIndicator, TouchableOpacity, StatusBar, ScrollView, Dimensions 
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');

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
    <View style={[styles.avatarBase, { width: size, height: size, borderRadius: 12 }]}>
      <Text style={{ color: '#000', fontWeight: '800', fontSize: size * 0.4 }}>
        {name ? name[0].toUpperCase() : 'U'}
      </Text>
    </View>
  );

  const renderDetailView = () => {
    if (!selectedDonee) return null;
    const adults = selectedDonee.familyMembers?.filter(m => m.age >= 18).length || 0;
    const children = selectedDonee.familyMembers?.filter(m => m.age < 18).length || 0;

    return (
      <View style={styles.whiteContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.detailHeader}>
             {renderAvatar(selectedDonee.fullName, 65)}
             <View style={{marginLeft: 15}}>
                <Text style={styles.detailName}>{selectedDonee.fullName}</Text>
                <Text style={styles.subInfoText}>Gender: {selectedDonee.gender} • 39 Years</Text>
             </View>
          </View>
          
          <View style={styles.addressSectionDetail}>
            <Text style={{fontSize: 20}}>📍</Text>
            <Text style={styles.fullAddressDetailText}>{selectedDonee.address?.fullAddress}</Text>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Family Composition</Text>
          <View style={styles.cardInfoRow}>
             <View style={styles.infoBox}><Text style={styles.infoLabel}>Adults</Text><Text style={styles.infoVal}>{adults}</Text></View>
             <View style={styles.infoBox}><Text style={styles.infoLabel}>Children</Text><Text style={styles.infoVal}>{children}</Text></View>
             <View style={styles.infoBox}><Text style={styles.infoLabel}>Total</Text><Text style={styles.infoVal}>{selectedDonee.familyMembers?.length}</Text></View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Select Needs to Donate</Text>
          <View style={styles.donateIconRow}>
             {selectedDonee.needs.map((need) => {
                const isSelected = selectedNeedIds.includes(need.id);
                return (
                  <TouchableOpacity key={need.id} style={styles.donateIconItem} onPress={() => toggleNeedSelection(need.id)}>
                    <View style={[styles.iconCircle, isSelected && { backgroundColor: '#000', borderColor: '#000' }]}>
                      <Text style={{fontSize: 24}}>{getIcon(need.category)}</Text>
                    </View>
                    <Text style={[styles.donateLabel, isSelected && { fontWeight: '800', color: '#000' }]}>{need.category}</Text>
                  </TouchableOpacity>
                );
             })}
          </View>
          <TouchableOpacity style={styles.blackBtn}><Text style={styles.continueText}>Continue ({selectedNeedIds.length})</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderListView = () => (
    <View style={styles.whiteContainer}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={{fontSize: 16}}>🔍</Text>
          <TextInput placeholder="Search name or city..." style={styles.searchInput} placeholderTextColor="#94A3B8" value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={[styles.filterBtn, showFilter && {backgroundColor: '#000'}]} onPress={() => setShowFilter(!showFilter)}>
          <Text style={{fontSize: 18, color: showFilter ? '#FFF' : '#000'}}>⏳</Text>
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
        <ActivityIndicator color="#000" size="large" style={{marginTop: 50}} />
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
                  <View style={styles.mBadge}><Text style={styles.mText}>✓</Text></View>
                </View>
                <Text style={styles.arrow}>→</Text>
              </View>
              <View style={styles.addressRow}>
                <Text style={{fontSize: 16}}>📍</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.blackHeader}>
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
  safe: { flex: 1, backgroundColor: '#000' },
  blackHeader: { height: 80, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
  backBtn: { color: '#FFF', fontSize: 28, marginRight: 20 },
  logoText: { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  whiteContainer: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  avatarBase: { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#F1F5F9' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#000', fontWeight: '600' },
  filterBtn: { width: 55, height: 55, backgroundColor: '#F8FAFC', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  filterDrawer: { marginBottom: 20 },
  chip: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  activeChip: { backgroundColor: '#000', borderColor: '#000' },
  chipText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  activeChipText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 18, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  nameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
  nameText: { fontSize: 19, fontWeight: '800', color: '#0F172A' },
  mBadge: { backgroundColor: '#000', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  mText: { color: '#FFF', fontWeight: 'bold', fontSize: 10 },
  arrow: { fontSize: 20, color: '#0F172A', fontWeight: 'bold' },
  addressRow: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  addressText: { flex: 1, fontSize: 14, color: '#64748B', marginLeft: 8, fontWeight: '500', lineHeight: 20 },
  tagsRow: { flexDirection: 'row', marginTop: 15, gap: 12, flexWrap: 'wrap' },
  tagItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagLabel: { marginLeft: 5, color: '#0F172A', fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  detailName: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  addressSectionDetail: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16 },
  fullAddressDetailText: { flex: 1, marginLeft: 10, color: '#475569', fontSize: 15, fontWeight: '500', lineHeight: 22 },
  subInfoText: { fontSize: 14, color: '#64748B', fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 15, letterSpacing: -0.5 },
  cardInfoRow: { flexDirection: 'row', gap: 12 },
  infoBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  infoLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  infoVal: { fontSize: 20, fontWeight: '900', color: '#000', marginTop: 4 },
  donateIconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 5 },
  donateIconItem: { alignItems: 'center', width: (width - 80) / 3 },
  iconCircle: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  donateLabel: { marginTop: 8, fontSize: 11, color: '#64748B', textAlign: 'center', textTransform: 'uppercase', fontWeight: '700' },
  blackBtn: { backgroundColor: '#000', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 40, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  continueText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});