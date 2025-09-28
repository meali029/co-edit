import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/dbConnect';
import DocumentModel from '../../../../../models/Document';

// Get document by share token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    await dbConnect();

    // Find the document with the share token
    const document = await DocumentModel.findOne({
      'shareLinks.token': token,
      'shareLinks.isActive': true,
    })
      .populate('createdBy', 'name email')
      .lean();

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or link has expired' },
        { status: 404 }
      );
    }

    // Find the specific share link
    const shareLink = document.shareLinks.find((link: any) => link.token === token);

    if (!shareLink || !shareLink.isActive) {
      return NextResponse.json(
        { error: 'Share link is no longer active' },
        { status: 404 }
      );
    }

    // Check if the link has expired
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 403 }
      );
    }

    // Return document data with the role from the share link
    return NextResponse.json({
      document: {
        id: document._id,
        title: document.title,
        content: document.content,
        fileType: document.fileType,
        originalFileName: document.originalFileName,
        createdBy: {
          name: document.createdBy.name,
          email: document.createdBy.email,
        },
        userRole: shareLink.role, // Use role from share link
      },
    });
  } catch (error) {
    console.error('Get shared document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update shared document (if user has editor access)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { content } = await request.json();

    await dbConnect();

    // Find the document with the share token
    const document = await DocumentModel.findOne({
      'shareLinks.token': token,
      'shareLinks.isActive': true,
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or link has expired' },
        { status: 404 }
      );
    }

    // Find the specific share link
    const shareLink = document.shareLinks.find((link: any) => link.token === token);

    if (!shareLink || !shareLink.isActive) {
      return NextResponse.json(
        { error: 'Share link is no longer active' },
        { status: 404 }
      );
    }

    // Check if the link has expired
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 403 }
      );
    }

    // Check if user has editor permissions
    if (shareLink.role !== 'editor') {
      return NextResponse.json(
        { error: 'View-only access. Cannot modify document.' },
        { status: 403 }
      );
    }

    // Update document content
    document.content = content;
    document.updatedAt = new Date();
    await document.save();

    return NextResponse.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Update shared document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}