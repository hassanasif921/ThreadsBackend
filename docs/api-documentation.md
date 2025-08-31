# Stitch Dictionary API Documentation

This document provides comprehensive API documentation for the Stitch Dictionary App backend.

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [File Uploads](#file-uploads)
- [Stitch Management](#stitch-management)
- [Step Management](#step-management)
- [User Progress](#user-progress)
- [Taxonomy Management](#taxonomy-management)
- [Error Handling](#error-handling)
- [Data Models](#data-models)

## Overview

The Stitch Dictionary API provides endpoints for managing embroidery stitches, their step-by-step instructions, user progress tracking, and media uploads. The API supports over 200 stitches with comprehensive categorization and user interaction features.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Protected routes require Firebase Authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <firebase-jwt-token>
```

## File Uploads

The API supports image and video uploads with the following specifications:

- **Supported Image Types**: JPEG, PNG, GIF, WebP
- **Supported Video Types**: MP4, MPEG, MOV, WebM
- **Maximum File Size**: 50MB
- **Maximum Files per Request**: 10
- **Storage**: Local filesystem in `/uploads` directory

### File Access

Uploaded files are accessible via:
```
http://localhost:3000/uploads/{category}/{filename}
```

Categories: `images`, `videos`, `thumbnails`

---

## Stitch Management

### Create Stitch

Create a new embroidery stitch with optional media files.

- **URL**: `/stitches`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Files**: 
  - `thumbnailImage` (optional): Thumbnail image
  - `featuredImage` (optional): Featured image

**Form Data**:
```javascript
{
  "name": "French Knot",
  "description": "A small, textured stitch perfect for adding dimension",
  "designerNotes": "Keep tension consistent for uniform knots",
  "isPremium": false,
  "families": "[\"family_id_1\", \"family_id_2\"]", // JSON string
  "usages": "[\"usage_id_1\"]",
  "difficulties": "[\"difficulty_id_1\"]",
  "tags": "[\"tag_id_1\", \"tag_id_2\"]",
  "swatches": "[\"swatch_id_1\", \"swatch_id_2\"]"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Stitch created successfully",
  "data": {
    "_id": "stitch_id",
    "name": "French Knot",
    "description": "A small, textured stitch perfect for adding dimension",
    "thumbnailImage": "uploads/images/thumbnailImage-1234567890.jpg",
    "families": ["family_id_1"],
    "createdAt": "2023-08-16T14:30:00.000Z"
  }
}
```

### Get All Stitches

Retrieve stitches with filtering, searching, and pagination.

- **URL**: `/stitches`
- **Method**: `GET`

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `family` (string): Filter by family ID
- `usage` (string): Filter by usage ID
- `difficulty` (string): Filter by difficulty ID
- `tag` (string): Filter by tag ID
- `swatch` (string): Filter by swatch ID
- `isPremium` (boolean): Filter by premium status
- `search` (string): Search in name and description

**Example**: `/stitches?page=1&limit=10&family=family_id&search=french`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "stitches": [
      {
        "_id": "stitch_id",
        "name": "French Knot",
        "description": "A small, textured stitch...",
        "thumbnailImage": "uploads/images/thumb.jpg",
        "families": [{"_id": "family_id", "name": "Surface Embroidery"}],
        "usages": [{"_id": "usage_id", "name": "Decorative"}],
        "difficulties": [{"_id": "diff_id", "name": "Beginner", "level": 1}],
        "tags": [{"_id": "tag_id", "name": "textured"}],
        "swatches": [{"_id": "swatch_id", "name": "Blue", "hexCode": "#0000FF"}]
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 87
    }
  }
}
```

### Get Single Stitch

Retrieve a specific stitch with all its steps.

- **URL**: `/stitches/{id}`
- **Method**: `GET`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "stitch": {
      "_id": "stitch_id",
      "name": "French Knot",
      "description": "A small, textured stitch...",
      "designerNotes": "Keep tension consistent...",
      "families": [{"name": "Surface Embroidery", "description": "Basic stitches..."}],
      "steps": []
    },
    "steps": [
      {
        "_id": "step_id",
        "stepNumber": 1,
        "instruction": "Thread your needle...",
        "illustration": "uploads/images/step1.jpg",
        "photo": "uploads/images/step1-photo.jpg"
      }
    ]
  }
}
```

### Update Stitch

Update an existing stitch.

- **URL**: `/stitches/{id}`
- **Method**: `PUT`
- **Content-Type**: `multipart/form-data`

**Form Data**: Same as Create Stitch

**Success Response** (200):
```json
{
  "success": true,
  "message": "Stitch updated successfully",
  "data": {
    "_id": "stitch_id",
    "name": "Updated French Knot",
    "updatedAt": "2023-08-16T15:30:00.000Z"
  }
}
```

### Delete Stitch

Soft delete a stitch (sets `isActive: false`).

- **URL**: `/stitches/{id}`
- **Method**: `DELETE`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Stitch deleted successfully"
}
```

---

## Step Management

### Create Step

Add a new step to a stitch with optional media files.

- **URL**: `/stitches/{stitchId}/steps`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Files**:
  - `illustration` (optional): Step illustration
  - `photo` (optional): Step photo
  - `video` (optional): Step video
  - `thumbnail` (optional): Video thumbnail

**Form Data**:
```javascript
{
  "stepNumber": 1,
  "instruction": "Thread your needle with embroidery floss",
  "illustrationAlt": "Needle being threaded",
  "photoAlt": "Close-up of threaded needle",
  "videoDuration": 30
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Step created successfully",
  "data": {
    "_id": "step_id",
    "stitchId": "stitch_id",
    "stepNumber": 1,
    "instruction": "Thread your needle...",
    "illustration": "uploads/images/illustration-123.jpg",
    "mediaMetadata": {
      "illustrationAlt": "Needle being threaded"
    }
  }
}
```

### Get Steps for Stitch

Retrieve all steps for a specific stitch.

- **URL**: `/stitches/{stitchId}/steps`
- **Method**: `GET`

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "step_id",
      "stepNumber": 1,
      "instruction": "Thread your needle...",
      "illustration": "uploads/images/step1.jpg",
      "video": "uploads/videos/step1.mp4",
      "mediaMetadata": {
        "videoDuration": 30,
        "videoThumbnail": "uploads/thumbnails/step1-thumb.jpg"
      }
    }
  ]
}
```

### Update Step

Update an existing step.

- **URL**: `/stitches/steps/{id}`
- **Method**: `PUT`
- **Content-Type**: `multipart/form-data`

**Form Data**: Same as Create Step

### Delete Step

Delete a step permanently.

- **URL**: `/stitches/steps/{id}`
- **Method**: `DELETE`

### Reorder Steps

Change the order of steps for a stitch.

- **URL**: `/stitches/{stitchId}/steps/reorder`
- **Method**: `PUT`
- **Content-Type**: `application/json`

**Request Body**:
```json
{
  "stepOrder": ["step_id_3", "step_id_1", "step_id_2"]
}
```

---

## User Progress

All user progress endpoints require authentication.

### Update Progress

Update user's progress on a stitch.

- **URL**: `/stitches/{stitchId}/progress/{userId}`
- **Method**: `PUT`
- **Auth**: Required

**Request Body**:
```json
{
  "lastCompletedStep": 3,
  "personalNotes": "Remember to keep tension loose",
  "timeSpent": 45
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Progress updated successfully",
  "data": {
    "_id": "progress_id",
    "userId": "firebase_uid",
    "stitchId": {
      "_id": "stitch_id",
      "name": "French Knot"
    },
    "lastCompletedStep": 3,
    "completionStatus": "in_progress",
    "personalNotes": "Remember to keep tension loose",
    "timeSpent": 45,
    "lastAccessed": "2023-08-16T15:30:00.000Z"
  }
}
```

### Toggle Favorite

Add or remove a stitch from user's favorites.

- **URL**: `/stitches/{stitchId}/favorite/{userId}`
- **Method**: `POST`
- **Auth**: Required

**Success Response** (200):
```json
{
  "success": true,
  "message": "Stitch added to favorites",
  "data": {
    "isFavorite": true,
    "stitchId": {
      "name": "French Knot",
      "thumbnailImage": "uploads/images/thumb.jpg"
    }
  }
}
```

### Get User Favorites

Retrieve user's favorite stitches.

- **URL**: `/stitches/favorites/{userId}`
- **Method**: `GET`
- **Auth**: Required

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Items per page

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "_id": "progress_id",
        "stitchId": {
          "name": "French Knot",
          "description": "A small, textured stitch...",
          "thumbnailImage": "uploads/images/thumb.jpg"
        },
        "lastAccessed": "2023-08-16T15:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 2,
      "total": 15
    }
  }
}
```

### Get User Progress

Retrieve all user progress with filtering.

- **URL**: `/stitches/progress/{userId}`
- **Method**: `GET`
- **Auth**: Required

**Query Parameters**:
- `page`, `limit`: Pagination
- `completionStatus`: Filter by status (`not_started`, `in_progress`, `completed`)
- `sortBy`: Sort field (`lastAccessed`, `createdAt`, `timeSpent`)
- `sortOrder`: Sort direction (`asc`, `desc`)

### Get Stitch Progress

Get user's progress for a specific stitch.

- **URL**: `/stitches/{stitchId}/progress/{userId}`
- **Method**: `GET`
- **Auth**: Required

### Get User Statistics

Get user's learning statistics.

- **URL**: `/stitches/stats/{userId}`
- **Method**: `GET`
- **Auth**: Required

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "totalStitches": 25,
    "completedStitches": 8,
    "inProgressStitches": 12,
    "favoriteStitches": 15,
    "totalTimeSpent": 1250
  }
}
```

---

## Taxonomy Management

### Families

#### Create Family
- **URL**: `/taxonomy/families`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Files**: `icon` (optional)

**Form Data**:
```javascript
{
  "name": "Ribbon Embroidery",
  "description": "Stitches using ribbon instead of thread"
}
```

#### Get All Families
- **URL**: `/taxonomy/families`
- **Method**: `GET`

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "family_id",
      "name": "Ribbon Embroidery",
      "description": "Stitches using ribbon...",
      "icon": "uploads/images/ribbon-icon.png",
      "isActive": true
    }
  ]
}
```

