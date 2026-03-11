import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  StyleSheet, ActivityIndicator, SafeAreaView, Alert, StatusBar 
} from 'react-native';
import axios from 'axios';

const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function SurveyorTasksScreen({ route, navigation }: any) {
  const { user } = route.params; // Login data
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveyorAndAssignments();
  }, []);

  const fetchSurveyorAndAssignments = async () => {
    try {
      setLoading(true);
      const token = user.accessToken;
      
      const surveyorRes = await axios.get(`${BASE_URL}/api/admin/users/all-available-surveyor`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const allSurveyors = surveyorRes.data.surveyors || [];
      
      const currentSurveyor = allSurveyors.find((s: any) => 
        s.email?.toLowerCase() === user.user.email?.toLowerCase() || 
        s.userId === user.user.id
      );

      if (!currentSurveyor) {
        Alert.alert("Error", "Aapka profile surveyor list mein nahi mila.");
        setLoading(false);
        return;
      }

      const targetSurveyorId = currentSurveyor.surveyorId;

      const assignmentRes = await axios.get(
        `${BASE_URL}/api/v1/admin/assignments/surveyor/${targetSurveyorId}`, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      const taskData = Array.isArray(assignmentRes.data) ? assignmentRes.data : (assignmentRes.data.data || []);
      setTasks(taskData);

    } catch (error: any) {
      console.error("API Error:", error);
      Alert.alert("Error", "Data load karne mein problem hui.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => {
    // Priority wise color logic (Same as Admin Assignment logic)
    const isUrgent = item.priority === 'URGENT' || item.priority === 'HIGH';
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('FillDoneeProfile', { 
          user, 
          assignmentId: item.assignmentId, 
          actualDoneeId: item.doneeId 
        })}
      >
        <View style={styles.cardContent}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarTxt}>{(item.doneeName || 'D')[0]}</Text>
          </View>
          
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.name}>{item.doneeName || 'Unknown Donee'}</Text>
            <Text style={styles.city}>📍 {item.doneeCity || 'City Not Set'}</Text>
            <View style={styles.dateRow}>
               <Text style={styles.date}>📅 Visit: {item.scheduledVisitDate || 'TBD'}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, isUrgent && styles.urgentBadge]}>
            <Text style={[styles.badgeText, isUrgent && styles.urgentBadgeText]}>
                {item.priority || 'PENDING'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Tasks</Text>
        <Text style={styles.subHeader}>Welcome, {user.user.fullName || user.user.username}</Text>
      </View>

      {loading && tasks.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item: any) => item.assignmentId.toString()}
          renderItem={renderItem}
          onRefresh={fetchSurveyorAndAssignments}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Text style={{fontSize: 50, marginBottom: 15}}>📋</Text>
              <Text style={styles.emptyTitle}>No Pending Tasks</Text>
              <Text style={styles.emptyText}>You don't have any assignments scheduled right now.</Text>
            </View>
          }
          contentContainerStyle={[
            { padding: 20, paddingBottom: 40 },
            tasks.length === 0 && { flex: 1, justifyContent: 'center' }
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerContainer: { 
    padding: 25, 
    backgroundColor: '#000', 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35,
    marginBottom: 10
  },
  header: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  subHeader: { fontSize: 13, color: '#94A3B8', marginTop: 5, fontWeight: '600' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', fontWeight: '600', lineHeight: 20 },

  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatarSmall: { 
    width: 50, 
    height: 50, 
    borderRadius: 15, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  avatarTxt: { fontSize: 20, fontWeight: '900', color: '#000' },
  
  name: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  city: { color: '#64748B', marginTop: 3, fontSize: 13, fontWeight: '500' },
  dateRow: { marginTop: 6 },
  date: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  
  statusBadge: { 
    backgroundColor: '#F1F5F9', 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 10,
    alignSelf: 'flex-start'
  },
  badgeText: { color: '#64748B', fontWeight: '900', fontSize: 10, textTransform: 'uppercase' },
  
  urgentBadge: { backgroundColor: '#FEF2F2' },
  urgentBadgeText: { color: '#EF4444' }
});