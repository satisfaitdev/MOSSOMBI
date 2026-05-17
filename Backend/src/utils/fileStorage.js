import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

/**
 * Saves a base64 string as a file on the local filesystem.
 * 
 * @param {string} base64String - The base64 encoded file content
 * @param {string} folder - The subfolder within uploads/ (e.g. 'voice_notes')
 * @param {string} extension - File extension (default: 'm4a')
 * @returns {string|null} - The relative URL path or null if failed
 */
export const saveBase64File = (base64String, folder, extension = 'm4a') => {
  if (!base64String) return null;

  try {
    // Clean base64 string (remove data:audio/m4a;base64, etc if present)
    const base64Data = base64String.replace(/^data:.*?;base64,/, '');
    
    const fileName = `vn_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
    const relativeDir = path.join('uploads', folder);
    const absoluteDir = path.join(process.cwd(), relativeDir);
    const absolutePath = path.join(absoluteDir, fileName);
    
    // Ensure directory exists
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(absolutePath, buffer);
    
    // Return relative URL (assuming /uploads is served statically)
    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    logger.error('Error saving base64 file:', error);
    return null;
  }
};

/**
 * Detects image extension from a data URI string.
 * @param {string} dataUri - e.g. "data:image/jpeg;base64,..."
 * @returns {string} - extension like 'jpeg', 'png', 'webp', 'gif'. Defaults to 'jpeg'.
 */
const detectImageExtension = (dataUri) => {
  const match = dataUri.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i);
  if (match) {
    const ext = match[1].toLowerCase();
    return ext === 'jpg' ? 'jpeg' : ext;
  }
  return 'jpeg';
};

/**
 * Saves a base64-encoded image to disk. Auto-detects extension from the data URI.
 * 
 * @param {string} base64String - The full data URI (data:image/jpeg;base64,...) or raw base64
 * @param {string} folder - Subfolder within uploads/ (e.g. 'products')
 * @returns {string|null} - The relative URL path or null if failed
 */
export const saveBase64Image = (base64String, folder = 'products') => {
  if (!base64String) return null;

  try {
    const extension = detectImageExtension(base64String);
    const base64Data = base64String.replace(/^data:.*?;base64,/, '');
    
    const fileName = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}.${extension}`;
    const relativeDir = path.join('uploads', folder);
    const absoluteDir = path.join(process.cwd(), relativeDir);
    const absolutePath = path.join(absoluteDir, fileName);
    
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(absolutePath, buffer);
    
    logger.info(`Image saved: /uploads/${folder}/${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    logger.error('Error saving base64 image:', error);
    return null;
  }
};

/**
 * Processes an array of image strings: converts base64 data URIs to file URLs,
 * passes through existing URLs unchanged.
 * 
 * @param {string[]} images - Array of image strings (base64 or URLs)
 * @param {string} folder - Subfolder within uploads/
 * @returns {string[]} - Array of URL strings
 */
export const processProductImages = (images, folder = 'products') => {
  if (!Array.isArray(images)) return [];
  
  const processed = [];
  for (const img of images) {
    if (!img || typeof img !== 'string') continue;
    
    if (img.startsWith('data:image/')) {
      // Convert base64 to file
      const url = saveBase64Image(img, folder);
      if (url) processed.push(url);
    } else {
      // Already a URL — keep as-is
      processed.push(img);
    }
  }
  return processed;
};