### Usages

#### Create Usage
- **URL**: `/taxonomy/usages`
- **Method**: `POST`

**Request Body**:
```json
{
  "name": "Filler",
  "description": "Used to fill large areas"
}
```

#### Get All Usages
- **URL**: `/taxonomy/usages`
- **Method**: `GET`

### Difficulties

#### Create Difficulty
- **URL**: `/taxonomy/difficulties`
- **Method**: `POST`

**Request Body**:
```json
{
  "name": "Beginner",
  "level": 1,
  "description": "Easy stitches for beginners",
  "color": "#4CAF50"
}
```

#### Get All Difficulties
- **URL**: `/taxonomy/difficulties`
- **Method**: `GET`

### Tags

#### Create Tag
- **URL**: `/taxonomy/tags`
- **Method**: `POST`

**Request Body**:
```json
{
  "name": "floral",
  "category": "style"
}
```

#### Get All Tags
- **URL**: `/taxonomy/tags`
- **Method**: `GET`

**Query Parameters**:
- `category` (string): Filter by tag category

### Swatches

#### Create Swatch
- **URL**: `/taxonomy/swatches`
- **Method**: `POST`

**Request Body**:
```json
{
  "name": "Royal Blue",
  "hexCode": "#4169E1",
  "category": "basic"
}
```

