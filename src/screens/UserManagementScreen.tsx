import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, StatusBar, TextInput, Dimensions, Modal 
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev'; 

export default function UserManagementScreen({ route }: any) {
  const user = route?.params?.user || {}; 
  
  const [users, setUsers] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState({ title: '', body: '', isError: false });

  const showPopup = (title: string, body: string, isError = false) => {
    setModalMsg({ title, body, isError });
    setModalVisible(true);
  };

  const handleModalClose = () => setModalVisible(false);

  const fetchUsers = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      setLoading(true);
      // Endpoints from AdminUserApprovalController.java
      const endpoint = activeTab === 'pending' ? '/api/admin/users/pending' : '/api/admin/users/all';
      const res = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: { 
          'Authorization': `Bearer ${user.accessToken}`,
          'ngrok-skip-browser-warning': 'true' 
        }
      });
      const fetchedUsers = res.data?.users || [];
      setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.accessToken]);

  useEffect(() => {
    fetchUsers();
    setSearchQuery('');
  }, [fetchUsers, activeTab]);

  const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

  const displayData = useMemo(() => {
    let result = [...users];
    if (activeTab === 'all' && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u?.firstName || '').toLowerCase().includes(query) ||
        (u?.email || '').toLowerCase().includes(query)
      );
    }
    if (activeTab === 'all') {
      result.sort((a, b) => {
        const nameA = (a?.firstName || '').toLowerCase();
        const nameB = (b?.firstName || '').toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }
    return result;
  }, [users, searchQuery, sortOrder, activeTab]);

  const handleApprove = async (userId: any) => {
    try {
      await axios.post(`${BASE_URL}/api/admin/users/${userId}/approve`, {
        adminId: user.userId 
      }, {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      showPopup("Success ✨", "User has been approved successfully.", false); 
      fetchUsers();
    } catch (error) {
      showPopup("Error", "Failed to approve user.", true); 
    }
  };

  const handleReject = async (userId: any) => {
    try {
      await axios.post(`${BASE_URL}/api/admin/users/${userId}/reject`, {
        reason: "Request declined by administrator" 
      }, {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      showPopup("Rejected", "User request has been declined.", true);
      fetchUsers();
    } catch (e) { 
      showPopup("Error", "Action failed.", true); 
    }
  };

  // Active/Inactive logic based on provided URLs
  const toggleStatus = async (userId: any, currentActiveStatus: boolean) => {
    const action = currentActiveStatus ? 'deactivate' : 'activate';
    try {
      // Using GET as per your provided URL structure: /api/v1/user/activate?currentUserId=2
      await axios.post(`${BASE_URL}/api/v1/user/${action}?currentUserId=${userId}`, {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
      });
      showPopup(
        currentActiveStatus ? "Deactivated" : "Activated", 
        `User is now ${action}d.`, 
        currentActiveStatus 
      );
      fetchUsers();
    } catch (error) {
      showPopup("Error", "Update failed.", true);
    }
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item?.firstName || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item?.firstName} {item?.lastName}
            </Text>
            <View style={styles.roleChip}><Text style={styles.roleText}>{item?.role || 'USER'}</Text></View>
          </View>
          <Text style={styles.userEmail}>{item?.email}</Text>
          <Text style={styles.userPhone}>{item?.phone}</Text>
        </View>
        {activeTab === 'all' && (
            <View style={[styles.statusIndicator, { backgroundColor: item?.active ? '#10B981' : '#EF4444' }]} />
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.pill, { backgroundColor: item?.active ? '#DCFCE7' : '#FEF3C7' }]}>
          <Text style={[styles.pillText, { color: item?.active ? '#15803D' : '#B45309' }]}>
            {item?.active ? '✓ Active' : '⏳ Pending'}
          </Text>
        </View>

        <View style={styles.actions}>
          {activeTab === 'pending' ? (
            <View style={styles.btnGroup}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.userId)}>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.userId)}>
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.toggleBtn, { backgroundColor: item?.active ? '#FEE2E2' : '#DCFCE7' }]}
              onPress={() => toggleStatus(item.userId, !!item.active)}
            >
              <Text style={[styles.toggleBtnText, { color: item?.active ? '#B91C1C' : '#15803D' }]}>
                {item?.active ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16476A" />
      
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={handleModalClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.statusDotModal, { backgroundColor: modalMsg.isError ? '#DC2626' : '#059669' }]} />
            <Text style={styles.modalTitle}>{modalMsg.title}</Text>
            <Text style={styles.modalBody}>{modalMsg.body}</Text>
            <TouchableOpacity style={styles.modalBtnMain} onPress={handleModalClose}>
              <Text style={styles.modalBtnTextMain}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        {activeTab === 'all' && (
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchBar} 
              placeholder="Search user..." 
              placeholderTextColor="#94A3B8"
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
            <TouchableOpacity onPress={toggleSort} style={styles.sortBtn}>
              <Text style={styles.sortBtnText}>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'pending' && styles.activeTab]} onPress={() => setActiveTab('pending')}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.activeTab]} onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Users</Text>
        </TouchableOpacity>
      </View>

      {loading && users.length === 0 ? (
        <ActivityIndicator size="large" color="#16476A" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.userId.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
          refreshing={loading}
          onRefresh={fetchUsers}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F5F5' },
  header: { padding: 20, backgroundColor: '#16476A', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  searchContainer: { flexDirection: 'row', gap: 10, marginTop: 15 },
  searchBar: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, color: '#FFF' },
  sortBtn: { backgroundColor: '#FFF', paddingHorizontal: 15, borderRadius: 12, justifyContent: 'center' },
  sortBtnText: { color: '#16476A', fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: 'transparent', marginTop: 10, paddingHorizontal: 10 },
  tab: { flex: 1, padding: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 4, borderBottomColor: '#16476A' },
  tabText: { fontWeight: '800', color: '#94A3B8' },
  activeTabText: { color: '#16476A' },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F5F5', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#16476A' },
  infoSection: { marginLeft: 15, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 17, fontWeight: '900', color: '#16476A' },
  roleChip: { backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#16476A' },
  userEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  userPhone: { fontSize: 12, color: '#94A3B8' },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: 'bold' },
  actions: { flexDirection: 'row' },
  btnGroup: { flexDirection: 'row', gap: 8 },
  approveBtn: { backgroundColor: '#16476A', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  approveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  rejectBtn: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#EF4444', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  rejectBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },
  toggleBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  toggleBtnText: { fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(22, 71, 106, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 28, padding: 30, alignItems: 'center' },
  statusDotModal: { width: 12, height: 12, borderRadius: 6, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#16476A', marginBottom: 8, textAlign: 'center' },
  modalBody: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 25, fontWeight: '600' },
  modalBtnMain: { backgroundColor: '#16476A', width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalBtnTextMain: { color: '#FFF', fontWeight: '800', letterSpacing: 1 }
});