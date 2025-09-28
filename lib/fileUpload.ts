import path from 'path';
import { NextRequest } from 'next/server';

export interface UploadResult {
  filename: string;
  originalName: string;
  buffer: Buffer;
  fileType: string;
  size: number;
}

export class FileUploadService {
  static async uploadFile(request: NextRequest): Promise<UploadResult> {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['.docx', '.pdf'];
    const fileExtension = path.extname(file.name).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error('Only .docx and .pdf files are allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}_${randomSuffix}${fileExtension}`;

    // Convert File to Buffer for in-memory processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      filename,
      originalName: file.name,
      buffer,
      fileType: fileExtension.substring(1), // Remove the dot
      size: file.size,
    };
  }
}