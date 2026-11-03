import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTranslation, type Locale } from '@/i18n';
import { colors } from '@/lib/theme';

interface ProfileDrawerProps {
  onClose: () => void;
}

type Panel = 'signin' | 'signup' | 'review';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Rendered only while open; it slides in on mount and calls onClose once the close animation ends.
export function ProfileDrawer({ onClose }: ProfileDrawerProps) {
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(390, width * 0.9);
  const [translateX] = useState(() => new Animated.Value(drawerWidth));
  const useNative = Platform.OS !== 'web';

  useEffect(() => {
    Animated.timing(translateX, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: useNative }).start();
  }, [translateX, useNative]);

  const close = () => {
    Animated.timing(translateX, { toValue: drawerWidth, duration: 190, useNativeDriver: useNative }).start(() => onClose());
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={close} presentationStyle="overFullScreen" statusBarTranslucent>
      <SafeAreaProvider style={styles.flex}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={StyleSheet.absoluteFill} />
          <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX }] }]}>
            <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
              <DrawerContent onClose={close} />
            </SafeAreaView>
          </Animated.View>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  const { t, locale, setLocale, locales, localeNames } = useTranslation();
  const { user, logout, reviewLoginEnabled } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    onClose();
  }

  return (
    <>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>{t('profile.yourProfile')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('profile.close')} onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.white} />
        </Pressable>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {user ? (
            <>
              <View style={styles.identityCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(user.name || user.email || '?').trim().charAt(0).toLocaleUpperCase()}</Text>
                </View>
                <Text numberOfLines={1} style={styles.userName}>{user.name}</Text>
                {user.email ? <Text numberOfLines={2} style={styles.userEmail}>{user.email}</Text> : null}
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.forest} />
                  <Text style={styles.statusText}>{t('profile.signedInBadge')}</Text>
                </View>
              </View>
              <Pressable accessibilityRole="button" disabled={signingOut} onPress={() => void handleSignOut()} style={styles.signOutButton}>
                {signingOut ? <ActivityIndicator color={colors.error} /> : <Ionicons name="log-out-outline" size={18} color={colors.error} />}
                <Text style={styles.signOutLabel}>{t('profile.signOut')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.identityCard}>
                <View style={styles.signedOutIcon}>
                  <Ionicons name="person-circle-outline" size={28} color={colors.forest} />
                </View>
                <Text style={styles.signedOutTitle}>{t('profile.signedOutTitle')}</Text>
                <Text style={styles.signedOutBody}>{t('profile.signedOutBody')}</Text>
              </View>
              <SignInOptions reviewLoginEnabled={reviewLoginEnabled} onDone={onClose} />
            </>
          )}

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="language-outline" size={17} color={colors.forest} />
              <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
            </View>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function SignInOptions({ reviewLoginEnabled, onDone }: { reviewLoginEnabled: boolean; onDone: () => void }) {
  const { t } = useTranslation();
  const [active, setActive] = useState<Panel | null>(null);

  const options: { key: Panel; icon: IconName; title: string; hint: string }[] = [
    { key: 'signin', icon: 'log-in-outline', title: t('profile.signIn'), hint: t('profile.signInHint') },
    { key: 'signup', icon: 'person-add-outline', title: t('profile.signUp'), hint: t('profile.signUpHint') },
    ...(reviewLoginEnabled
      ? [{ key: 'review' as const, icon: 'shield-checkmark-outline' as IconName, title: t('profile.reviewAccess'), hint: t('profile.reviewHint') }]
      : []),
  ];

  return (
    <View>
      {options.map((option) =>
        active === option.key ? (
          <View key={option.key} style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{option.title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('profile.close')} hitSlop={10} onPress={() => setActive(null)}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <SignInForm panel={option.key} onDone={onDone} />
          </View>
        ) : (
          <Pressable key={option.key} accessibilityRole="button" onPress={() => setActive(option.key)} style={styles.optionButton}>
            <Ionicons name={option.icon} size={18} color={colors.forest} />
            <View style={styles.optionCopy}>
              <Text style={styles.optionLabel}>{option.title}</Text>
              <Text style={styles.optionHint}>{option.hint}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.muted} />
          </Pressable>
        ),
      )}
    </View>
  );
}

