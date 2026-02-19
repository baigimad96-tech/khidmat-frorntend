import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  StyleSheet, ActivityIndicator, SafeAreaView, Alert 
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
      
      // Step 1: Saare Surveyors ki list fetch karein
      const surveyorRes = await axios.get(`${BASE_URL}/api/admin/users/all-available-surveyor`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      // Aapke JSON ke according data "surveyors" key ke andar hai
      const allSurveyors = surveyorRes.data.surveyors || [];
      
      // Step 2: Login user ki email ya userId match karke "surveyorId" nikalna
      const currentSurveyor = allSurveyors.find((s: any) => 
        s.email?.toLowerCase() === user.user.email?.toLowerCase() || 
        s.userId === user.user.id
      );

      if (!currentSurveyor) {
        Alert.alert("Error", "Aapka profile surveyor list mein nahi mila.");
        setLoading(false);
        return;
      }

      // Backend API ko "surveyorId" chahiye (e.g. 1, 3)
      const targetSurveyorId = currentSurveyor.surveyorId;

      // Step 3: Assignments fetch karein specific surveyorId use karke
      const assignmentRes = await axios.get(
        `${BASE_URL}/api/v1/admin/assignments/surveyor/${targetSurveyorId}`, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        }
      );

      // Backend direct List return kar raha hai
      const taskData = Array.isArray(assignmentRes.data) ? assignmentRes.data : (assignmentRes.data.data || []);
      setTasks(taskData);

    } catch (error: any) {
      console.error("API Error:", error);
      Alert.alert("Error", "Data load karne mein problem hui.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('FillDoneeProfile', { user, assignmentId: item.assignmentId })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.doneeName || 'Unknown Donee'}</Text>
        <Text style={styles.city}>📍 {item.doneeCity || 'City Not Set'}</Text>
        <Text style={styles.date}>📅 {item.scheduledVisitDate || 'TBD'}</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.badgeText}>{item.priority || 'PENDING'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Tasks</Text>
        <Text style={styles.subHeader}>Welcome, {user.user.fullName || user.user.username}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16476A" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item: any) => item.assignmentId.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No pending assignments found.</Text>
            </View>
          }
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  header: { fontSize: 26, fontWeight: 'bold', color: '#16476A' },
  subHeader: { fontSize: 14, color: '#64748B', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  card: { 
    backgroundColor: '#FFF', 
    padding: 18, 
    borderRadius: 15, 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 15, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  name: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  city: { color: '#64748B', marginTop: 5, fontSize: 14 },
  date: { color: '#94A3B8', fontSize: 12, marginTop: 5 },
  statusBadge: { backgroundColor: '#E0F2FE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  badgeText: { color: '#16476A', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' },
  emptyText: { color: '#94A3B8', fontSize: 16 }
});