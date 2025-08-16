# Authentication API Documentation

This document provides detailed information about the authentication endpoints available in the Thread Backend API.

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication Flow](#authentication-flow)
- [JWT Authentication](#jwt-authentication)
- [Endpoints](#endpoints)
  - [Register User](#register-user)
  - [Verify Email](#verify-email)
  - [Login](#login)
  - [Get User Profile](#get-user-profile)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

## Overview

The Thread Backend API provides authentication services including user registration, email verification, and login. The API uses MongoDB for data storage and Twilio SendGrid for email verification.

## Base URL

```
http://localhost:3000/api
```

## Authentication Flow

1. **Registration**: User registers with personal details including email
2. **Email Verification**: User receives a verification code via email and submits it to verify their account
3. **Login**: User logs in with verified credentials and receives a JWT token
4. **Protected Routes**: User includes the JWT token in subsequent requests to access protected resources

## JWT Authentication

The API uses JSON Web Tokens (JWT) for authentication. After successful login, the server provides a token that must be included in the Authorization header for protected routes.

### Token Format

```
Authorization: Bearer <token>
```

### Token Expiration

Tokens are valid for 30 days by default. After expiration, users must log in again to obtain a new token.

### Protected Routes

Protected routes will return a 401 Unauthorized response if:
- No token is provided
- The token is invalid or expired

## Endpoints

### Register User

Creates a new user account and sends a verification code to the user's email.

- **URL**: `/users/register`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "email": "john.doe@example.com",
  "password": "securepassword"
}
```

**Success Response**:

- **Code**: 201 Created
- **Content**:

```json
{
  "success": true,
  "message": "User registered successfully. Verification code sent to your email.",
  "userId": "60d21b4667d0d8992e610c85"
}
```

**Error Responses**:

- **Code**: 400 Bad Request
- **Content**:

```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

OR

```json
{
  "success": false,
  "message": "Failed to send verification code",
  "error": "Error details"
}
```

- **Code**: 500 Internal Server Error
- **Content**:

```json
{
  "success": false,
  "message": "Server error during registration",
  "error": "Error details"
}
```

### Verify Email

Verifies a user's email address using the OTP code sent during registration.

> **Note**: For testing purposes, the code "0000" will always work as a valid verification code.

- **URL**: `/users/verify-email`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body**:

```json
{
  "userId": "60d21b4667d0d8992e610c85",
  "otp": "0000"
}
```

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Responses**:

- **Code**: 400 Bad Request
- **Content**:

```json
{
  "success": false,
  "message": "Invalid verification code"
}
```

- **Code**: 404 Not Found
- **Content**:

```json
{
  "success": false,
  "message": "User not found"
}
```

- **Code**: 500 Internal Server Error
- **Content**:

```json
{
  "success": false,
  "message": "Server error during verification",
  "error": "Error details"
}
```

### Login

Authenticates a user and provides access to the application.

- **URL**: `/users/login`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body**:

```json
{
  "email": "john.doe@example.com",
  "password": "securepassword"
}
```

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890"
  }
}
```

**Error Responses**:

- **Code**: 401 Unauthorized
- **Content**:

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

OR

```json
{
  "success": false,
  "message": "Email not verified",
  "userId": "60d21b4667d0d8992e610c85"
}
```

- **Code**: 500 Internal Server Error
- **Content**:

```json
{
  "success": false,
  "message": "Server error during login",
  "error": "Error details"
}
```

### Get User Profile

Retrieves a user's profile information. This is a protected route that requires authentication.

- **URL**: `/users/profile/:id`
- **Method**: `GET`
- **URL Parameters**: `id=[MongoDB ObjectId]`
- **Headers**: 
  - `Authorization: Bearer <token>`

**Success Response**:

- **Code**: 200 OK
- **Content**:

```json
{
  "success": true,
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "emailVerified": true,
    "createdAt": "2023-08-16T14:30:00.000Z",
    "updatedAt": "2023-08-16T14:35:00.000Z"
  }
}
```

**Error Responses**:

- **Code**: 404 Not Found
- **Content**:

```json
{
  "success": false,
  "message": "User not found"
}
```

- **Code**: 500 Internal Server Error
- **Content**:

```json
{
  "success": false,
  "message": "Server error",
  "error": "Error details"
}
```

## Data Models

### User

```javascript
{
  firstName: String,       // Required
  lastName: String,        // Required
  phoneNumber: String,     // Required, Unique
  email: String,           // Required, Unique
  password: String,        // Required, Hashed
  emailVerified: Boolean,  // Default: false
  otp: String,             // For email verification
  otpExpiry: Date,         // OTP expiration time
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

All endpoints return JSON responses with a `success` boolean flag indicating whether the request was successful. In case of errors, additional information is provided in the `message` field, and sometimes in the `error` field for more detailed error information.

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
