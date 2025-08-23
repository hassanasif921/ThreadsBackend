# Authentication API Documentation

This document provides comprehensive guidance on implementing authentication in the Threads application using Firebase Authentication for mobile apps and our custom authentication endpoints for web applications.

## Authentication Flow Overview

The Threads application supports multiple authentication methods:

1. **Email/Password Authentication** - Traditional authentication with email verification
2. **Google Authentication** - Sign in with Google account
3. **Apple Authentication** - Sign in with Apple ID

All authentication methods are implemented using Firebase Authentication for mobile applications, with our backend verifying Firebase ID tokens and issuing JWT tokens for API access.

## Backend API Endpoints

### Firebase Authentication (Mobile Apps)

#### Verify Firebase ID Token

Verifies a Firebase ID token and creates or updates a user in our database.

- **URL**: `/api/firebase-auth/verify-token`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "idToken": "firebase-id-token-from-mobile-app",
    "termsAccepted": true
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Authentication successful",
      "token": "jwt-token-for-api-access",
      "user": {
        "id": "user-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "1234567890",
        "emailVerified": true
      }
    }
    ```
- **Error Response**:
  - **Code**: 401
  - **Content**:
    ```json
    {
      "success": false,
      "message": "Authentication failed",
      "error": "Invalid token"
    }
    ```

#### Update User Profile

Updates user profile information after authentication.

- **URL**: `/api/firebase-auth/profile/:userId`
- **Method**: `PUT`
- **Auth Required**: Yes (JWT token)
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "1234567890"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Profile updated successfully",
      "user": {
        "id": "user-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "1234567890",
        "emailVerified": true
      }
    }
    ```

### Email/Password Authentication (Web)

#### Register

Registers a new user with email and password.

- **URL**: `/api/users/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "1234567890",
    "email": "john.doe@example.com",
    "password": "securepassword",
    "termsAccepted": true
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "success": true,
      "message": "User registered",
      "userId": "user-id"
    }
    ```

#### Verify Email

Verifies a user's email address using OTP.

- **URL**: `/api/users/verify-email`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "userId": "user-id",
    "otp": "123456"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Email verified successfully"
    }
    ```

#### Resend OTP

Resends the OTP verification code to the user's email address.

- **URL**: `/api/users/resend-otp`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "userId": "user-id"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "OTP sent successfully"
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "message": "User not found or already verified"
    }
    ```

#### Accept Terms and Conditions

Marks terms and conditions as accepted for a user.

- **URL**: `/api/users/accept-terms`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "userId": "user-id"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Terms and conditions accepted successfully",
      "termsAccepted": true,
      "termsAcceptedAt": "2025-08-24T03:12:58.000Z"
    }
    ```
  or (if already accepted)
  ```json
  {
    "success": true,
    "message": "Terms and conditions were already accepted",
    "termsAccepted": true,
    "termsAcceptedAt": "2025-08-23T14:30:45.000Z"
  }
  ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "message": "User not found"
    }
    ```

#### Forgot Password

Initiates password reset by sending OTP to user's email.

- **URL**: `/api/users/forgot-password`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Password reset code sent to your email",
      "userId": "user-id"
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "message": "User with this email does not exist"
    }
    ```

#### Verify Reset OTP

Verifies OTP for password reset and issues a reset token.

- **URL**: `/api/users/verify-reset-otp`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "userId": "user-id",
    "otp": "123456"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "OTP verified successfully",
      "resetToken": "jwt-reset-token"
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "message": "Invalid verification code"
    }
    ```
  or
  ```json
  {
    "success": false,
    "message": "Verification code has expired"
  }
  ```

#### Reset Password

Resets user password using the reset token.

- **URL**: `/api/users/reset-password`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "resetToken": "jwt-reset-token",
    "newPassword": "new-secure-password"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "message": "Password reset successfully"
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "success": false,
      "message": "Invalid or expired reset token"
    }
    ```
  or
  ```json
  {
    "success": false,
    "message": "Reset token and new password are required"
  }
  ```

#### Login

Authenticates a user with email and password.

- **URL**: `/api/users/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "securepassword",
    "termsAccepted": true
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "success": true,
      "token": "jwt-token",
      "user": {
        "id": "user-id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      }
    }
    ```

## Mobile App Implementation

### Setup Firebase in Your Mobile App

#### iOS (Swift)

1. **Add Firebase SDK**:
   ```swift
   // In your Podfile
   pod 'Firebase/Auth'
   pod 'GoogleSignIn'
   ```

2. **Initialize Firebase**:
   ```swift
   // In AppDelegate.swift
   import Firebase
   
   @UIApplicationMain
   class AppDelegate: UIResponder, UIApplicationDelegate {
     func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
       FirebaseApp.configure()
       return true
     }
   }
   ```

#### Android (Kotlin)

1. **Add Firebase SDK**:
   ```gradle
   // In app/build.gradle
   implementation 'com.google.firebase:firebase-auth:22.1.2'
   implementation 'com.google.android.gms:play-services-auth:20.6.0'
   ```

