import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

export interface UploadResult {
  filename: string;
  originalName: string;
  filePath: string;
  fileType: string;
  size: number;
}

export class FileUploadService {
  private static uploadsDir = path.join(process.cwd(), 'uploads');

  static ensureUploadsDir() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  static async uploadFile(request: NextRequest): Promise<UploadResult> {
    this.ensureUploadsDir();

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

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}_${randomSuffix}${fileExtension}`;
    const filePath = path.join(this.uploadsDir, filename);

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write file to disk
    fs.writeFileSync(filePath, buffer);

    return {
      filename,
      originalName: file.name,
      filePath,
      fileType: fileExtension.substring(1), // Remove the dot
      size: file.size,
    };
  }

  static getFilePath(filename: string): string {
    return path.join(this.uploadsDir, filename);
  }

  static deleteFile(filename: string): boolean {
    try {
      const filePath = this.getFilePath(filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}