function SignInForm({ panel, onDone }: { panel: Panel; onDone: () => void }) {
  const { t } = useTranslation();
  const { sendOTP, verifyOTP, reviewLogin } = useAuth();
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const mode = panel === 'signup' ? 'signup' : 'signin';

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
      () => sendOTP(email, mode, mode === 'signup' ? name.trim() : undefined),
      () => {
        setStep('otp');
        setInfo(t('profile.codeSent'));
      },
    );
  }

  function confirmCode() {
    if (!/^\d{6}$/.test(code)) return setError(t('profile.codeRequired'));
    void run(() => verifyOTP(email, code, mode, mode === 'signup' ? name.trim() : undefined), onDone);
  }

  function submitReview() {
    if (!email.includes('@') || !password) return setError(t('profile.emailRequired'));
    void run(() => reviewLogin(email, password), onDone);
  }

  const primary = (label: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={[styles.primaryButton, busy && styles.disabled]}>
      {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryLabel}>{label}</Text>}
    </Pressable>
  );

  return (
    <View>
      {panel === 'review' ? (
        <>
          <Text style={styles.copy}>{t('profile.reviewHint')}</Text>
          <TextInput
            accessibilityLabel={t('profile.reviewEmail')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder={t('profile.reviewEmail')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
          <TextInput
            accessibilityLabel={t('profile.reviewPassword')}
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setPassword}
            onSubmitEditing={submitReview}
            placeholder={t('profile.reviewPassword')}
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {primary(t('profile.signIn'), submitReview)}
        </>
      ) : step === 'contact' ? (
        <>
          {mode === 'signup' && (
            <TextInput
              accessibilityLabel={t('auth.signup.nameLabel')}
              autoComplete="name"
              onChangeText={setName}
              placeholder={t('auth.signup.nameLabel')}
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={name}
            />
          )}
          <TextInput
            accessibilityLabel={t('auth.signin.contactLabel')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={requestCode}
            placeholder={t('auth.signin.contactLabel')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
          {primary(mode === 'signup' ? t('auth.signup.contactTitle') : t('auth.signin.contactTitle'), requestCode)}
        </>
      ) : (
        <>
          <Text style={styles.copy}>{`${t('auth.otp.subtitle')} ${email}`}</Text>
          <TextInput
            accessibilityLabel={t('auth.otp.title')}
            autoComplete="one-time-code"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setCode}
            onSubmitEditing={confirmCode}
            placeholder="000000"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.codeInput, code.length > 0 && styles.codeInputFilled]}
            textContentType="oneTimeCode"
            value={code}
          />
          {primary(t('auth.otp.verifyButton'), confirmCode)}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setStep('contact');
              setCode('');
              setError('');
              setInfo('');
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryLabel}>{t('profile.useDifferentEmail')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={requestCode} style={styles.secondaryButton}>
            <Text style={styles.secondaryLabel}>{t('auth.otp.resendButton')}</Text>
          </Pressable>
        </>
      )}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalRoot: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(16, 29, 23, 0.42)' },
  drawer: {
    height: '100%',
    maxWidth: 420,
    backgroundColor: colors.paper,
    shadowColor: '#000000',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 14,
  },
  drawerHeader: {
    minHeight: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  drawerTitle: { color: colors.ink, fontFamily: 'Georgia', fontSize: 22 },
  closeButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forestSoft },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 },
  identityCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 8, alignItems: 'center', padding: 20 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  avatarText: { color: colors.forest, fontFamily: 'Georgia', fontSize: 25 },
  userName: { color: colors.ink, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  userEmail: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 4 },
  statusBadge: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.sage, borderRadius: 14, paddingHorizontal: 11, marginTop: 12 },
  statusText: { color: colors.forest, fontSize: 11, fontWeight: '600' },
  signedOutIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  signedOutTitle: { color: colors.ink, fontFamily: 'Georgia', fontSize: 19 },
  signedOutBody: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  signOutButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.errorLine,
    borderRadius: 8,
    marginTop: 16,
  },
  signOutLabel: { color: colors.error, fontSize: 13, fontWeight: '600' },
  optionButton: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  optionCopy: { flex: 1 },
  optionLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  optionHint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  formCard: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 8, padding: 14, marginTop: 14 },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  formTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  input: {
    minHeight: 50,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    color: colors.ink,
    fontSize: 15,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  codeInput: { fontSize: 22, textAlign: 'center' },
  codeInputFilled: { letterSpacing: 8 },
  primaryButton: { minHeight: 48, backgroundColor: colors.forest, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryLabel: { color: colors.white, fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.7 },
  secondaryButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryLabel: { color: colors.forest, fontSize: 13, fontWeight: '600' },
  info: { color: colors.forest, fontSize: 12, textAlign: 'center', marginTop: 10 },
  error: { color: colors.error, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 15, marginTop: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.white },
});
