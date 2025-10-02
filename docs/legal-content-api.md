# Legal Content API Documentation

This API provides endpoints for managing privacy policy and terms & conditions content for the Stitch Dictionary mobile app.

## Overview

The Legal Content API allows you to:
- Retrieve privacy policy and terms & conditions
- Manage legal content (admin only)
- Track content versions and updates
- Ensure compliance with legal requirements

## Base URL
```
/api/legal
```

## Public Endpoints (No Authentication Required)

### Get Privacy Policy
```http
GET /api/legal/privacy-policy
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "content_id",
    "type": "privacy_policy",
    "title": "Privacy Policy",
    "content": "# Privacy Policy for Stitch Dictionary\n\n...",
    "version": "1.0",
    "effectiveDate": "2024-01-01T00:00:00.000Z",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "metadata": {
      "author": "Legal Team",
      "language": "en",
      "jurisdiction": "US"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Terms and Conditions
```http
GET /api/legal/terms-conditions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "content_id",
    "type": "terms_conditions",
    "title": "Terms and Conditions",
    "content": "# Terms and Conditions for Stitch Dictionary\n\n...",
    "version": "1.0",
    "effectiveDate": "2024-01-01T00:00:00.000Z",
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "metadata": {
      "author": "Legal Team",
      "language": "en",
      "jurisdiction": "US"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All Legal Content
```http
GET /api/legal/all
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "privacy_id",
      "type": "privacy_policy",
      "title": "Privacy Policy",
      "content": "...",
      "version": "1.0",
      "effectiveDate": "2024-01-01T00:00:00.000Z",
      "lastUpdated": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "metadata": {...}
    },
    {
      "_id": "terms_id",
      "type": "terms_conditions",
      "title": "Terms and Conditions",
      "content": "...",
      "version": "1.0",
      "effectiveDate": "2024-01-01T00:00:00.000Z",
      "lastUpdated": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "metadata": {...}
    }
  ]
}
```

### Get Content by Type
```http
GET /api/legal/:type
```

**Parameters:**
- `type` - Content type (`privacy_policy` or `terms_conditions`)

**Example:**
```http
GET /api/legal/privacy_policy
```

## Admin Endpoints (Authentication Required)

### Create or Update Legal Content
```http
POST /api/legal/:type
PUT /api/legal/:type
```

**Parameters:**
- `type` - Content type (`privacy_policy` or `terms_conditions`)

**Request Body:**
```json
{
  "title": "Privacy Policy",
  "content": "# Privacy Policy\n\nYour privacy policy content here...",
  "version": "1.1",
  "effectiveDate": "2024-02-01T00:00:00.000Z",
  "metadata": {
    "author": "Legal Team",
    "language": "en",
    "jurisdiction": "US"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "privacy policy updated successfully",
  "data": {
    "_id": "content_id",
    "type": "privacy_policy",
    "title": "Privacy Policy",
    "content": "# Privacy Policy\n\nYour privacy policy content here...",
    "version": "1.1",
    "effectiveDate": "2024-02-01T00:00:00.000Z",
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "isActive": true,
    "metadata": {
      "author": "Legal Team",
      "language": "en",
      "jurisdiction": "US"
    }
  }
}
```

### Get Content History
```http
GET /api/legal/:type/history
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "_id": "content_id",
      "type": "privacy_policy",
      "title": "Privacy Policy",
      "content": "...",
      "version": "1.1"
    },
    "history": []
  }
}
```

### Delete Legal Content
```http
DELETE /api/legal/:type
```

**Response:**
```json
{
  "success": true,
  "message": "Content deactivated successfully"
}
```

## Content Format

### Supported Content Types
- `privacy_policy` - Privacy policy content
- `terms_conditions` - Terms and conditions content

### Content Structure
```javascript
{
  type: String,           // Content type (enum)
  title: String,          // Display title
  content: String,        // Full content (supports Markdown)
  version: String,        // Version number (e.g., "1.0", "1.1")
  effectiveDate: Date,    // When this version becomes effective
  lastUpdated: Date,      // Last modification date
  isActive: Boolean,      // Whether content is active
  metadata: {
    author: String,       // Content author
    language: String,     // Content language (ISO code)
    jurisdiction: String  // Legal jurisdiction
  }
}
```

## Usage Examples

### Mobile App Integration

#### Display Privacy Policy in App
```javascript
async function loadPrivacyPolicy() {
  try {
    const response = await fetch('/api/legal/privacy-policy');
    const data = await response.json();
    
    if (data.success) {
      // Display privacy policy content
      displayContent(data.data.title, data.data.content);
    }
  } catch (error) {
    console.error('Error loading privacy policy:', error);
  }
}
```

#### Check for Content Updates
```javascript
async function checkForUpdates(lastKnownVersion) {
  try {
    const response = await fetch('/api/legal/all');
    const data = await response.json();
    
    if (data.success) {
      const privacyPolicy = data.data.find(item => item.type === 'privacy_policy');
      const termsConditions = data.data.find(item => item.type === 'terms_conditions');
      
      // Check if versions have changed
      if (privacyPolicy.version !== lastKnownVersion.privacy ||
          termsConditions.version !== lastKnownVersion.terms) {
        // Show update notification to user
        showLegalUpdateNotification();
      }
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}
```

### Admin Panel Integration

#### Update Privacy Policy
```javascript
async function updatePrivacyPolicy(content) {
  try {
    const response = await fetch('/api/legal/privacy_policy', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Privacy Policy',
        content: content,
        version: '1.2',
        effectiveDate: new Date().toISOString()
      })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Privacy policy updated successfully');
    }
  } catch (error) {
    console.error('Error updating privacy policy:', error);
  }
}
```

## Error Responses

### 404 - Content Not Found
```json
{
  "success": false,
  "message": "Privacy policy not found"
}
```

### 400 - Invalid Content Type
```json
{
  "success": false,
  "message": "Invalid content type. Must be privacy_policy or terms_conditions"
}
```

### 400 - Missing Required Fields
```json
{
  "success": false,
  "message": "Title and content are required"
}
```

### 401 - Unauthorized (Admin endpoints)
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Error fetching privacy policy",
  "error": "Database connection failed"
}
```

## Best Practices

### For Mobile Apps
1. **Cache content locally** to ensure availability offline
2. **Check for updates** on app startup
3. **Notify users** when legal content is updated
4. **Require acceptance** of new terms when updated
5. **Provide easy access** to legal content from settings

### For Content Management
1. **Version your content** with semantic versioning
2. **Set effective dates** for future changes
3. **Keep backup copies** of previous versions
4. **Review content regularly** for compliance
5. **Use clear, understandable language**

### Security Considerations
1. **Protect admin endpoints** with proper authentication
2. **Validate all input** to prevent injection attacks
3. **Log all changes** for audit purposes
4. **Use HTTPS** for all API calls
5. **Implement rate limiting** to prevent abuse

## Seeding Initial Content

To populate initial legal content, run:

```bash
node scripts/seedLegalContent.js
```

This will create default privacy policy and terms & conditions content that you can then customize through the admin endpoints.
