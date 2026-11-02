export interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  SESSION_SECRET: string;
  REVIEW_LOGIN_EMAIL?: string;
  REVIEW_LOGIN_PASSWORD?: string;
  ALLOWED_ORIGINS?: string;
}
