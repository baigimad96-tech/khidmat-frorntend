import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  ActivityIndicator, Dimensions, RefreshControl, TouchableOpacity 
} from 'react-native';
import axios from 'axios';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

interface User {
  userId: number;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  gender: string;
  phone: string;
  createdAt?: string;
}

export default function AdminDashboard({ route, navigation }: any) {
  const loginResponseData = route.params?.user; 
  const userData = loginResponseData?.user;
  const token = loginResponseData?.accessToken;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    active: 0, inactive: 0, total: 0,
    maleTotal: 0, femaleTotal: 0,
    genderMatrix: [[0, 0], [0, 0], [0, 0]], 
    inactiveUsers: [] as User[]
  });

  const processData = (users: User[]) => {
    let act = 0, inact = 0, mTotal = 0, fTotal = 0;
    let drM = 0, drF = 0, deM = 0, deF = 0, svM = 0, svF = 0;
    let inactives: User[] = [];

    users.forEach(u => {
      if (u.role?.toUpperCase() === 'ADMIN') return;

      if (u.active) act++; 
      else { inact++; inactives.push(u); }
      
      const isF = u.gender?.toUpperCase() === 'FEMALE';
      isF ? fTotal++ : mTotal++;

      if (u.role === 'DONOR') isF ? drF++ : drM++;
      else if (u.role === 'DONEE') isF ? deF++ : deM++;
      else if (u.role === 'SURVEYOR') isF ? svF++ : svM++;
    });

    setStats({
      active: act, inactive: inact, total: act + inact,
      maleTotal: mTotal, femaleTotal: fTotal,
      genderMatrix: [[drM, drF], [deM, deF], [svM, svF]],
      inactiveUsers: inactives
    });
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/users/all`, {
        headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
      });
      processData(res.data.users || []);
    } catch (e) { console.log(e); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Chart 1: Status Data
  const statusPieData = [
    { name: 'Active', population: stats.active, color: '#10B981', legendFontColor: '#475569', legendFontSize: 12 },
    { name: 'Inactive', population: stats.inactive, color: '#EF4444', legendFontColor: '#475569', legendFontSize: 12 },
  ];

  // Chart 2: Gender Data
  const genderPieData = [
    { name: 'Male', population: stats.maleTotal, color: '#0F172A', legendFontColor: '#475569', legendFontSize: 12 },
    { name: 'Female', population: stats.femaleTotal, color: '#38BDF8', legendFontColor: '#475569', legendFontSize: 12 },
  ];

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} />}
      >
        <View style={styles.topHeader}>
          <Text style={styles.greet}>Welcome</Text>
          <Text style={styles.adminName}>{userData?.firstName} {userData?.lastName}</Text>
        </View>

        {/* Management Actions Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>User Management</Text>
          <View style={styles.menuGrid}>
            <ToolButton title="Users" sub="Verify Roles" color="#F0F9FF" text="#0369A1" onPress={() => navigation.navigate('UserManagement', { user: loginResponseData })} />
            <ToolButton title="Approvals" sub="Donee Status" color="#F0FDF4" text="#15803D" onPress={() => navigation.navigate('DoneeApproval', { user: loginResponseData })} />
            <ToolButton title="Assignments" sub="Task Staff" color="#FFFBEB" text="#B45309" onPress={() => navigation.navigate('AdminAssignment', { user: loginResponseData })} />
            <ToolButton title="Settings" sub="System Config" color="#F8FAFC" text="#475569" onPress={() => navigation.navigate('MoreSettings', { user: loginResponseData })} />
          </View>
        </View>

        {/* Double Pie Charts Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>User Account Status</Text>
          
          <View style={styles.chartCard}>
             {stats.total > 0 ? (
                <PieChart
                    data={statusPieData}
                    width={width - 50}
                    height={150}
                    chartConfig={chartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                />
             ) : <Text style={styles.emptyTxt}>No status data</Text>}
          </View>

          <View style={[styles.chartCard, {marginTop: 15}]}>
             <Text style={styles.innerLabel}>Gender Distribution</Text>
             {stats.total > 0 ? (
                <PieChart
                    data={genderPieData}
                    width={width - 50}
                    height={150}
                    chartConfig={chartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                />
             ) : <Text style={styles.emptyTxt}>No gender data</Text>}
             
             {/* Breakdown Table */}
             <View style={styles.dataTable}>
                <View style={styles.dataRow}><Text style={styles.dataHeader}>Role</Text><Text style={styles.dataHeader}>M</Text><Text style={styles.dataHeader}>F</Text></View>
                {["Donors", "Donees", "Staff"].map((role, i) => (
                    <View key={i} style={styles.dataRow}>
                    <Text style={styles.dataCellLabel}>{role}</Text>
                    <Text style={styles.dataCell}>{stats.genderMatrix[i][0]}</Text>
                    <Text style={styles.dataCell}>{stats.genderMatrix[i][1]}</Text>
                    </View>
                ))}
             </View>
          </View>
        </View>

        {/* Inactive Users List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Inactive Users Activity</Text>
          <View style={styles.listCard}>
            {stats.inactiveUsers.length > 0 ? stats.inactiveUsers.map((u, i) => (
              <View key={i} style={styles.userRow}>
                <View style={styles.avatar}><Text style={styles.avatarTxt}>{u.firstName[0]}</Text></View>
                <View style={{flex: 1}}>
                  <Text style={styles.uName}>{u.firstName} {u.lastName}</Text>
                  <Text style={styles.uRole}>{u.role} • {u.phone}</Text>
                  {u.createdAt && <Text style={styles.uDate}>Joined: {new Date(u.createdAt).toLocaleDateString()}</Text>}
                </View>
                <View style={styles.statusBadge} />
              </View>
            )) : <Text style={styles.emptyTxt}>All users are currently active.</Text>}
          </View>
        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ToolButton = ({ title, sub, color, text, onPress }: any) => (
  <TouchableOpacity style={[styles.toolItem, { backgroundColor: color }]} onPress={onPress}>
    <Text style={[styles.toolTitle, { color: text }]}>{title}</Text>
    <Text style={styles.toolSub}>{sub}</Text>
  </TouchableOpacity>
);

const chartConfig = {
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', marginTop: 25 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader: { padding: 25, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  greet: { fontSize: 10, color: '#94A3B8', fontWeight: '800', letterSpacing: 1.5 },
  adminName: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  sectionContainer: { paddingHorizontal: 25, marginTop: 25 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#64748B', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  toolItem: { width: '48%', padding: 18, borderRadius: 22, marginBottom: 12, elevation: 1 },
  toolTitle: { fontSize: 16, fontWeight: '800' },
  toolSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  chartCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 24, elevation: 2, alignItems: 'center' },
  innerLabel: { fontSize: 12, fontWeight: '800', color: '#1E293B', alignSelf: 'flex-start', marginBottom: 5, paddingLeft: 5 },
  dataTable: { width: '100%', marginTop: 10, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  dataHeader: { fontSize: 9, fontWeight: '900', color: '#94A3B8', flex: 1, textAlign: 'center' },
  dataCellLabel: { fontSize: 12, fontWeight: '700', color: '#475569', flex: 1 },
  dataCell: { fontSize: 12, fontWeight: '900', color: '#0F172A', flex: 1, textAlign: 'center' },
  listCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 10, elevation: 2 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarTxt: { fontWeight: 'bold', color: '#64748B' },
  uName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  uRole: { fontSize: 11, color: '#94A3B8' },
  uDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  statusBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  emptyTxt: { textAlign: 'center', padding: 20, color: '#94A3B8', fontWeight: '600' }
});