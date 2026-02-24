import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  ActivityIndicator, Dimensions, RefreshControl 
} from 'react-native';
import axios from 'axios';
import { PieChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function AdminDashboard({ route }: any) {
  const { user } = route.params;
  const isAdmin = user?.role === 'ADMIN'; // Role Check

  const [loading, setLoading] = useState(isAdmin); // Admin ke liye loading true, baaki ke liye false
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0, donors: 0, donees: 0, surveyors: 0,
    male: 0, female: 0, others: 0
  });

  const fetchData = async () => {
    if (!isAdmin) return; // Agar admin nahi hai toh API call mat karo
    
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/users/all`, {
        headers: { 
          Authorization: `Bearer ${user.accessToken}`, 
          'ngrok-skip-browser-warning': 'true' 
        }
      });
      const allUsers = res.data?.users || [];
      
      setStats({
        total: allUsers.length,
        donors: allUsers.filter((u: any) => u.role === 'DONOR').length,
        donees: allUsers.filter((u: any) => u.role === 'DONEE').length,
        surveyors: allUsers.filter((u: any) => u.role === 'SURVEYOR').length,
        male: allUsers.filter((u: any) => u.gender?.toUpperCase() === 'MALE').length,
        female: allUsers.filter((u: any) => u.gender?.toUpperCase() === 'FEMALE').length,
        others: allUsers.filter((u: any) => !['MALE', 'FEMALE'].includes(u.gender?.toUpperCase())).length,
      });
    } catch (e) { 
      console.log(e); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const onRefresh = () => { 
    setRefreshing(true); 
    fetchData(); 
  };

  // --- UI FOR NON-ADMIN USERS ---
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeCenter}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeEmoji}>✨</Text>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role}</Text>
            </View>
            <Text style={styles.subMessage}>You have successfully logged into the portal.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- UI FOR ADMIN (DASHBOARD) ---
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16476A" /></View>;

  const roleData = [
    { name: 'Donors', population: stats.donors, color: '#4F46E5', legendFontColor: '#475569', legendFontSize: 12 },
    { name: 'Donees', population: stats.donees, color: '#10B981', legendFontColor: '#475569', legendFontSize: 12 },
    { name: 'Surveyors', population: stats.surveyors, color: '#F59E0B', legendFontColor: '#475569', legendFontSize: 12 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ padding: 15 }} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        
        <View style={styles.grid}>
          <SummaryCard label="TOTAL USERS" value={stats.total} color="#4F46E5" />
          <SummaryCard label="SURVEYORS" value={stats.surveyors} color="#F59E0B" />
        </View>
        <View style={styles.grid}>
          <SummaryCard label="DONEES" value={stats.donees} color="#10B981" />
          <SummaryCard label="DONORS" value={stats.donors} color="#EC4899" />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>User Distribution</Text>
          <PieChart data={roleData} width={width - 40} height={200} chartConfig={chartConfig} accessor="population" backgroundColor="transparent" paddingLeft="15" absolute />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Gender Analysis</Text>
          <BarChart
            data={{ labels: ["Male", "Female", "Others"], datasets: [{ data: [stats.male, stats.female, stats.others] }] }}
            width={width - 40} height={220} yAxisLabel="" yAxisSuffix=""
            chartConfig={barChartConfig} style={{ borderRadius: 16, marginTop: 10 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryCard = ({ label, value, color }: any) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const chartConfig = { color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` };
const barChartConfig = {
  backgroundColor: "#ffffff", backgroundGradientFrom: "#ffffff", backgroundGradientTo: "#ffffff",
  decimalPlaces: 0, color: (opacity = 1) => `rgba(22, 71, 106, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderLeftWidth: 5, elevation: 2 },
  cardLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8' },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  chartContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginTop: 15, elevation: 1 },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  
  // New Styles for non-admin welcome
  welcomeCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  welcomeCard: { backgroundColor: '#FFF', width: '100%', padding: 40, borderRadius: 30, alignItems: 'center', elevation: 10, shadowColor: '#16476A', shadowOpacity: 0.1, shadowRadius: 10 },
  welcomeEmoji: { fontSize: 50, marginBottom: 20 },
  welcomeText: { fontSize: 18, color: '#64748B', fontWeight: '600' },
  userName: { fontSize: 32, fontWeight: '900', color: '#16476A', marginVertical: 5, textAlign: 'center' },
  roleBadge: { backgroundColor: '#F0F5F5', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  roleText: { color: '#16476A', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  subMessage: { marginTop: 20, color: '#94A3B8', textAlign: 'center', fontSize: 14 }
});