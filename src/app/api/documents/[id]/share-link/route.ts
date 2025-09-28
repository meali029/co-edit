import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../../lib/dbConnect';
import DocumentModel from '../../../../../../models/Document';
import User from '../../../../../../models/User';
import crypto from 'crypto';

// Generate share link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { role = 'viewer', expiresIn } = await request.json();

    if (!['editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "editor" or "viewer"' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the document
    const document = await DocumentModel.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if current user is owner
    const currentUserCollaboration = document.collaborators.find(
      (collab: { userId: { toString(): string }; role: string }) => 
        collab.userId.toString() === currentUser._id.toString()
    );

    if (!currentUserCollaboration || currentUserCollaboration.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only document owners can create share links' },
        { status: 403 }
      );
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiration date if provided
    let expiresAt;
    if (expiresIn) {
      const now = new Date();
      switch (expiresIn) {
        case '1hour':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case '1day':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '7days':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          // No expiration
          break;
      }
    }

    // Add share link to document
    const shareLink = {
      token,
      role,
      expiresAt,
      isActive: true,
      createdAt: new Date(),
    };

    // Initialize shareLinks array if it doesn't exist
    if (!document.shareLinks) {
      document.shareLinks = [];
    }
    document.shareLinks.push(shareLink);
    await document.save();

    const shareUrl = `${request.nextUrl.origin}/shared/${token}`;

    return NextResponse.json({
      message: 'Share link created successfully',
      shareLink: {
        token,
        url: shareUrl,
        role,
        expiresAt,
        createdAt: shareLink.createdAt,
      },
    });
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get all share links for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find the current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the document
    const document = await DocumentModel.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if current user is owner
    const currentUserCollaboration = document.collaborators.find(
      (collab: { userId: { toString(): string }; role: string }) => 
        collab.userId.toString() === currentUser._id.toString()
    );

    if (!currentUserCollaboration || currentUserCollaboration.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only document owners can view share links' },
        { status: 403 }
      );
    }

    // Filter out expired links and add URLs
    const shareLinks = document.shareLinks || [];
    const activeLinks = shareLinks
      .filter((link: any) => {
        if (!link.isActive) return false;
        if (link.expiresAt && new Date() > link.expiresAt) return false;
        return true;
      })
      .map((link: any) => ({
        token: link.token,
        url: `${request.nextUrl.origin}/shared/${link.token}`,
        role: link.role,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
      }));

    return NextResponse.json({ shareLinks: activeLinks });
  } catch (error) {
    console.error('Get share links error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete/deactivate a share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the document
    const document = await DocumentModel.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if current user is owner
    const currentUserCollaboration = document.collaborators.find(
      (collab: { userId: { toString(): string }; role: string }) => 
        collab.userId.toString() === currentUser._id.toString()
    );

    if (!currentUserCollaboration || currentUserCollaboration.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only document owners can delete share links' },
        { status: 403 }
      );
    }

    // Find and deactivate the share link
    const shareLinks = document.shareLinks || [];
    const shareLink = shareLinks.find((link: any) => link.token === token);

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    shareLink.isActive = false;
    await document.save();

    return NextResponse.json({ message: 'Share link deleted successfully' });
  } catch (error) {
    console.error('Delete share link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}