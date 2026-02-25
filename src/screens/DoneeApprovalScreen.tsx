import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';

export default function DoneeApprovalScreen({ route }: any) {
    const { user } = route.params || {};
    const [donees, setDonees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const fetchDonees = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/admin/users/all-survey-completed-donee`, {
                headers: { Authorization: `Bearer ${user?.accessToken}` }
            });
            setDonees(res.data.donees || []);
        } catch (err) {
            Alert.alert("Error", "Could not fetch donees");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDonees(); }, []);

    const handleApprove = async (id: number) => {
        setActionLoading(id);
        try {
            await axios.patch(`${BASE_URL}/api/admin/users/approve-donee/${id}`, {}, {
                headers: { Authorization: `Bearer ${user?.accessToken}` }
            });
            Alert.alert("Success", "Donee Approved");
            fetchDonees();
        } catch (err) {
            Alert.alert("Error", "Approval failed");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Donee Approval</Text>
            </View>
            {loading ? <ActivityIndicator size="large" color="#16476A" style={{marginTop: 50}} /> : (
                <FlatList
                    data={donees}
                    keyExtractor={(item) => item.doneeId.toString()}
                    contentContainerStyle={{padding: 15}}
                    renderItem={({item}) => (
                        <View style={styles.card}>
                            <View style={{flex: 1}}>
                                <Text style={styles.name}>{item.fullName}</Text>
                                <Text style={styles.info}>{item.phone} • {item.city}</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.btn} 
                                onPress={() => handleApprove(item.doneeId)}
                                disabled={actionLoading === item.doneeId}
                            >
                                {actionLoading === item.id ? <ActivityIndicator color="#FFF" /> : <Text style={{color:'#FFF', fontWeight:'bold'}}>Approve</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No pending approvals found</Text>}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#16476A' },
    card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 3 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    info: { fontSize: 13, color: '#64748B' },
    btn: { backgroundColor: '#10B981', padding: 10, borderRadius: 8 },
    empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});