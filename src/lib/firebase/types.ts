// Firebase Auth Types (compatible with Firebase SDK)

export interface FirebaseAuthResponse {
  kind: string;
  localId: string;
  email: string;
  displayName?: string;
  idToken: string;
  registered?: boolean;
  refreshToken: string;
  expiresIn: string;
}

export interface FirebaseAuthError {
  error: {
    code: number;
    message: string;
    errors?: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
}

export interface TokenRefreshResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
}

// App User domain model — mirrors Kotlin AppUser (domain/model/AppUser.kt)
// Tokens are NOT part of the domain model, they are stored separately.
export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
}

// Auth session — tokens stored in tauri-plugin-store (like DesktopAuthRepository prefs)
export interface AuthSession {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  localId: string;
  email: string;
}