#### Get All Swatches
- **URL**: `/taxonomy/swatches`
- **Method**: `GET`

**Query Parameters**:
- `category` (string): Filter by swatch category

### Generic Update/Delete

#### Update Taxonomy Item
- **URL**: `/taxonomy/{type}/{id}`
- **Method**: `PUT`
- **Types**: `family`, `usage`, `difficulty`, `tag`, `swatch`

#### Delete Taxonomy Item
- **URL**: `/taxonomy/{type}/{id}`
- **Method**: `DELETE`
- **Types**: `family`, `usage`, `difficulty`, `tag`, `swatch`

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, invalid data)
- `401` - Unauthorized (missing or invalid authentication)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### File Upload Errors

- `400` - Invalid file type
- `413` - File too large (>50MB)
- `400` - Too many files (>10)

**Example Error Response**:
```json
{
  "success": false,
  "message": "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, MOV, WebM) are allowed."
}
```

---

## Data Models

### Stitch Model
```javascript
{
  "_id": "ObjectId",
  "name": "String (required, unique)",
  "description": "String (required)",
  "designerNotes": "String",
  "isPremium": "Boolean (default: false)",
  "isActive": "Boolean (default: true)",
  "families": ["ObjectId"],
  "usages": ["ObjectId"],
  "difficulties": ["ObjectId"],
  "tags": ["ObjectId"],
  "swatches": ["ObjectId"],
  "thumbnailImage": "String (file path)",
  "featuredImage": "String (file path)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Step Model
```javascript
{
  "_id": "ObjectId",
  "stitchId": "ObjectId (required)",
  "stepNumber": "Number (required, min: 1)",
  "instruction": "String (required)",
  "illustration": "String (file path)",
  "photo": "String (file path)",
  "video": "String (file path)",
  "mediaMetadata": {
    "illustrationAlt": "String",
    "photoAlt": "String",
    "videoDuration": "Number",
    "videoThumbnail": "String"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### UserProgress Model
```javascript
{
  "_id": "ObjectId",
  "userId": "String (Firebase UID, required)",
  "stitchId": "ObjectId (required)",
  "lastCompletedStep": "Number (default: 0)",
  "isFavorite": "Boolean (default: false)",
  "personalNotes": "String (max: 2000 chars)",
  "completionStatus": "String (enum: not_started, in_progress, completed)",
  "timeSpent": "Number (minutes)",
  "lastAccessed": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Family Model
```javascript
{
  "_id": "ObjectId",
  "name": "String (required, unique)",
  "description": "String",
  "icon": "String (file path)",
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Usage Model
```javascript
{
  "_id": "ObjectId",
  "name": "String (required, unique)",
  "description": "String",
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Difficulty Model
```javascript
{
  "_id": "ObjectId",
  "name": "String (required, unique)",
  "level": "Number (required, 1-5)",
  "description": "String",
  "color": "String (hex color, default: #000000)",
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Tag Model
```javascript
{
  "_id": "ObjectId",
  "name": "String (required, unique, lowercase)",
  "category": "String (default: general)",
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Swatch Model
```javascript
{
  "_id": "ObjectId",
  "name": "String (required, unique)",
  "hexCode": "String (required, hex format)",
  "rgbCode": {
    "r": "Number (0-255)",
    "g": "Number (0-255)",
    "b": "Number (0-255)"
  },
  "category": "String (default: basic)",
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## API Versioning

Current API version: v1 (no versioning prefix currently used)

## CORS

Configure CORS settings based on your frontend domain requirements.

---

This API documentation covers all endpoints and functionality for the Stitch Dictionary App. For database setup instructions, refer to the separate database setup documentation.
