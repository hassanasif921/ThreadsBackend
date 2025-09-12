# Category API Documentation

## Overview
The Category API provides endpoints to retrieve stitches grouped by embroidery categories (families). This allows for organized browsing of stitches by their type and technique.

## Endpoints

### Get All Categories with Stitches
Returns all embroidery categories with their associated stitches in a nested structure.

- **URL**: `/api/categories`
- **Method**: `GET`
- **Authentication**: Required (JWT)

**Query Parameters**:
- `includeSteps` (optional): Set to `true` to include step-by-step instructions for each stitch

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "category": {
        "_id": "category_id",
        "name": "Running Stitch Family",
        "description": "Basic running and related stitches",
        "icon": null
      },
      "stitchCount": 5,
      "stitches": [
        {
          "_id": "stitch_id",
          "name": "Whipped Running Stitch",
          "description": "A running stitch with a second thread whipped around each stitch for texture.",
          "referenceNumber": "1002",
          "alternativeNames": ["Overcast Running Stitch"],
          "featuredImage": {
            "filename": "1002_thumb.jpg",
            "path": "uploads/thumbnails/1002_thumb.jpg",
            "size": 15420
          },
          "images": [
            {
              "filename": "1002.jpg",
              "path": "uploads/images/1002.jpg",
              "size": 45680
            }
          ],
          "difficulty": {
            "name": "Intermediate",
            "level": 3,
            "color": "#FF9800"
          },
          "usages": [
            {
              "name": "Decorative",
              "description": "Purely decorative stitches"
            }
          ],
          "tags": [
            {"name": "running"},
            {"name": "whipped"},
            {"name": "decorative"}
          ],
          "notes": "Adds dimension; use contrasting colors for more visual effect."
        }
      ]
    }
  ],
  "totalCategories": 2,
  "totalStitches": 6
}
```

### Get Categories Summary
Returns just category names and stitch counts (lighter response for navigation).

- **URL**: `/api/categories/summary`
- **Method**: `GET`
- **Authentication**: Required (JWT)

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "_id": "category_id",
      "name": "Running Stitch Family",
      "description": "Basic running and related stitches",
      "icon": null,
      "stitchCount": 5
    }
  ],
  "totalCategories": 2
}
```

### Get Specific Category
Returns a single category with its stitches and pagination support.

- **URL**: `/api/categories/:id`
- **Method**: `GET`
- **Authentication**: Required (JWT)

**Path Parameters**:
- `id`: Category ID

**Query Parameters**:
- `includeSteps` (optional): Set to `true` to include step-by-step instructions
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "category": {
      "_id": "category_id",
      "name": "Running Stitch Family",
      "description": "Basic running and related stitches",
      "icon": null
    },
    "stitches": [
      // Array of stitches (same structure as above)
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 5,
      "itemsPerPage": 20
    }
  }
}
```

## Image Structure

### Featured Images
- **Location**: `uploads/thumbnails/`
- **Purpose**: Small preview images for category listings and cards
- **Naming**: `{referenceNumber}_thumb.jpg`
- **Usage**: Display in category grids, search results, and stitch cards

### Detail Images
- **Location**: `uploads/images/`
- **Purpose**: Full-size images for detailed stitch views
- **Naming**: `{referenceNumber}.jpg`
- **Usage**: Display in stitch detail pages and step instructions

### Step Images
- **Location**: `uploads/images/`
- **Purpose**: Step-by-step instruction images
- **Naming**: `{referenceNumber}_step{stepNumber}.jpg`
- **Usage**: Display alongside step instructions

## Error Responses

### 404 - Category Not Found
```json
{
  "success": false,
  "message": "Category not found"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Error fetching stitches by category",
  "error": "Detailed error message"
}
```

## Usage Examples

### Get all categories for navigation
```javascript
const response = await fetch('/api/categories/summary', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const categories = await response.json();
```

### Get category with stitches for display
```javascript
const response = await fetch('/api/categories', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const categorizedStitches = await response.json();
```

### Get specific category with pagination
```javascript
const response = await fetch('/api/categories/category_id?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const categoryData = await response.json();
```