2. **Initialize Firebase**:
   ```kotlin
   // In Application class
   class MyApplication : Application() {
       override fun onCreate() {
           super.onCreate()
           FirebaseApp.initializeApp(this)
       }
   }
   ```

### Authentication Methods

#### Email/Password Authentication

```swift
// iOS (Swift)
func signUpWithEmail(email: String, password: String) {
    Auth.auth().createUser(withEmail: email, password: password) { authResult, error in
        if let error = error {
            print("Error creating user: \(error.localizedDescription)")
            return
        }
        
        // Get Firebase ID token
        authResult?.user.getIDToken { idToken, error in
            if let idToken = idToken {
                // Send to your backend
                sendTokenToBackend(idToken)
            }
        }
    }
}

func signInWithEmail(email: String, password: String) {
    Auth.auth().signIn(withEmail: email, password: password) { authResult, error in
        if let error = error {
            print("Error signing in: \(error.localizedDescription)")
            return
        }
        
        // Get Firebase ID token
        authResult?.user.getIDToken { idToken, error in
            if let idToken = idToken {
                // Send to your backend
                sendTokenToBackend(idToken)
            }
        }
    }
}
```

```kotlin
// Android (Kotlin)
private fun createAccount(email: String, password: String) {
    auth.createUserWithEmailAndPassword(email, password)
        .addOnCompleteListener(this) { task ->
            if (task.isSuccessful) {
                // Get Firebase ID token
                auth.currentUser?.getIdToken(true)?.addOnSuccessListener { result ->
                    val idToken = result.token
                    if (idToken != null) {
                        // Send to your backend
                        sendTokenToBackend(idToken)
                    }
                }
            } else {
                Log.w(TAG, "createUserWithEmail:failure", task.exception)
            }
        }
}

private fun signIn(email: String, password: String) {
    auth.signInWithEmailAndPassword(email, password)
        .addOnCompleteListener(this) { task ->
            if (task.isSuccessful) {
                // Get Firebase ID token
                auth.currentUser?.getIdToken(true)?.addOnSuccessListener { result ->
                    val idToken = result.token
                    if (idToken != null) {
                        // Send to your backend
                        sendTokenToBackend(idToken)
                    }
                }
            } else {
                Log.w(TAG, "signInWithEmail:failure", task.exception)
            }
        }
}
```

#### Google Authentication

```swift
// iOS (Swift)
func signInWithGoogle() {
    guard let clientID = FirebaseApp.app()?.options.clientID else { return }
    let config = GIDConfiguration(clientID: clientID)
    
    GIDSignIn.sharedInstance.signIn(with: config, presenting: self) { user, error in
        if let error = error {
            print("Error: \(error.localizedDescription)")
            return
        }
        
        guard let authentication = user?.authentication,
              let idToken = authentication.idToken else { return }
        
        let credential = GoogleAuthProvider.credential(withIDToken: idToken,
                                                       accessToken: authentication.accessToken)
        
        // Sign in with Firebase
        Auth.auth().signIn(with: credential) { authResult, error in
            if let error = error {
                print("Firebase sign-in error: \(error.localizedDescription)")
                return
            }
            
            // Get Firebase ID token
            authResult?.user.getIDToken { idToken, error in
                if let idToken = idToken {
                    // Send to your backend
                    sendTokenToBackend(idToken)
                }
            }
        }
    }
}
```

```kotlin
// Android (Kotlin)
private fun signInWithGoogle() {
    val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
        .requestIdToken(getString(R.string.default_web_client_id))
        .requestEmail()
        .build()
        
    val googleSignInClient = GoogleSignIn.getClient(this, gso)
    val signInIntent = googleSignInClient.signInIntent
    startActivityForResult(signInIntent, RC_SIGN_IN)
}

override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    
    if (requestCode == RC_SIGN_IN) {
        val task = GoogleSignIn.getSignedInAccountFromIntent(data)
        try {
            val account = task.getResult(ApiException::class.java)!!
            firebaseAuthWithGoogle(account.idToken!!)
        } catch (e: ApiException) {
            Log.w(TAG, "Google sign in failed", e)
        }
    }
}

private fun firebaseAuthWithGoogle(idToken: String) {
    val credential = GoogleAuthProvider.getCredential(idToken, null)
    auth.signInWithCredential(credential)
        .addOnCompleteListener(this) { task ->
            if (task.isSuccessful) {
                // Get Firebase ID token
                auth.currentUser?.getIdToken(true)?.addOnSuccessListener { result ->
                    val firebaseIdToken = result.token
                    if (firebaseIdToken != null) {
                        // Send to your backend
                        sendTokenToBackend(firebaseIdToken)
                    }
                }
            } else {
                Log.w(TAG, "signInWithCredential:failure", task.exception)
            }
        }
}
```

#### Apple Authentication

