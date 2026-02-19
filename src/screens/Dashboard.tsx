import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  ActivityIndicator, Dimensions, TouchableOpacity, RefreshControl 
} from 'react-native';
import axios from 'axios';
import { PieChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function AdminDashboard({ route }: any) {
  const { user } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0, donors: 0, donees: 0, surveyors: 0,
    male: 0, female: 0, others: 0
  });

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/users/all`, {
        headers: { Authorization: `Bearer ${user.accessToken}`, 'ngrok-skip-browser-warning': 'true' }
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
    } catch (e) { console.log(e); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const roleData = [
    { name: 'Donors', population: stats.donors, color: '#4F46E5', legendFontColor: '#475569', legendFontSize: 12 },
    { name: 'Donees', population: stats.donees, color: '#10B981', legendFontColor: '#475569', legendFontSize: 12 },
    { name: 'Surveyors', population: stats.surveyors, color: '#F59E0B', legendFontColor: '#475569', legendFontSize: 12 },
  ];

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#16476A" /></View>;

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
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' }
});