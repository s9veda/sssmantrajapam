import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { useAuth } from '@/context/AuthContext';
import { useTranslation, type Locale } from '@/i18n';

interface ProfileDrawerProps {
  onClose: () => void;
}

type Mode = 'signin' | 'signup' | 'review';

// Rendered only while open; it animates in on mount and calls onClose once the close animation ends.
export function ProfileDrawer({ onClose }: ProfileDrawerProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const drawerWidth = Math.min(380, width * 0.9);
  const [slide] = useState(() => new Animated.Value(0));
  const useNative = Platform.OS !== 'web';

  useEffect(() => {
    Animated.timing(slide, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }).start();
  }, [slide, useNative]);

  const close = () => {
    Animated.timing(slide, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: useNative }).start(onClose);
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: slide }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [drawerWidth, 0] }) }],
            },
          ]}
        >
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <DrawerContent onClose={close} />
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  const { t, locale, setLocale, locales, localeNames } = useTranslation();
  const { user, logout, reviewLoginEnabled } = useAuth();

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('profile.close')}>
          <Ionicons name="close" size={26} color="#374151" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {user ? (
          <View style={styles.userBlock}>
            <Ionicons name="person-circle" size={56} color="#FF6200" />
            <Text style={styles.signedInAs}>{t('profile.signedInAs')}</Text>
            <Text style={styles.userName}>{user.name}</Text>
            {user.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
            <Button variant="outline" size="md" onPress={() => void logout()} style={styles.fullWidth}>
              {t('profile.signOut')}
            </Button>
          </View>
        ) : (
          <SignInPanel reviewLoginEnabled={reviewLoginEnabled} onDone={onClose} />
        )}

        <Text style={styles.sectionLabel}>{t('profile.language')}</Text>
        <View style={styles.chips}>
          {locales.map((code: Locale) => (
            <Pressable
              key={code}
              onPress={() => setLocale(code)}
              style={[styles.chip, code === locale && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: code === locale }}
            >
              <Text style={[styles.chipText, code === locale && styles.chipTextActive]}>{localeNames[code]}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

function SignInPanel({ reviewLoginEnabled, onDone }: { reviewLoginEnabled: boolean; onDone: () => void }) {
  const { t } = useTranslation();
  const { sendOTP, verifyOTP, reviewLogin } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setStep('contact');
    setCode('');
    setError('');
    setInfo('');
  }

  async function run(action: () => Promise<{ success: true } | { success: false; error: string }>, onSuccess?: () => void) {
    setBusy(true);
    setError('');
    setInfo('');
    const result = await action();
    setBusy(false);
    if (result.success) onSuccess?.();
    else setError(result.error);
  }

  function requestCode() {
    if (!email.includes('@')) return setError(t('profile.emailRequired'));
    if (mode === 'signup' && !name.trim()) return setError(t('profile.nameRequired'));
    void run(
      () => sendOTP(email, mode === 'signup' ? 'signup' : 'signin', mode === 'signup' ? name.trim() : undefined),
      () => {
        setStep('otp');
        setInfo(t('profile.codeSent'));
      },
    );
  }

  function confirmCode() {
    if (!/^\d{6}$/.test(code)) return setError(t('profile.codeRequired'));
    void run(() => verifyOTP(email, code, mode === 'signup' ? 'signup' : 'signin', mode === 'signup' ? name.trim() : undefined), onDone);
  }

  function submitReview() {
    if (!email.includes('@') || !password) return setError(t('profile.emailRequired'));
    void run(() => reviewLogin(email, password), onDone);
  }

  return (
    <View>
      <View style={styles.tabs}>
        {(['signin', 'signup'] as const).map((m) => (
          <Pressable key={m} onPress={() => switchMode(m)} style={[styles.tab, mode === m && styles.tabActive]} accessibilityRole="tab">
            <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
              {m === 'signin' ? t('profile.signIn') : t('profile.signUp')}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'review' ? (
        <>
          <Text style={styles.hint}>{t('profile.reviewHint')}</Text>
          <FormInput label={t('profile.reviewEmail')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <FormInput label={t('profile.reviewPassword')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="password" onSubmitEditing={submitReview} />
          <Button size="md" loading={busy} onPress={submitReview} style={styles.fullWidth}>{t('profile.signIn')}</Button>
        </>
      ) : step === 'contact' ? (
        <>
          {mode === 'signup' && (
            <FormInput label={t('auth.signup.nameLabel')} value={name} onChangeText={setName} placeholder={t('auth.signup.namePlaceholder')} autoComplete="name" />
          )}
          <FormInput label={t('auth.signin.contactLabel')} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" onSubmitEditing={requestCode} />
          <Button size="md" loading={busy} onPress={requestCode} style={styles.fullWidth}>
            {mode === 'signup' ? t('auth.signup.contactTitle') : t('auth.signin.contactTitle')}
          </Button>
        </>
      ) : (
        <>
          <Text style={styles.hint}>{t('auth.otp.subtitle')} {email}</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            placeholder="••••••"
            accessibilityLabel={t('auth.otp.title')}
            autoFocus
            onSubmitEditing={confirmCode}
          />
          <Button size="md" loading={busy} onPress={confirmCode} style={styles.fullWidth}>{t('auth.otp.verifyButton')}</Button>
          <View style={styles.row}>
            <Button variant="outline" size="sm" onPress={() => { setStep('contact'); setCode(''); setError(''); setInfo(''); }}>{t('auth.otp.backButton')}</Button>
            <Button variant="secondary" size="sm" disabled={busy} onPress={requestCode}>{t('auth.otp.resendButton')}</Button>
          </View>
        </>
      )}

      {info ? <Text style={styles.info}>{info}</Text> : null}
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}

      {reviewLoginEnabled && mode !== 'review' && (
        <Pressable onPress={() => switchMode('review')} style={styles.reviewLink} accessibilityRole="button">
          <Ionicons name="shield-checkmark-outline" size={18} color="#1075B9" />
          <View style={styles.flex}>
            <Text style={styles.reviewTitle}>{t('profile.reviewAccess')}</Text>
            <Text style={styles.reviewHint}>{t('profile.reviewHint')}</Text>
          </View>
        </Pressable>
      )}
      {mode === 'review' && (
        <Pressable onPress={() => switchMode('signin')} style={styles.reviewLink} accessibilityRole="button">
          <Ionicons name="arrow-back" size={18} color="#1075B9" />
          <Text style={styles.reviewTitle}>{t('auth.otp.backButton')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: { backgroundColor: '#FFFFFF', height: '100%', paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E6EEF8' },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#111827' },
  body: { paddingVertical: 20 },
  userBlock: { alignItems: 'center', gap: 4, marginBottom: 24 },
  signedInAs: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  userName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#111827' },
  userEmail: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  fullWidth: { alignSelf: 'stretch' },
  tabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 14, color: '#6B7280', fontFamily: 'Inter_600SemiBold' },
  tabTextActive: { color: '#FF6200' },
  hint: { fontSize: 14, color: '#4B5563', marginBottom: 12 },
  codeInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingVertical: 12, fontSize: 24, letterSpacing: 8, textAlign: 'center', marginBottom: 16, color: '#111827' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  info: { marginTop: 12, fontSize: 13, color: '#10B981' },
  error: { marginTop: 12, fontSize: 13, color: '#EF4444' },
  reviewLink: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, padding: 12, borderRadius: 10, backgroundColor: '#F0F6FF' },
  reviewTitle: { fontSize: 14, color: '#1075B9', fontFamily: 'Inter_600SemiBold' },
  reviewHint: { fontSize: 12, color: '#6B7280' },
  sectionLabel: { marginTop: 28, marginBottom: 10, fontSize: 13, color: '#6B7280', fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: '#D1D5DB' },
  chipActive: { backgroundColor: '#FF6200', borderColor: '#FF6200' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: '#FFFFFF' },
});
