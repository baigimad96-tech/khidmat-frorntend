import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, StatusBar, Dimensions, Alert } from 'react-native';

const { width } = Dimensions.get('window');
const PRIMARY_GREEN = '#42b212';
const LIGHT_GREEN = '#f1fdf0';

export default function DoneeDetail({ route, navigation }: any) {
  const { selectedDonee, user } = route.params;
  const [selectedNeedIds, setSelectedNeedIds] = useState<number[]>([]);

  const toggleNeed = (id: number) => {
    setSelectedNeedIds(prev => prev.includes(id) ? prev.filter(nid => nid !== id) : [...prev, id]);
  };

  const getIcon = (cat: string) => {
    const icons: any = { FOOD: '🍲', MEDICAL: '🏥', EDUCATION: '🎓', HOUSING: '🏠' };
    return icons[cat?.toUpperCase()] || '📦';
  };

  const total = selectedDonee.needs
    .filter((n: any) => selectedNeedIds.includes(n.id))
    .reduce((sum: number, n: any) => sum + (n.estimatedAmount || 0), 0);

  const handleReview = () => {
    if (selectedNeedIds.length === 0) return Alert.alert("Wait", "Please select at least one need.");
    navigation.navigate('DonationSummary', {
      donee: selectedDonee,
      selectedNeeds: selectedDonee.needs.filter((n: any) => selectedNeedIds.includes(n.id)),
      totalAmount: total,
      user
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_GREEN} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Donee Profile</Text>
      </View>

      <View style={styles.whiteContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.name}>{selectedDonee.fullName}</Text>
          <Text style={styles.address}>📍 {selectedDonee.address?.fullAddress}</Text>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Select Needs to Support</Text>
          
          <View style={styles.needsGrid}>
            {selectedDonee.needs?.map((need: any) => (
              <TouchableOpacity 
                key={need.id} 
                style={[styles.needCard, selectedNeedIds.includes(need.id) && styles.activeCard]}
                onPress={() => toggleNeed(need.id)}
              >
                <Text style={{fontSize: 30}}>{getIcon(need.category)}</Text>
                <Text style={styles.needCat}>{need.category}</Text>
                <Text style={styles.needAmt}>₹{need.estimatedAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.mainBtn} onPress={handleReview}>
            <Text style={styles.btnText}>Review Support (₹{total})</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PRIMARY_GREEN },
  header: { height: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
  backBtn: { color: '#FFF', fontSize: 28 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginLeft: 20 },
  whiteContainer: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  name: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  address: { fontSize: 14, color: '#64748B', marginTop: 5, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  needsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  needCard: { width: (width - 80) / 2, padding: 20, backgroundColor: '#F8FAFC', borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  activeCard: { borderColor: PRIMARY_GREEN, backgroundColor: LIGHT_GREEN, borderWidth: 2 },
  needCat: { fontSize: 12, fontWeight: '800', color: '#64748B', marginTop: 10, textTransform: 'uppercase' },
  needAmt: { fontSize: 18, fontWeight: '900', color: PRIMARY_GREEN, marginTop: 5 },
  mainBtn: { backgroundColor: PRIMARY_GREEN, height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 16 }
});