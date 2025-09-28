import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../../lib/dbConnect';
import DocumentModel from '../../../../../models/Document';
import User from '../../../../../models/User';
import { FileUploadService } from '../../../../../lib/fileUpload';
import { DocumentProcessor } from '../../../../../lib/documentProcessor';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Upload file (process in memory)
    const uploadResult = await FileUploadService.uploadFile(request);

    // Process document content from buffer
    const processResult = await DocumentProcessor.processDocument(
      uploadResult.buffer,
      uploadResult.fileType,
      uploadResult.originalName
    );

    // Create document in database
    const document = await DocumentModel.create({
      title: processResult.title || uploadResult.originalName,
      originalFileName: uploadResult.originalName,
      fileType: uploadResult.fileType,
      content: processResult.content,
      collaborators: [
        {
          userId: user._id,
          email: user.email,
          role: 'owner',
        }
      ],
      createdBy: user._id,
      lastModifiedBy: user._id,
    });

    return NextResponse.json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        title: document.title,
        fileType: document.fileType,
        isEditable: processResult.isEditable,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}