import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, StatusBar, Modal, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev';
const PRIMARY_GREEN = '#42b212';

export default function DoneeApprovalScreen({ route }: any) {
    const { user } = route.params || {};
    const [donees, setDonees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDonee, setSelectedDonee] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

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
        setActionLoading(true);
        try {
            await axios.patch(`${BASE_URL}/api/admin/users/approve-donee/${id}`, {}, {
                headers: { Authorization: `Bearer ${user?.accessToken}` }
            });
            Alert.alert("Success ✨", "Donee has been approved successfully.");
            setModalVisible(false);
            fetchDonees();
        } catch (err) {
            Alert.alert("Error", "Approval failed");
        } finally {
            setActionLoading(false);
        }
    };

    const DetailRow = ({ label, value, isFullWidth = false }: any) => (
        <View style={[styles.detailRow, isFullWidth && { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || 'N/A'}</Text>
        </View>
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => { setSelectedDonee(item); setModalVisible(true); }}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.fullName || 'D')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.infoSection}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.info}>{item.city} • {item.phone}</Text>
                <Text style={[styles.recommendationTag, { color: item.recommendation === 'RECOMMENDED' ? PRIMARY_GREEN : '#42b212' }]}>
                    ★ {item.recommendation}
                </Text>
            </View>
            <Text style={styles.viewLink}>View Details ›</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            <View style={styles.header}>
                <Text style={styles.title}>Pending Approvals</Text>
                <Text style={styles.subtitle}>Click on a profile to review survey details</Text>
                <View style={styles.headerUnderline} />
            </View>

            {loading && donees.length === 0 ? (
                <View style={styles.loaderContainer}><ActivityIndicator size="large" color={PRIMARY_GREEN} /></View>
            ) : (
                <FlatList
                    data={donees}
                    keyExtractor={(item) => item.doneeId.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={renderItem}
                    onRefresh={fetchDonees}
                    refreshing={loading}
                    ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyTitle}>No pending donees</Text></View>}
                />
            )}

            {/* --- Profile Detail Modal --- */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Donee Profile</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                            {selectedDonee && (
                                <>
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Basic Information</Text>
                                        <DetailRow label="Full Name" value={selectedDonee.fullName} />
                                        <DetailRow label="Phone" value={selectedDonee.phone} />
                                        <DetailRow label="WhatsApp" value={selectedDonee.whatsappNumber} />
                                        <DetailRow label="Email" value={selectedDonee.email} />
                                        <DetailRow label="Gender" value={selectedDonee.gender} />
                                        <DetailRow label="Date of Birth" value={selectedDonee.dateOfBirth} />
                                    </View>

                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Address Details</Text>
                                        <DetailRow label="Full Address" value={`${selectedDonee.road}, ${selectedDonee.locality}, ${selectedDonee.city}, ${selectedDonee.state} - ${selectedDonee.postalCode}`} isFullWidth />
                                    </View>

                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Surveyor Report</Text>
                                        <DetailRow label="Recommendation" value={selectedDonee.recommendation} />
                                        <DetailRow label="Surveyor Rating" value={`${selectedDonee.surveyorRating}/5`} />
                                        <DetailRow label="Residence Condition" value={selectedDonee.residenceCondition} />
                                        <DetailRow label="Family Members" value={selectedDonee.familyMembersListed} isFullWidth />
                                        <DetailRow label="Surveyor Remarks" value={selectedDonee.surveyorRemarks} isFullWidth />
                                        <DetailRow label="Red Flags" value={selectedDonee.redFlags || "None"} isFullWidth />
                                    </View>

                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Verification Status</Text>
                                        <DetailRow label="Address Verified" value={selectedDonee.addressVerified ? "✅ Yes" : "❌ No"} />
                                        <DetailRow label="Income Verified" value={selectedDonee.incomeVerified ? "✅ Yes" : "❌ No"} />
                                        <DetailRow label="Family Size Verified" value={selectedDonee.familySizeVerified ? "✅ Yes" : "❌ No"} />
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Close</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.approveFullBtn} 
                                onPress={() => handleApprove(selectedDonee?.doneeId)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.approveBtnText}>Approve Donee</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 10 },
    title: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
    subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
    headerUnderline: { width: 40, height: 4, backgroundColor: PRIMARY_GREEN, marginTop: 12, borderRadius: 2 },
    
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },

    card: { 
        backgroundColor: '#FFF', 
        borderRadius: 20, 
        padding: 16, 
        marginBottom: 12, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#F1F5F9',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8
    },
    avatar: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#f1fdf0', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 20, fontWeight: '900', color: PRIMARY_GREEN },
    infoSection: { flex: 1, marginLeft: 15 },
    name: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    info: { fontSize: 12, color: '#64748B', marginTop: 2 },
    recommendationTag: { fontSize: 10, fontWeight: '800', marginTop: 5, letterSpacing: 0.5 },
    viewLink: { fontSize: 12, color: PRIMARY_GREEN, fontWeight: '700' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
    closeBtn: { fontSize: 20, color: '#94A3B8', padding: 5 },
    
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: PRIMARY_GREEN, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    detailLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    detailValue: { fontSize: 14, color: '#0F172A', fontWeight: '700', flexShrink: 1, textAlign: 'right' },

    modalFooter: { flexDirection: 'row', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    cancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 15, backgroundColor: '#F1F5F9' },
    cancelBtnText: { color: '#64748B', fontWeight: '800' },
    approveFullBtn: { flex: 2, backgroundColor: PRIMARY_GREEN, paddingVertical: 15, alignItems: 'center', borderRadius: 15, elevation: 3 },
    approveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },

    emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
    emptyTitle: { color: '#94A3B8', fontWeight: '600' }
});