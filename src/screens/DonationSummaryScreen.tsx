import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, StatusBar, Alert, ActivityIndicator, TextInput, Switch 
} from 'react-native';
import axios from 'axios';

const PRIMARY_GREEN = '#42b212';
const LIGHT_GREEN = '#f1fdf0';

export default function DonationSummaryScreen({ route, navigation }: any) {
  const { donee, selectedNeeds, user } = route.params || {};
  const [loading, setLoading] = useState(false);

  // --- Pre-filled States (Static defaults) ---
  const [donationType, setDonationType] = useState('CASH');
  const [fulfillmentType, setFulfillmentType] = useState('DIRECT_TRANSFER');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorMessage, setDonorMessage] = useState("Hope this helps. Stay strong.");
  const [donationAmount, setDonationAmount] = useState('');

  // Calculate suggested amount from selected needs
  const suggestedAmount = selectedNeeds?.reduce((sum: number, need: any) => sum + (need.estimatedAmount || 0), 0) || 0;

  // Function to distribute donation amount across needs proportionally
  const distributeAmountToNeeds = (totalAmount: number) => {
    if (!selectedNeeds || selectedNeeds.length === 0) return [];
    
    // Calculate total estimated amount
    const totalEstimated = selectedNeeds.reduce((sum: any, need: { estimatedAmount: any; }) => sum + (need.estimatedAmount || 0), 0);
    
    if (totalEstimated === 0) return [];
    
    // Distribute proportionally based on estimated amounts
    return selectedNeeds.map((need: { estimatedAmount: any; id: any; }) => {
      const proportion = (need.estimatedAmount || 0) / totalEstimated;
      const allocatedAmount = Math.round(totalAmount * proportion * 100) / 100; // Round to 2 decimal places
      
      return {
        needId: need.id,
        allocatedAmount: allocatedAmount
      };
    });
  };

  const handleConfirmDonation = async () => {
    if (!user?.accessToken) {
      Alert.alert("Error", "Session expired. Please login again.");
      return;
    }

    const amount = parseFloat(donationAmount);
    
    if (!donationAmount || isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid donation amount.");
      return;
    }

    if (!selectedNeeds || selectedNeeds.length === 0) {
      Alert.alert("Error", "No needs selected for donation.");
      return;
    }

    setLoading(true);
    
    // Distribute the donation amount across selected needs
    const distributedNeeds = distributeAmountToNeeds(amount);
    
    const payload = {
      doneeId: donee?.id,
      donationType: donationType,
      fulfillmentType: fulfillmentType,
      isAnonymous: isAnonymous,
      donorMessage: donorMessage,
      selectedNeeds: distributedNeeds,
      totalAmount: amount
    };

    // Log the payload for debugging
    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    try {
      const res = await axios.post(
        `https://perchable-freewheeling-faye.ngrok-free.dev/api/v1/donor/donations/initiate`, 
        payload,
        { 
          headers: { 
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('Response:', res.data);
      
      if (res.status === 200 || res.status === 201) {
        Alert.alert("Success", "Donation initiated successfully!");
        navigation.popToTop();
      }
    } catch (e: any) {
      console.log('Full error:', e);
      
      let errorMessage = "Request failed. Please try again.";
      
      if (e.response) {
        console.log('Error response data:', e.response.data);
        console.log('Error response status:', e.response.status);
        
        if (e.response.data?.message) {
          errorMessage = e.response.data.message;
        } else if (e.response.data?.errors) {
          errorMessage = JSON.stringify(e.response.data.errors);
        } else {
          errorMessage = `Server error: ${e.response.status}`;
        }
      } else if (e.request) {
        errorMessage = "No response from server. Check your internet connection.";
      } else {
        errorMessage = e.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderSelector = (label: string, value: string, options: string[], setter: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.selectorRow}>
        {options.map(opt => (
          <TouchableOpacity 
            key={opt} 
            style={[styles.selectorBtn, value === opt && styles.activeSelector]} 
            onPress={() => setter(opt)}
          >
            <Text style={[styles.selectorText, value === opt && styles.activeSelectorText]}>
              {opt.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const formatAmount = (amount: number) => {
    return `₹${amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Show distribution preview if amount is entered
  const showDistributionPreview = () => {
    const amount = parseFloat(donationAmount);
    if (!donationAmount || isNaN(amount) || amount <= 0) return null;
    
    const distributed = distributeAmountToNeeds(amount);
    
    return (
      <View style={styles.distributionPreview}>
        <Text style={styles.previewTitle}>Amount Distribution:</Text>
        {distributed.map((item: { needId: any; allocatedAmount: number; }, index: React.Key | null | undefined) => {
          const need = selectedNeeds?.find((n: { id: any; }) => n.id === item.needId);
          return (
            <View key={index} style={styles.previewRow}>
              <Text style={styles.previewNeed}>{need?.category || `Need ${item.needId}`}</Text>
              <Text style={styles.previewAmount}>{formatAmount(item.allocatedAmount)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_GREEN} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Donation Summary</Text>
      </View>

      <View style={styles.whiteContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
          
          <View style={styles.summaryCard}>
            <Text style={styles.label}>RECIPIENT</Text>
            <Text style={styles.doneeName}>{donee?.fullName || 'Ahmed Khan Shaikh'}</Text>
            <Text style={styles.locationText}>📍 {donee?.address?.city || 'Bhopal'}</Text>
          </View>

          <Text style={styles.sectionTitle}>Selected Needs</Text>
          {selectedNeeds && selectedNeeds.length > 0 ? (
            selectedNeeds.map((need: any) => (
              <View key={need.id} style={styles.breakdownRow}>
                <Text style={styles.needCategory}>{need.category}</Text>
                <Text style={styles.needAmount}>{formatAmount(need.estimatedAmount)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noNeedsText}>No specific needs selected</Text>
          )}

          <View style={styles.suggestedNote}>
            <Text style={styles.suggestedNoteText}>
              💡 Suggested Amount: {formatAmount(suggestedAmount)}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Donation Details</Text>
          
          {renderSelector("Donation Type", donationType, ['CASH', 'KIND'], setDonationType)}
          
          {renderSelector("Fulfillment Method", fulfillmentType, ['DIRECT_TRANSFER', 'PICKUP'], setFulfillmentType)}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput 
              style={styles.messageInput} 
              multiline 
              value={donorMessage} 
              onChangeText={setDonorMessage} 
              placeholder="Add a message to the recipient (optional)"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Hide my identity (Anonymous)</Text>
            <Switch 
              value={isAnonymous} 
              onValueChange={setIsAnonymous} 
              trackColor={{ false: "#cbd5e1", true: PRIMARY_GREEN }}
            />
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Donation Amount *</Text>
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={donationAmount}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  let formatted = cleaned;
                  if (parts.length > 2) {
                    formatted = parts[0] + '.' + parts.slice(1).join('');
                  }
                  setDonationAmount(formatted);
                }}
                keyboardType="decimal-pad"
                placeholder="Enter amount you want to donate"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Show distribution preview */}
          {showDistributionPreview()}

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>
              {donationAmount ? formatAmount(parseFloat(donationAmount)) : '₹0'}
            </Text>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmDonation} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmText}>Confirm & Initiate Donation</Text>}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PRIMARY_GREEN },
  header: { height: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25 },
  backBtn: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginLeft: 15 },
  whiteContainer: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  summaryCard: { backgroundColor: LIGHT_GREEN, padding: 20, borderRadius: 22, borderWidth: 1, borderColor: '#dcfce7', marginBottom: 25 },
  label: { fontSize: 10, fontWeight: '800', color: PRIMARY_GREEN, letterSpacing: 1 },
  doneeName: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginTop: 4 },
  locationText: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 15 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  needCategory: { fontSize: 14, fontWeight: '700', color: '#475569' },
  needAmount: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  noNeedsText: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic', marginBottom: 10 },
  suggestedNote: {
    backgroundColor: '#FEF9E3',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 5,
  },
  suggestedNoteText: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: { height: 1.5, backgroundColor: '#F1F5F9', marginVertical: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 10, textTransform: 'uppercase' },
  selectorRow: { flexDirection: 'row', gap: 10 },
  selectorBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  activeSelector: { backgroundColor: PRIMARY_GREEN, borderColor: PRIMARY_GREEN },
  selectorText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  activeSelectorText: { color: '#FFF' },
  messageInput: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, color: '#1E293B', fontWeight: '600', borderWidth: 1, borderColor: '#F1F5F9', minHeight: 60, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: '#475569' },
  amountContainer: { marginBottom: 25 },
  amountLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#64748B', 
    marginBottom: 10, 
    textTransform: 'uppercase' 
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: PRIMARY_GREEN,
    paddingVertical: 0,
  },
  distributionPreview: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewNeed: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  previewAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY_GREEN,
  },
  totalBox: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 4, borderTopColor: PRIMARY_GREEN, marginTop: 10 },
  totalLabel: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  totalValue: { fontSize: 22, fontWeight: '900', color: PRIMARY_GREEN },
  confirmBtn: { backgroundColor: PRIMARY_GREEN, height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 30, elevation: 5 },
  confirmText: { color: '#FFF', fontWeight: '900', fontSize: 16 }
});