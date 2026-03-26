import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  SafeAreaView, StatusBar, TextInput, Dimensions, Modal 
} from 'react-native';
import axios from 'axios';

const { height } = Dimensions.get('window');
const BASE_URL = 'https://perchable-freewheeling-faye.ngrok-free.dev'; 
const PRIMARY_GREEN = '#42b212';
const TEXT_DARK = '#0F172A';
const LIGHT_GREY = '#F8FAFC';

// ✅ Component outside to prevent Hook errors
const UserCard = React.memo(({ item, activeTab, onReject, onApprove, onToggleStatus }: any) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item?.firstName || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.infoSection}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Text style={styles.userName}>{item?.firstName} {item?.lastName}</Text>
            {/* ✅ Added Role Tag Here */}
            <View style={styles.roleTag}>
               <Text style={styles.roleTagText}>{item?.role || 'User'}</Text>
            </View>
          </View>
          <Text style={styles.userEmail}>{item?.email}</Text>
          <Text style={styles.userPhone}>{item?.phone}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.pill, { backgroundColor: item?.active ? '#f1fdf0' : '#FEF2F2' }]}>
          <Text style={[styles.pillText, { color: item?.active ? PRIMARY_GREEN : '#DC2626' }]}>
            {item?.active ? '✓ Approved' : '✕ Restricted'}
          </Text>
        </View>

        <View style={styles.actions}>
          {activeTab === 'pending' ? (
            <View style={styles.btnGroup}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(item.userId)}>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(item.userId)}>
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.toggleBtn, { backgroundColor: item?.active ? '#FEF2F2' : '#f1fdf0', borderColor: item?.active ? '#FEE2E2' : '#dcfce7' }]}
              onPress={() => onToggleStatus(item.userId, !!item.active)}
            >
              <Text style={[styles.toggleBtnText, { color: item?.active ? '#B91C1C' : PRIMARY_GREEN }]}>
                {item?.active ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

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

  const getHeaders = useCallback(() => ({
    headers: { 
      'Authorization': `Bearer ${user.accessToken}`,
      'ngrok-skip-browser-warning': 'true' 
    }
  }), [user.accessToken]);

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
  }, [activeTab, user.accessToken, getHeaders]);

  useEffect(() => {
    fetchUsers();
    setSearchQuery('');
  }, [fetchUsers]);

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
      showPopup("Success ✨", "User approved successfully."); 
      fetchUsers();
    } catch (error) { showPopup("Error", "Failed to approve.", true); }
  };

  const handleReject = async (userId: any) => {
    try {
      await axios.post(`${BASE_URL}/api/admin/users/${userId}/reject`, { reason: "Declined" }, getHeaders());
      showPopup("Rejected", "Request declined.", true);
      fetchUsers();
    } catch (e) { showPopup("Error", "Action failed.", true); }
  };

  const toggleStatus = async (userId: any, currentActiveStatus: boolean) => {
    const action = currentActiveStatus ? 'deactivate' : 'activate';
    try {
      await axios.post(`${BASE_URL}/api/admin/users/${action}?userId=${userId}`, {}, getHeaders());
      showPopup(currentActiveStatus ? "Deactivated" : "Activated", `User account is now ${action}d.`, currentActiveStatus);
      fetchUsers();
    } catch (error) { showPopup("Error", "Action failed.", true); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, {color: modalMsg.isError ? '#DC2626' : PRIMARY_GREEN}]}>{modalMsg.title}</Text>
            <Text style={styles.modalBody}>{modalMsg.body}</Text>
            <TouchableOpacity style={[styles.modalBtnMain, {backgroundColor: modalMsg.isError ? '#DC2626' : PRIMARY_GREEN}]} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalBtnTextMain}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'pending' ? 'Review new account requests' : 'Manage all registered users'}
        </Text>
        
        {activeTab === 'all' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBarWrapper}>
              <Text style={{marginLeft: 15}}>🔍</Text>
              <TextInput style={styles.searchBar} placeholder="Search accounts..." value={searchQuery} onChangeText={setSearchQuery} />
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

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.userId.toString()}
        renderItem={({ item }) => (
          <UserCard 
            item={item} 
            activeTab={activeTab} 
            onReject={handleReject}
            onApprove={handleApprove}
            onToggleStatus={toggleStatus}
          />
        )}
        contentContainerStyle={{ padding: 20 }}
        refreshing={loading}
        onRefresh={fetchUsers}
        ListEmptyComponent={
          <View style={{marginTop: 50, alignItems: 'center'}}>
            <Text style={{color: '#94A3B8', fontWeight: '600'}}>No users found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 25, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: '900', color: TEXT_DARK },
  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', gap: 10, marginTop: 15 },
  searchBarWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: LIGHT_GREY, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  searchBar: { flex: 1, padding: 12, color: TEXT_DARK, fontWeight: '600' },
  sortBtn: { backgroundColor: PRIMARY_GREEN, paddingHorizontal: 15, borderRadius: 15, justifyContent: 'center' },
  sortBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  tabContainer: { flexDirection: 'row', marginTop: 20, paddingHorizontal: 20 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#F1F5F9' },
  activeTab: { borderBottomColor: PRIMARY_GREEN },
  tabText: { fontWeight: '700', color: '#94A3B8' },
  activeTabText: { color: PRIMARY_GREEN },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 55, height: 55, borderRadius: 18, backgroundColor: '#f1fdf0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '900', color: PRIMARY_GREEN },
  infoSection: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 17, fontWeight: '800', color: TEXT_DARK },
  
  // ✅ Role Tag Styles
  roleTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleTagText: { fontSize: 10, color: '#64748B', fontWeight: '900', textTransform: 'uppercase' },

  userEmail: { fontSize: 13, color: '#64748B' },
  userPhone: { fontSize: 12, color: '#94A3B8' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '800' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  btnGroup: { flexDirection: 'row', gap: 8 },
  approveBtn: { backgroundColor: PRIMARY_GREEN, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  approveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  rejectBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  rejectBtnText: { color: '#EF4444', fontWeight: '900', fontSize: 12 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  toggleBtnText: { fontSize: 12, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 25, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  modalBody: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 25 },
  modalBtnMain: { width: '100%', height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modalBtnTextMain: { color: '#FFF', fontWeight: '900' }
});