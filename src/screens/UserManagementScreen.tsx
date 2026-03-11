import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, StatusBar, TextInput, Dimensions, Modal 
} from 'react-native';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
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

  const getHeaders = () => ({
    headers: { 
      'Authorization': `Bearer ${user.accessToken}`,
      'ngrok-skip-browser-warning': 'true' 
    }
  });

  const fetchUsers = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      setLoading(true);
      const endpoint = activeTab === 'pending' ? '/api/admin/users/pending' : '/api/admin/users/all';
      const res = await axios.get(`${BASE_URL}${endpoint}`, getHeaders());
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
      await axios.post(`${BASE_URL}/api/admin/users/${userId}/approve`, { adminId: user.userId }, getHeaders());
      showPopup("Success ✨", "User has been approved successfully.", false); 
      fetchUsers();
    } catch (error) {
      showPopup("Error", "Failed to approve user.", true); 
    }
  };

  const handleReject = async (userId: any) => {
    try {
      await axios.post(`${BASE_URL}/api/admin/users/${userId}/reject`, { reason: "Declined by admin" }, getHeaders());
      showPopup("Rejected", "User request has been declined.", true);
      fetchUsers();
    } catch (e) { 
      showPopup("Error", "Action failed.", true); 
    }
  };

  const toggleStatus = async (userId: any, currentActiveStatus: boolean) => {
    const action = currentActiveStatus ? 'deactivate' : 'activate';
    try {
      await axios.post(`${BASE_URL}/api/admin/users/${action}?userId=${userId}`, {}, getHeaders());
      showPopup(
        currentActiveStatus ? "Deactivated" : "Activated", 
        `User is now ${action}d.`, 
        currentActiveStatus 
      );
      fetchUsers();
    } catch (error) {
      showPopup("Error", "Unauthorized or request failed.", true);
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
            <View style={styles.roleChip}>
              <Text style={styles.roleText}>{item?.role || 'USER'}</Text>
            </View>
          </View>
          <Text style={styles.userEmail}>{item?.email}</Text>
          <Text style={styles.userPhone}>{item?.phone}</Text>
        </View>
        {activeTab === 'all' && (
            <View style={[styles.statusIndicator, { backgroundColor: item?.active ? '#10B981' : '#EF4444' }]} />
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.pill, { backgroundColor: item?.active ? '#DCFCE7' : '#FEF2F2' }]}>
          <Text style={[styles.pillText, { color: item?.active ? '#15803D' : '#DC2626' }]}>
            {item?.active ? '✓ Active Account' : '✕ Deactivated'}
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
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.statusDotModal, { backgroundColor: modalMsg.isError ? '#EF4444' : '#10B981' }]} />
            <Text style={styles.modalTitle}>{modalMsg.title}</Text>
            <Text style={styles.modalBody}>{modalMsg.body}</Text>
            <TouchableOpacity style={styles.modalBtnMain} onPress={handleModalClose}>
              <Text style={styles.modalBtnTextMain}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        {activeTab === 'all' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBarWrapper}>
              <Text style={{paddingLeft: 12}}>🔍</Text>
              <TextInput 
                style={styles.searchBar} 
                placeholder="Search user..." 
                placeholderTextColor="#94A3B8"
                value={searchQuery} 
                onChangeText={setSearchQuery} 
              />
            </View>
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
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.userId.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={[
            { padding: 20, paddingBottom: 40 },
            displayData.length === 0 && { flex: 1, justifyContent: 'center' }
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{fontSize: 50, marginBottom: 15}}>👥</Text>
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'pending' 
                  ? "There are no pending registration requests at this moment." 
                  : "We couldn't find any user accounts matching your criteria."}
              </Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchUsers}
          showsVerticalScrollIndicator={false}
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
    borderBottomRightRadius: 35 
  },
  title: { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  searchContainer: { flexDirection: 'row', gap: 10, marginTop: 20 },
  searchBarWrapper: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 15 
  },
  searchBar: { flex: 1, padding: 12, color: '#FFF', fontWeight: '600' },
  sortBtn: { backgroundColor: '#FFF', paddingHorizontal: 15, borderRadius: 15, justifyContent: 'center' },
  sortBtnText: { color: '#000', fontWeight: '900', fontSize: 12 },
  
  tabContainer: { 
    flexDirection: 'row', 
    marginTop: 10, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  tab: { flex: 1, paddingVertical: 18, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#000' },
  tabText: { fontWeight: '700', color: '#94A3B8', fontSize: 13 },
  activeTabText: { color: '#000' },

  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 18, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#000' },
  infoSection: { marginLeft: 16, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  roleChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  roleText: { fontSize: 10, fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  userEmail: { fontSize: 13, color: '#64748B', marginTop: 3, fontWeight: '500' },
  userPhone: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 18, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#F8FAFC' 
  },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '800' },
  
  actions: { flexDirection: 'row' },
  btnGroup: { flexDirection: 'row', gap: 10 },
  approveBtn: { backgroundColor: '#000', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  approveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  rejectBtn: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#EF4444', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  rejectBtnText: { color: '#EF4444', fontWeight: '900', fontSize: 12 },
  toggleBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  toggleBtnText: { fontSize: 12, fontWeight: '900' },

  // Empty State Styles
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 40
  },
  emptyTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#0F172A', 
    marginBottom: 8 
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: '#94A3B8', 
    textAlign: 'center', 
    paddingHorizontal: 40,
    fontWeight: '600',
    lineHeight: 20
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 32, padding: 30, alignItems: 'center' },
  statusDotModal: { width: 50, height: 6, borderRadius: 3, marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#000', marginBottom: 10, textAlign: 'center' },
  modalBody: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 30, fontWeight: '600', lineHeight: 22 },
  modalBtnMain: { backgroundColor: '#000', width: '100%', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalBtnTextMain: { color: '#FFF', fontWeight: '900', letterSpacing: 1, fontSize: 14 }
});