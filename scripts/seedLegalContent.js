const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LegalContent = require('../src/models/LegalContent');

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://hassanasif302672:xKg7vgfJedq99DPx@cluster0.h4qwsiq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('MongoDB connected for seeding legal content');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

const privacyPolicyContent = `
# Privacy Policy for Stitch Dictionary

**Effective Date:** ${new Date().toLocaleDateString()}

## 1. Information We Collect

### Personal Information
- Account information (email, username)
- Profile information you choose to provide
- Device information and identifiers

### Usage Information
- Stitching progress and completed projects
- App usage patterns and preferences
- Device and technical information

## 2. How We Use Your Information

We use your information to:
- Provide and improve our stitching tutorial services
- Track your learning progress
- Send relevant notifications about your stitching journey
- Ensure app security and prevent fraud

## 3. Information Sharing

We do not sell, trade, or rent your personal information to third parties. We may share information:
- With your consent
- To comply with legal obligations
- To protect our rights and safety

## 4. Data Security

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## 5. Your Rights

You have the right to:
- Access your personal information
- Correct inaccurate information
- Delete your account and associated data
- Opt-out of certain communications

## 6. Children's Privacy

Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.

## 7. Changes to This Policy

We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app.

## 8. Contact Us

If you have questions about this privacy policy, please contact us at:
- Email: privacy@stitchdictionary.com
- Address: [Your Company Address]

This privacy policy was last updated on ${new Date().toLocaleDateString()}.
`;

const termsConditionsContent = `
# Terms and Conditions for Stitch Dictionary

**Effective Date:** ${new Date().toLocaleDateString()}

## 1. Acceptance of Terms

By accessing and using the Stitch Dictionary mobile application, you accept and agree to be bound by the terms and provision of this agreement.

## 2. Description of Service

Stitch Dictionary is a mobile application that provides:
- Stitching tutorials and instructions
- Progress tracking for your stitching projects
- A library of stitching patterns and techniques
- Community features for stitching enthusiasts

## 3. User Accounts

### Account Creation
- You must provide accurate and complete information
- You are responsible for maintaining account security
- You must be at least 13 years old to create an account

### Account Responsibilities
- Keep your login credentials secure
- Notify us of any unauthorized access
- Use the service in compliance with these terms

## 4. Acceptable Use

You agree not to:
- Use the service for any illegal purposes
- Violate any applicable laws or regulations
- Interfere with the service's operation
- Upload malicious content or spam
- Infringe on intellectual property rights

## 5. Content and Intellectual Property

### Our Content
- All stitching patterns, tutorials, and app content are our intellectual property
- You may use our content for personal, non-commercial purposes
- You may not redistribute or sell our content

### User Content
- You retain ownership of content you create
- You grant us a license to use your content to provide the service
- You represent that your content doesn't violate any rights

## 6. Privacy

Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service.

## 7. Disclaimers

### Service Availability
- We provide the service "as is" without warranties
- We don't guarantee uninterrupted service availability
- Features may change or be discontinued

### Content Accuracy
- We strive for accuracy but don't guarantee error-free content
- Users should verify stitching instructions before use
- We're not responsible for project outcomes

## 8. Limitation of Liability

To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages.

## 9. Termination

### By You
- You may delete your account at any time
- Termination doesn't affect already incurred obligations

### By Us
- We may suspend or terminate accounts for terms violations
- We may discontinue the service with reasonable notice

## 10. Changes to Terms

We reserve the right to modify these terms at any time. We will notify users of significant changes through the app.

## 11. Governing Law

These terms are governed by the laws of [Your Jurisdiction] without regard to conflict of law principles.

## 12. Contact Information

For questions about these terms, contact us at:
- Email: legal@stitchdictionary.com
- Address: [Your Company Address]

These terms were last updated on ${new Date().toLocaleDateString()}.
`;

async function seedLegalContent() {
  try {
    await connectDB();

    // Clear existing legal content
    await LegalContent.deleteMany({});
    console.log('Cleared existing legal content');

    // Create privacy policy
    const privacyPolicy = new LegalContent({
      type: 'privacy_policy',
      title: 'Privacy Policy',
      content: privacyPolicyContent.trim(),
      version: '1.0',
      effectiveDate: new Date(),
      metadata: {
        author: 'Legal Team',
        language: 'en',
        jurisdiction: 'US'
      }
    });

    await privacyPolicy.save();
    console.log('✅ Privacy Policy created');

    // Create terms and conditions
    const termsConditions = new LegalContent({
      type: 'terms_conditions',
      title: 'Terms and Conditions',
      content: termsConditionsContent.trim(),
      version: '1.0',
      effectiveDate: new Date(),
      metadata: {
        author: 'Legal Team',
        language: 'en',
        jurisdiction: 'US'
      }
    });

    await termsConditions.save();
    console.log('✅ Terms and Conditions created');

    console.log('🎉 Legal content seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding legal content:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding
if (require.main === module) {
  seedLegalContent();
}

module.exports = seedLegalContent;
