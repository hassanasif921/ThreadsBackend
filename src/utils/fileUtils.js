const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Process uploaded files and return metadata
exports.processUploadedFiles = (files) => {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  return files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadDate: new Date()
  }));
};

// Generate thumbnail for image
exports.generateThumbnail = async (imagePath, thumbnailPath, width = 300, height = 300) => {
  try {
    await sharp(imagePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
};

// Delete file from filesystem
exports.deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get file extension
exports.getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Check if file is image
exports.isImage = (mimetype) => {
  return mimetype && mimetype.startsWith('image/');
};

// Check if file is video
exports.isVideo = (mimetype) => {
  return mimetype && mimetype.startsWith('video/');
};

// Get file size in human readable format
exports.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file type
exports.validateFileType = (file, allowedTypes) => {
  if (!file || !file.mimetype) {
    return false;
  }
  
  return allowedTypes.includes(file.mimetype);
};

// Create upload directory if it doesn't exist
exports.ensureUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
