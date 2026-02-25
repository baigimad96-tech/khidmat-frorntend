import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  ActivityIndicator, Dimensions, RefreshControl, TouchableOpacity 
} from 'react-native';
import axios from 'axios';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function DonorDashboard({ route }: any) {
  // Login se aaya hua data extract kar rahe hain
  const loginResponseData = route.params?.user;
  const userData = loginResponseData?.user;
  const token = loginResponseData?.accessToken;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [donees, setDonees] = useState<any[]>([]);

  const fetchDonees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/donor/all-approved-donee`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true' 
        }
      });
      if (res.data.success) {
        setDonees(res.data.donees);
      }
    } catch (e) {
      console.log("Error fetching donees:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDonees(); }, []);

  // 1. Gender Distribution Logic (Male vs Female)
  const genderPieData = useMemo(() => {
    const male = donees.filter(d => d.gender?.toUpperCase() === 'MALE').length;
    const female = donees.filter(d => d.gender?.toUpperCase() === 'FEMALE').length;
    
    return [
      { name: 'Male', population: male, color: '#16476A', legendFontColor: '#475569', legendFontSize: 12 },
      { name: 'Female', population: female, color: '#F472B6', legendFontColor: '#475569', legendFontSize: 12 },
    ];
  }, [donees]);

  // 2. Needs Category Logic (Education, Medical, etc.)
  const needsPieData = useMemo(() => {
    const counts: any = {};
    donees.forEach(d => {
      d.needs?.forEach((n: any) => {
        counts[n.category] = (counts[n.category] || 0) + 1;
      });
    });

    const colors = ['#0EA5E9', '#10B981', '#F59E0B', '#6366F1'];
    return Object.keys(counts).map((cat, i) => ({
      name: cat,
      population: counts[cat],
      color: colors[i % colors.length],
      legendFontColor: '#475569',
      legendFontSize: 12,
    }));
  }, [donees]);

  const renderDoneeCard = (item: any, index: number) => (
    <View key={index} style={styles.doneeCard}>
      <View style={styles.doneeHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{item.fullName[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.doneeName}>{item.fullName}</Text>
          <Text style={styles.doneeSub}>{item.gender} • {item.address?.city || 'Location N/A'}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: item.needs[0]?.urgency === 'IMMEDIATE' ? '#FEE2E2' : '#FFEDD5' }]}>
          <Text style={[styles.tagTxt, { color: item.needs[0]?.urgency === 'IMMEDIATE' ? '#DC2626' : '#C2410C' }]}>
            {item.needs[0]?.urgency || 'REGULAR'}
          </Text>
        </View>
      </View>
      
      <View style={styles.needsList}>
        {item.needs?.map((need: any, idx: number) => (
          <View key={idx} style={styles.needItem}>
            <View style={styles.needCategoryBadge}>
               <Text style={styles.needCategoryText}>{need.category}</Text>
            </View>
            <View style={{flex: 1, marginLeft: 10}}>
                <Text style={styles.needTitle}>{need.title}</Text>
            </View>
            <Text style={styles.needAmount}>₹{need.estimatedAmount.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16476A" />
      <Text style={{marginTop: 10, color: '#64748B'}}>Loading Dashboard...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchDonees();}} />}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>DONOR PANEL</Text>
            <Text style={styles.userName}>Salam, {userData?.firstName || 'User'}!</Text>
            <Text style={styles.summaryTxt}>You are viewing {donees.length} approved profiles</Text>
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demographics & Needs</Text>
          <View style={styles.chartCard}>
            <Text style={styles.chartLabel}>Gender Distribution</Text>
            <PieChart
              data={genderPieData}
              width={width - 70}
              height={150}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>

          <View style={[styles.chartCard, { marginTop: 15 }]}>
            <Text style={styles.chartLabel}>Needs Analysis</Text>
            {needsPieData.length > 0 ? (
                <PieChart
                  data={needsPieData}
                  width={width - 70}
                  height={150}
                  chartConfig={chartConfig}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  absolute
                />
            ) : <Text style={styles.emptyTxt}>No category data available</Text>}
          </View>
        </View>

        {/* List Section */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Verified Donees</Text>
            <TouchableOpacity onPress={fetchDonees}>
                <Text style={styles.refreshLink}>Refresh</Text>
            </TouchableOpacity>
          </View>
          
          {donees.length > 0 ? (
            donees.map((item, index) => renderDoneeCard(item, index))
          ) : (
            <View style={styles.chartCard}>
                <Text style={styles.emptyTxt}>No approved donees found.</Text>
            </View>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const chartConfig = {
  color: (opacity = 1) => `rgba(22, 71, 106, ${opacity})`,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { padding: 25, backgroundColor: '#FFF', borderBottomLeftRadius: 35, borderBottomRightRadius: 35, elevation: 5, shadowColor: '#16476A', shadowOpacity: 0.1 },
  greet: { fontSize: 10, color: '#64748B', fontWeight: '900', letterSpacing: 2 },
  userName: { fontSize: 26, fontWeight: '900', color: '#16476A', marginTop: 4 },
  summaryTxt: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#64748B', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refreshLink: { fontSize: 12, color: '#16476A', fontWeight: 'bold', marginBottom: 12 },
  chartCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  chartLabel: { fontSize: 12, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
  doneeCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  doneeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarTxt: { fontWeight: '900', color: '#16476A', fontSize: 20 },
  doneeName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  doneeSub: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tagTxt: { fontSize: 10, fontWeight: '900' },
  needsList: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  needItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  needCategoryBadge: { backgroundColor: '#F0F5F5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  needCategoryText: { fontSize: 9, fontWeight: '800', color: '#16476A' },
  needTitle: { fontSize: 13, color: '#475569', fontWeight: '600' },
  needAmount: { fontSize: 14, fontWeight: '900', color: '#16476A' },
  emptyTxt: { textAlign: 'center', color: '#94A3B8', paddingVertical: 20, fontWeight: '600' }
});