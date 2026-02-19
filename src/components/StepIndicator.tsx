import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StepIndicator({ step }: { step: number }) {
  const steps = ["Auth", "Profile", "Finish"];
  return (
    <View style={styles.container}>
      {/* Background Track */}
      <View style={styles.lineTrack}>
        <View style={[styles.lineFill, { width: `${(step - 1) * 50}%` }]} />
      </View>

      <View style={styles.nodesRow}>
        {steps.map((label, i) => {
          const s = i + 1;
          const active = step === s;
          const done = step > s;
          return (
            <View key={i} style={styles.nodeWrapper}>
              <View 
                style={[
                  styles.dot, 
                  active && styles.activeDot, 
                  done && styles.doneDot
                ]}
              >
                {done ? (
                  <Text style={styles.check}>✓</Text>
                ) : (
                  <Text style={[styles.num, active && styles.activeNum]}>{s}</Text>
                )}
              </View>
              <Text style={[styles.label, active && styles.activeLabel, done && styles.doneLabel]}>
                {label.toUpperCase()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginBottom: 30, 
    width: '100%', 
    paddingHorizontal: 15,
    marginTop: 10
  },
  lineTrack: { 
    height: 4, 
    backgroundColor: '#E2E8F0', // Soft grey track
    position: 'absolute', 
    top: 18, 
    left: 45, 
    right: 45, 
    borderRadius: 2 
  },
  lineFill: { 
    height: '100%', 
    backgroundColor: '#16476A', // Dark Blue Fill
    borderRadius: 2 
  },
  nodesRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  nodeWrapper: { 
    alignItems: 'center', 
    width: 70 
  },
  dot: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#FFF', 
    borderWidth: 2, 
    borderColor: '#CBD5E1', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activeDot: { 
    borderColor: '#16476A', 
    borderWidth: 3,
    backgroundColor: '#FFF'
  },
  doneDot: { 
    backgroundColor: '#16476A', 
    borderColor: '#16476A' 
  },
  num: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#94A3B8' 
  },
  activeNum: { 
    color: '#16476A' 
  },
  check: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  label: { 
    marginTop: 10, 
    fontSize: 9, 
    fontWeight: '900', 
    color: '#94A3B8', 
    letterSpacing: 0.5 
  },
  activeLabel: { 
    color: '#16476A' 
  },
  doneLabel: {
    color: '#64748B' // Slightly darker grey for completed labels
  }
});