```swift
// iOS (Swift)
func startSignInWithAppleFlow() {
    let nonce = randomNonceString()
    currentNonce = nonce
    let appleIDProvider = ASAuthorizationAppleIDProvider()
    let request = appleIDProvider.createRequest()
    request.requestedScopes = [.fullName, .email]
    request.nonce = sha256(nonce)
    
    let authorizationController = ASAuthorizationController(authorizationRequests: [request])
    authorizationController.delegate = self
    authorizationController.presentationContextProvider = self
    authorizationController.performRequests()
}

func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
    if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
        guard let nonce = currentNonce else {
            fatalError("Invalid state: A login callback was received, but no login request was sent.")
        }
        guard let appleIDToken = appleIDCredential.identityToken else {
            print("Unable to fetch identity token")
            return
        }
        guard let idTokenString = String(data: appleIDToken, encoding: .utf8) else {
            print("Unable to serialize token string from data: \(appleIDToken.debugDescription)")
            return
        }
        
        // Initialize a Firebase credential.
        let credential = OAuthProvider.credential(withProviderID: "apple.com",
                                                 idToken: idTokenString,
                                                 rawNonce: nonce)
        
        // Sign in with Firebase.
        Auth.auth().signIn(with: credential) { (authResult, error) in
            if let error = error {
                print("Error signing in: \(error.localizedDescription)")
                return
            }
            
            // Get Firebase ID token
            authResult?.user.getIDToken { idToken, error in
                if let idToken = idToken {
                    // Send to your backend
                    sendTokenToBackend(idToken)
                }
            }
        }
    }
}
```

### Sending Token to Backend

```swift
// iOS (Swift)
func sendTokenToBackend(_ idToken: String) {
    guard let url = URL(string: "https://your-api.com/api/firebase-auth/verify-token") else { return }
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body: [String: Any] = ["idToken": idToken]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    URLSession.shared.dataTask(with: request) { data, response, error in
        guard let data = data, error == nil else {
            print("Network error: \(error?.localizedDescription ?? "Unknown error")")
            return
        }
        
        do {
            // Parse response
            let responseJSON = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            
            // Store token and user info
            if let token = responseJSON?["token"] as? String {
                // Save token for future API calls
                UserDefaults.standard.set(token, forKey: "authToken")
                
                // Navigate to main screen
                DispatchQueue.main.async {
                    // Update UI or navigate
                }
            }
        } catch {
            print("JSON parsing error: \(error.localizedDescription)")
        }
    }.resume()
}
```

```kotlin
// Android (Kotlin)
private fun sendTokenToBackend(idToken: String) {
    val client = OkHttpClient()
    val json = JSONObject().apply {
        put("idToken", idToken)
    }
    
    val requestBody = json.toString().toRequestBody("application/json".toMediaType())
    val request = Request.Builder()
        .url("https://your-api.com/api/firebase-auth/verify-token")
        .post(requestBody)
        .build()
        
    client.newCall(request).enqueue(object : Callback {
        override fun onFailure(call: Call, e: IOException) {
            Log.e(TAG, "Failed to send token to backend", e)
        }
        
        override fun onResponse(call: Call, response: Response) {
            val responseBody = response.body?.string()
            if (response.isSuccessful && responseBody != null) {
                val jsonResponse = JSONObject(responseBody)
                val token = jsonResponse.getString("token")
                
                // Save token for future API calls
                getSharedPreferences("auth_prefs", Context.MODE_PRIVATE).edit()
                    .putString("auth_token", token)
                    .apply()
                    
                // Update UI on main thread
                runOnUiThread {
                    // Navigate to main screen
                    startActivity(Intent(this@AuthActivity, MainActivity::class.java))
                    finish()
                }
            }
        }
    })
}
```

## Security Considerations

1. **Token Validation**: Always validate Firebase ID tokens on the server-side before issuing your own JWT tokens.

2. **HTTPS**: Always use HTTPS for all API endpoints to prevent token interception.

3. **Token Expiration**: Set appropriate expiration times for JWT tokens.

4. **Secure Storage**: Store tokens securely on mobile devices using secure storage mechanisms.

5. **Refresh Tokens**: Implement token refresh mechanisms to maintain user sessions.

## Environment Setup

### Firebase Configuration

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select an existing one

2. **Add Authentication Methods**:
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable Email/Password, Google, and Apple providers

3. **Get Service Account Credentials**:
   - In Firebase Console, go to Project Settings > Service accounts
   - Click "Generate new private key" to download the JSON file
   - Place this file in your project or use its contents in your environment variables

### Backend Environment Variables

Add the following to your `.env` file:

```
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
# OR
FIREBASE_SERVICE_ACCOUNT='{...}' # The entire JSON content as a string

# JWT Secret
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_verified_sender_email
```

## Conclusion

This authentication system provides a unified approach for both web and mobile applications. By leveraging Firebase Authentication for mobile apps and our custom authentication for web apps, we ensure a secure and seamless authentication experience across all platforms.

For any questions or issues, please contact the development team.
