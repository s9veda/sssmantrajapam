import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Modal } from './Modal';
import { Ionicons } from '@expo/vector-icons';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  minDate?: string;
  maxDate?: string;
  style?: ViewStyle;
}

export function DateInput({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  error,
  minDate,
  maxDate,
  style,
}: DateInputProps) {
  const [showModal, setShowModal] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(value ? new Date(value) : new Date());
  const [year, setYear] = useState(pickerDate.getFullYear());
  const [month, setMonth] = useState(pickerDate.getMonth());
  const [day, setDay] = useState(pickerDate.getDate());

  const minDateObj = minDate ? new Date(minDate) : new Date(2000, 0, 1);
  const maxDateObj = maxDate ? new Date(maxDate) : new Date();

  const updatePickerDate = () => {
    const newDate = new Date(year, month, day);
    // Clamp to min/max
    if (newDate < minDateObj) {
      setYear(minDateObj.getFullYear());
      setMonth(minDateObj.getMonth());
      setDay(minDateObj.getDate());
    } else if (newDate > maxDateObj) {
      setYear(maxDateObj.getFullYear());
      setMonth(maxDateObj.getMonth());
      setDay(maxDateObj.getDate());
    } else {
      setPickerDate(newDate);
    }
  };

  const handleConfirm = () => {
    const formatted = formatDate(pickerDate);
    onChange(formatted);
    setShowModal(false);
  };

  const displayValue = value || placeholder;

  const openPicker = () => {
    if (value) {
      const d = new Date(value);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setDay(d.getDate());
    } else {
      const now = new Date();
      setYear(now.getFullYear());
      setMonth(now.getMonth());
      setDay(now.getDate());
    }
    updatePickerDate();
    setShowModal(true);
  };

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const maxDay = daysInMonth(year, month);

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.selectButton, error && styles.selectError]}
        onPress={openPicker}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.selectText,
          value ? styles.selectTextSelected : styles.selectTextPlaceholder
        ]}>
          {displayValue}
        </Text>
        <Ionicons name="calendar" size={20} color="#6B7280" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={label}
        actionButton={{ title: 'Done', onPress: handleConfirm, variant: 'primary' }}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Year</Text>
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => { setYear(y => Math.max(y - 1, minDateObj.getFullYear())); updatePickerDate(); }}
                  disabled={year <= minDateObj.getFullYear()}
                >
                  <Ionicons name="chevron-up" size={24} color="#FF6200" />
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{year}</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => { setYear(y => y + 1); updatePickerDate(); }}
                  disabled={year >= maxDateObj.getFullYear()}
                >
                  <Ionicons name="chevron-down" size={24} color="#FF6200" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Month</Text>
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => { setMonth(m => (m - 1 + 12) % 12); updatePickerDate(); }}
                >
                  <Ionicons name="chevron-up" size={24} color="#FF6200" />
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{monthNames[month]}</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => { setMonth(m => (m + 1) % 12); updatePickerDate(); }}
                >
                  <Ionicons name="chevron-down" size={24} color="#FF6200" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Day</Text>
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => { setDay(d => Math.max(d - 1, 1)); updatePickerDate(); }}
                  disabled={day <= 1}
                >
                  <Ionicons name="chevron-up" size={24} color="#FF6200" />
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{String(day).padStart(2, '0')}</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => { setDay(d => Math.min(d + 1, maxDay)); updatePickerDate(); }}
                  disabled={day >= maxDay}
                >
                  <Ionicons name="chevron-down" size={24} color="#FF6200" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#0B1220',
    fontFamily: 'Inter_400Regular',
  },
  labelError: {
    color: '#EF4444',
  },
  required: {
    color: '#EF4444',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    backgroundColor: '#FBFEFF',
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 0,
    elevation: 0,
  },
  selectError: {
    borderColor: '#EF4444',
  },
  selectText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  selectTextSelected: {
    color: '#0B1220',
  },
  selectTextPlaceholder: {
    color: '#6B7280',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  pickerContainer: {
    padding: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  pickerButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  pickerButton: {
    padding: 8,
    minWidth: 48,
    alignItems: 'center',
  },
  pickerValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1220',
    fontFamily: 'Inter_700Bold',
    minWidth: 60,
    textAlign: 'center',
  },
});