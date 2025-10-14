# API Usage Examples

This document provides practical examples of how to use the Stitch Dictionary API endpoints.

## Table of Contents
- [Authentication Setup](#authentication-setup)
- [Creating a Complete Stitch](#creating-a-complete-stitch)
- [Managing Steps with Media](#managing-steps-with-media)
- [User Progress Tracking](#user-progress-tracking)
- [Search and Filtering](#search-and-filtering)
- [Taxonomy Management](#taxonomy-management)

## Authentication Setup

First, obtain a Firebase JWT token and include it in requests:

```javascript
const headers = {
  'Authorization': 'Bearer YOUR_FIREBASE_JWT_TOKEN',
  'Content-Type': 'application/json'
};
```

## Creating a Complete Stitch

### Step 1: Create Taxonomy Items

```javascript
// Create a family
const familyResponse = await fetch('/api/taxonomy/families', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Surface Embroidery",
    description: "Basic embroidery stitches worked on fabric surface"
  })
});

// Create usage
const usageResponse = await fetch('/api/taxonomy/usages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Decorative",
    description: "Purely decorative stitches"
  })
});

// Create difficulty
const difficultyResponse = await fetch('/api/taxonomy/difficulties', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Beginner",
    level: 1,
    description: "Easy stitches for beginners",
    color: "#4CAF50"
  })
});

// Create tags
const tagResponse = await fetch('/api/taxonomy/tags', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "textured"
  })
});

// Create swatch
const swatchResponse = await fetch('/api/taxonomy/swatches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Deep Blue",
    hexCode: "#003366"
  })
});
```

### Step 2: Create Stitch with Media

```javascript
const formData = new FormData();

// Basic stitch data
formData.append('name', 'French Knot');
formData.append('description', 'A small, textured stitch perfect for adding dimension');
formData.append('designerNotes', 'Keep tension consistent for uniform knots');
formData.append('isPremium', 'false');

// Taxonomy relationships (as JSON strings)
formData.append('families', JSON.stringify([familyId]));
formData.append('usages', JSON.stringify([usageId]));
formData.append('difficulties', JSON.stringify([difficultyId]));
formData.append('tags', JSON.stringify([tagId]));
formData.append('swatches', JSON.stringify([swatchId]));

// Direct hex colors
formData.append('hexCodes', JSON.stringify(['#FF0000', '#00FF00', '#0000FF']));

// Media files
formData.append('thumbnailImage', thumbnailFile);
formData.append('featuredImage', featuredFile);

const stitchResponse = await fetch('/api/stitches', {
  method: 'POST',
  body: formData
});

const stitch = await stitchResponse.json();
```

## Managing Steps with Media

### Creating Steps with Different Media Types

```javascript
const stitchId = 'your_stitch_id';

// Step 1: Text instruction with illustration
const step1FormData = new FormData();
step1FormData.append('stepNumber', '1');
step1FormData.append('instruction', 'Thread your needle with embroidery floss');
step1FormData.append('illustrationAlt', 'Needle being threaded with floss');
step1FormData.append('illustration', illustrationFile);

await fetch(`/api/stitches/${stitchId}/steps`, {
  method: 'POST',
  body: step1FormData
});

// Step 2: Instruction with photo
const step2FormData = new FormData();
step2FormData.append('stepNumber', '2');
step2FormData.append('instruction', 'Insert needle from back of fabric');
step2FormData.append('photoAlt', 'Needle coming through fabric');
step2FormData.append('photo', photoFile);

await fetch(`/api/stitches/${stitchId}/steps`, {
  method: 'POST',
  body: step2FormData
});

// Step 3: Instruction with video
const step3FormData = new FormData();
step3FormData.append('stepNumber', '3');
step3FormData.append('instruction', 'Wrap thread around needle twice');
step3FormData.append('videoDuration', '15');
step3FormData.append('video', videoFile);
step3FormData.append('thumbnail', videoThumbnailFile);

await fetch(`/api/stitches/${stitchId}/steps`, {
  method: 'POST',
  body: step3FormData
});
```

### Reordering Steps

```javascript
const newOrder = ['step_id_3', 'step_id_1', 'step_id_2'];

await fetch(`/api/stitches/${stitchId}/steps/reorder`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stepOrder: newOrder
  })
});
```

## User Progress Tracking

### Starting Progress on a Stitch

```javascript
const userId = 'firebase_user_id';
const stitchId = 'stitch_id';

// Update progress after completing step 2
await fetch(`/api/stitches/${stitchId}/progress/${userId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    lastCompletedStep: 2,
    personalNotes: 'Remember to keep tension loose',
    timeSpent: 30 // minutes
  })
});
```

### Managing Favorites

#### Add to Favorites
```javascript
await fetch(`/api/stitches/${stitchId}/favorite`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

#### Remove from Favorites
```javascript
await fetch(`/api/stitches/${stitchId}/favorite`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

#### Get All Favorites
```javascript
const favoritesResponse = await fetch('/api/stitches/favorites?page=1&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
const favorites = await favoritesResponse.json();
```

### Getting User Statistics

```javascript
const statsResponse = await fetch(`/api/stitches/stats/${userId}`, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const stats = await statsResponse.json();
// Returns: totalStitches, completedStitches, inProgressStitches, favoriteStitches, totalTimeSpent
```

## Search and Filtering

### Basic Search

```javascript
// Search for stitches containing "knot"
const searchResponse = await fetch('/api/stitches?search=knot&page=1&limit=10');
const results = await searchResponse.json();
```

### Advanced Filtering

```javascript
// Filter by multiple criteria
const params = new URLSearchParams({
  family: 'family_id',
  difficulty: 'difficulty_id',
  isPremium: 'false',
  page: '1',
  limit: '20'
});

const filteredResponse = await fetch(`/api/stitches?${params}`);
const filteredResults = await filteredResponse.json();
```

### Getting User's Favorites with Pagination

```javascript
const favoritesResponse = await fetch(`/api/stitches/favorites/${userId}?page=1&limit=10`, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const favorites = await favoritesResponse.json();
```

## Taxonomy Management

### Getting All Taxonomy Data

```javascript
// Get all families
const families = await fetch('/api/taxonomy/families').then(r => r.json());

// Get all usages
const usages = await fetch('/api/taxonomy/usages').then(r => r.json());

// Get all difficulties
const difficulties = await fetch('/api/taxonomy/difficulties').then(r => r.json());

// Get all tags
const tags = await fetch('/api/taxonomy/tags').then(r => r.json());

// Get all swatches
const swatches = await fetch('/api/taxonomy/swatches').then(r => r.json());
```

### Updating Taxonomy Items

```javascript
// Update a family
await fetch('/api/taxonomy/family/family_id', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Updated Family Name',
    description: 'Updated description'
  })
});

// Soft delete a tag
await fetch('/api/taxonomy/tag/tag_id', {
  method: 'DELETE'
});
```

## Complete Workflow Example

Here's a complete example of creating a stitch with steps and tracking user progress:

```javascript
async function createCompleteStitch() {
  try {
    // 1. Create taxonomy items
    const family = await createFamily('Surface Embroidery');
    const usage = await createUsage('Decorative');
    const difficulty = await createDifficulty('Beginner', 1);
    const tag = await createTag('textured');
    
    // 2. Create stitch
    const stitchData = new FormData();
    stitchData.append('name', 'French Knot');
    stitchData.append('description', 'A textured decorative stitch');
    stitchData.append('families', JSON.stringify([family.data._id]));
    stitchData.append('usages', JSON.stringify([usage.data._id]));
    stitchData.append('difficulties', JSON.stringify([difficulty.data._id]));
    stitchData.append('tags', JSON.stringify([tag.data._id]));
    stitchData.append('hexCodes', JSON.stringify(['#FF0000', '#00FF00']));
    
    const stitchResponse = await fetch('/api/stitches', {
      method: 'POST',
      body: stitchData
    });
    const stitch = await stitchResponse.json();
    
    // 3. Add steps
    const steps = [
      { number: 1, instruction: 'Thread needle', hasIllustration: true },
      { number: 2, instruction: 'Insert from back', hasPhoto: true },
      { number: 3, instruction: 'Wrap thread twice', hasVideo: true },
      { number: 4, instruction: 'Pull through gently', hasPhoto: true }
    ];
    
    for (const step of steps) {
      const stepData = new FormData();
      stepData.append('stepNumber', step.number.toString());
      stepData.append('instruction', step.instruction);
      
      // Add media files based on step requirements
      if (step.hasIllustration) stepData.append('illustration', illustrationFile);
      if (step.hasPhoto) stepData.append('photo', photoFile);
      if (step.hasVideo) {
        stepData.append('video', videoFile);
        stepData.append('thumbnail', thumbnailFile);
        stepData.append('videoDuration', '20');
      }
      
      await fetch(`/api/stitches/${stitch.data._id}/steps`, {
        method: 'POST',
        body: stepData
      });
    }
    
    // 4. Simulate user progress
    const userId = 'firebase_user_123';
    
    // User completes first 2 steps
    await fetch(`/api/stitches/${stitch.data._id}/progress/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer JWT_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lastCompletedStep: 2,
        personalNotes: 'Great stitch for beginners!',
        timeSpent: 25
      })
    });
    
    // User adds to favorites
    await fetch(`/api/stitches/${stitch.data._id}/favorite/${userId}`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer JWT_TOKEN' }
    });
    
    console.log('Complete stitch created successfully!');
    return stitch.data;
    
  } catch (error) {
    console.error('Error creating stitch:', error);
    throw error;
  }
}

// Helper functions
async function createFamily(name) {
  return fetch('/api/taxonomy/families', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: `${name} category` })
  }).then(r => r.json());
}

async function createUsage(name) {
  return fetch('/api/taxonomy/usages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: `${name} usage` })
  }).then(r => r.json());
}

async function createDifficulty(name, level) {
  return fetch('/api/taxonomy/difficulties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      name, 
      level, 
      description: `${name} level stitches`,
      color: level === 1 ? '#4CAF50' : level === 3 ? '#FF9800' : '#F44336'
    })
  }).then(r => r.json());
}

async function createTag(name) {
  return fetch('/api/taxonomy/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(r => r.json());
}
```

## Error Handling

Always implement proper error handling:

```javascript
async function safeApiCall(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle specific error types
    if (error.message.includes('Unauthorized')) {
      // Redirect to login or refresh token
    } else if (error.message.includes('file type')) {
      // Show file type error to user
    }
    
    throw error;
  }
}
```

This completes the practical examples for using the Stitch Dictionary API effectively.
