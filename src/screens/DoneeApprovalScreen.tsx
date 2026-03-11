import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, StatusBar 
} from 'react-native';
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
            setLoading(true);
            const res = await axios.get(`${BASE_URL}/api/admin/users/all-survey-completed-donee`, {
                headers: { 
                    Authorization: `Bearer ${user?.accessToken}`,
                    'ngrok-skip-browser-warning': 'true'
                }
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
            Alert.alert("Success ✨", "Donee has been approved successfully.");
            fetchDonees();
        } catch (err) {
            Alert.alert("Error", "Approval failed");
        } finally {
            setActionLoading(null);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.fullName || 'D')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.infoSection}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.info}>{item.phone} • {item.city}</Text>
                <View style={styles.surveyTag}>
                    <Text style={styles.surveyTagText}>✓ Survey Completed</Text>
                </View>
            </View>
            <TouchableOpacity 
                style={[styles.approveBtn, actionLoading === item.doneeId && { opacity: 0.7 }]} 
                onPress={() => handleApprove(item.doneeId)}
                disabled={actionLoading === item.doneeId}
            >
                {actionLoading === item.doneeId ? (
                    <ActivityIndicator color="#FFF" size="small" />
                ) : (
                    <Text style={styles.approveBtnText}>Approve</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            
            {/* Dark Premium Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Donee Approval</Text>
                <Text style={styles.subtitle}>Review and verify survey completions</Text>
            </View>

            {loading && donees.length === 0 ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : (
                <FlatList
                    data={donees}
                    keyExtractor={(item) => item.doneeId.toString()}
                    contentContainerStyle={[
                        styles.listContent,
                        donees.length === 0 && { flex: 1, justifyContent: 'center' }
                    ]}
                    renderItem={renderItem}
                    onRefresh={fetchDonees}
                    refreshing={loading}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={styles.emptyTitle}>No Pending Donees</Text>
                            <Text style={styles.emptySubtitle}>
                                All donee surveys have been reviewed. New requests will appear here.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { 
        padding: 25, 
        backgroundColor: '#000', 
        borderBottomLeftRadius: 35, 
        borderBottomRightRadius: 35,
        marginBottom: 10
    },
    title: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 5, fontWeight: '600' },
    
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 40 },

    card: { 
        backgroundColor: '#FFF', 
        borderRadius: 24, 
        padding: 16, 
        marginBottom: 15, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#F1F5F9',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    avatar: { 
        width: 50, 
        height: 50, 
        borderRadius: 15, 
        backgroundColor: '#F8FAFC', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    avatarText: { fontSize: 20, fontWeight: '900', color: '#000' },
    infoSection: { flex: 1, marginLeft: 15 },
    name: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
    info: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
    surveyTag: { 
        backgroundColor: '#DCFCE7', 
        alignSelf: 'flex-start', 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 6, 
        marginTop: 6 
    },
    surveyTagText: { fontSize: 10, fontWeight: '800', color: '#15803D' },
    
    approveBtn: { 
        backgroundColor: '#000', 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 12,
        minWidth: 80,
        alignItems: 'center'
    },
    approveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },

    // Empty State
    emptyContainer: { alignItems: 'center', justifyContent: 'center' },
    emptyIcon: { fontSize: 50, marginBottom: 15 },
    emptyTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
    emptySubtitle: { 
        fontSize: 14, 
        color: '#94A3B8', 
        textAlign: 'center', 
        paddingHorizontal: 40,
        fontWeight: '600',
        lineHeight: 20
    }
});