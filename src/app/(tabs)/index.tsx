import React, { useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DateInput } from '@/components/DateInput';
import { FormInput } from '@/components/FormInput';
import { Modal } from '@/components/Modal';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/i18n';

const todayString = () => new Date().toISOString().split('T')[0];

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { aggregateData, loading, error, refreshData, submitJapam } = useApp();
  const { user } = useAuth();
  const [showSubmit, setShowSubmit] = useState(false);
  const [date, setDate] = useState(todayString());
  const [count, setCount] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openSubmit = () => {
    setDate(todayString());
    setSubmitError('');
    setShowSubmit(true);
  };

  const handleSubmit = async () => {
    const parsed = Number(count);
    if (!date || !count || !Number.isInteger(parsed) || parsed < 0) {
      setSubmitError(t('submit.required'));
      return;
    }
    if (date > todayString()) {
      setSubmitError(t('submit.dateFuture'));
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    const result = await submitJapam(date, parsed);
    setSubmitting(false);
    if (result.success) {
      setCount('');
      setShowSubmit(false);
    } else {
      setSubmitError(result.error || t('submit.required'));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshData} colors={['#FF6200']} />}
        contentContainerStyle={styles.content}
      >
        <LinearGradient colors={['#F6F8FB', '#F0F6FF']} style={styles.gradient}>
          <Card style={styles.photoCard} padding={0}>
            <Image source={require('../../../assets/bg.jpg')} style={styles.photo} resizeMode="cover" />
          </Card>

          <Card variant="dashboard" style={styles.totalCard}>
            <Text style={styles.totalLabel}>{t('dashboard.totalCount')}</Text>
            <Text style={styles.totalValue}>{(aggregateData?.total ?? 0).toLocaleString()}</Text>
          </Card>

          {user ? (
            <View style={styles.userRow}>
              <Ionicons name="person-circle-outline" size={22} color="#FF6200" />
              <Text style={styles.userText}>{t('submit.submittingAs')} {user.name}</Text>
            </View>
          ) : (
            <Text style={styles.hint}>{t('submit.hintAnonymous')}</Text>
          )}

          <Button variant="primary" size="lg" onPress={openSubmit} style={styles.submitButton}>
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            {t('dashboard.submitJapam')}
          </Button>

          {error && !loading ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{t('errors.loadFailed')}</Text>
              <Button variant="outline" size="sm" onPress={refreshData}>{t('errors.retry')}</Button>
            </View>
          ) : null}
        </LinearGradient>
      </ScrollView>

      <Modal
        visible={showSubmit}
        onClose={() => setShowSubmit(false)}
        title={t('submit.title')}
        actionButton={{ title: t('submit.button'), onPress: handleSubmit, loading: submitting }}
        message={submitError}
        messageType="error"
      >
        <DateInput label={t('submit.dateLabel')} value={date} onChange={setDate} required maxDate={todayString()} />
        <FormInput
          label={t('submit.countLabel')}
          value={count}
          onChangeText={setCount}
          placeholder={t('submit.countPlaceholder')}
          keyboardType="numeric"
          required
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F8FB' },
  content: { flexGrow: 1 },
  gradient: { flex: 1, padding: 16, gap: 16, width: '100%', maxWidth: 720, alignSelf: 'center' },
  photoCard: { overflow: 'hidden' },
  photo: { width: '100%', height: 200 },
  totalCard: { alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_600SemiBold' },
  totalValue: { fontSize: 44, color: '#FF6200', fontFamily: 'Inter_800ExtraBold' },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  userText: { fontSize: 14, color: '#374151' },
  hint: { textAlign: 'center', fontSize: 13, color: '#6B7280' },
  submitButton: { alignSelf: 'stretch' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 10, backgroundColor: '#FEF2F2' },
  errorText: { color: '#EF4444', fontSize: 14, flexShrink: 1 },
});
