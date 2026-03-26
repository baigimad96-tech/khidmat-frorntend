import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  ActivityIndicator, Dimensions, RefreshControl, TouchableOpacity, StatusBar 
} from 'react-native';
import axios from 'axios';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';
const PRIMARY_GREEN = '#42b212';
const LIGHT_GREEN = '#f1fdf0';

export default function DonorDashboard({ route }: any) {
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

  // 1. Gender Distribution Logic
  const genderPieData = useMemo(() => {
    const male = donees.filter(d => d.gender?.toUpperCase() === 'MALE').length;
    const female = donees.filter(d => d.gender?.toUpperCase() === 'FEMALE').length;
    
    return [
      { name: 'Male', population: male, color: '#0ea5e9', legendFontColor: '#64748b', legendFontSize: 12 },
      { name: 'Female', population: female, color: '#ec4899', legendFontColor: '#64748b', legendFontSize: 12 },
    ];
  }, [donees]);

  // 2. Needs Category Logic
  const needsPieData = useMemo(() => {
    const counts: any = {};
    donees.forEach(d => {
      d.needs?.forEach((n: any) => {
        counts[n.category] = (counts[n.category] || 0) + 1;
      });
    });

    const colors = [PRIMARY_GREEN, '#fbbf24', '#2dd4bf', '#818cf8', '#f87171'];
    return Object.keys(counts).map((cat, i) => ({
      name: cat,
      population: counts[cat],
      color: colors[i % colors.length],
      legendFontColor: '#64748b',
      legendFontSize: 11,
    }));
  }, [donees]);

  const renderDoneeCard = (item: any, index: number) => (
    <View key={index} style={styles.doneeCard}>
      <View style={styles.doneeHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{item.fullName[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.doneeName}>{item.fullName}</Text>
          <Text style={styles.doneeSub}>{item.gender} • {item.address?.city || 'Location N/A'}</Text>
        </View>
        <View style={[styles.urgencyTag, { backgroundColor: item.needs[0]?.urgency === 'IMMEDIATE' ? '#fef2f2' : '#fffbeb' }]}>
          <Text style={[styles.urgencyTagTxt, { color: item.needs[0]?.urgency === 'IMMEDIATE' ? '#ef4444' : '#d97706' }]}>
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
                <Text style={styles.needTitle} numberOfLines={1}>{need.title}</Text>
            </View>
            <Text style={styles.needAmount}>₹{need.estimatedAmount.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={PRIMARY_GREEN} />
      <Text style={{marginTop: 12, color: '#94a3b8', fontWeight: '600'}}>Loading Insights...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchDonees();}} tintColor={PRIMARY_GREEN} />}
      >
        {/* Modern Khidmat Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greet}>WELCOME TO KHIDMAT</Text>
              <Text style={styles.userName}>Salam, {userData?.firstName || 'User'}!</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{donees.length} Approved Donees Available</Text>
              </View>
            </View>
            <View style={styles.headerUnderline} />
          </View>
        </View>

        {/* Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Impact Statistics</Text>
          
          <View style={styles.chartCard}>
            <Text style={styles.chartLabel}>Beneficiary Demographics</Text>
            <PieChart
              data={genderPieData}
              width={width - 60}
              height={160}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>

          <View style={[styles.chartCard, { marginTop: 15 }]}>
            <Text style={styles.chartLabel}>Needs Distribution</Text>
            {needsPieData.length > 0 ? (
                <PieChart
                  data={needsPieData}
                  width={width - 60}
                  height={160}
                  chartConfig={chartConfig}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  absolute
                />
            ) : <Text style={styles.emptyTxt}>No needs data recorded yet</Text>}
          </View>
        </View>

        {/* Donees Section */}
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Recent Profiles</Text>
            <TouchableOpacity onPress={fetchDonees}>
                <Text style={styles.refreshLink}>Update List</Text>
            </TouchableOpacity>
          </View>
          
          {donees.length > 0 ? (
            donees.map((item, index) => renderDoneeCard(item, index))
          ) : (
            <View style={styles.chartCard}>
                <Text style={styles.emptyTxt}>No approved profiles found.</Text>
            </View>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const chartConfig = {
  color: (opacity = 1) => `rgba(66, 178, 18, ${opacity})`,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 10 },
  headerContent: { position: 'relative' },
  greet: { fontSize: 10, color: PRIMARY_GREEN, fontWeight: '800', letterSpacing: 1.5 },
  userName: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginTop: 4 },
  countBadge: { backgroundColor: LIGHT_GREEN, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#dcfce7' },
  countText: { fontSize: 11, color: PRIMARY_GREEN, fontWeight: '800' },
  headerUnderline: { width: 35, height: 4, backgroundColor: PRIMARY_GREEN, marginTop: 15, borderRadius: 2 },

  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94a3b8', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refreshLink: { fontSize: 12, color: PRIMARY_GREEN, fontWeight: '800', marginBottom: 12 },
  
  chartCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  chartLabel: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  
  doneeCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 18, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    elevation: 3, 
    shadowColor: PRIMARY_GREEN, 
    shadowOpacity: 0.08 
  },
  doneeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: { width: 48, height: 48, borderRadius: 15, backgroundColor: LIGHT_GREEN, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#dcfce7' },
  avatarTxt: { fontWeight: '900', color: PRIMARY_GREEN, fontSize: 18 },
  doneeName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  doneeSub: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  urgencyTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  urgencyTagTxt: { fontSize: 9, fontWeight: '900' },
  needsList: { borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 15 },
  needItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  needCategoryBadge: { backgroundColor: LIGHT_GREEN, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#dcfce7' },
  needCategoryText: { fontSize: 9, fontWeight: '900', color: PRIMARY_GREEN, textTransform: 'uppercase' },
  needTitle: { fontSize: 13, color: '#475569', fontWeight: '600' },
  needAmount: { fontSize: 14, fontWeight: '900', color: '#0f172a' },
  emptyTxt: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontWeight: '600' }
});