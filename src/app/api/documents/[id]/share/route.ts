import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../../lib/dbConnect';
import DocumentModel from '../../../../../../models/Document';
import User from '../../../../../../models/User';

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

    const { email, role = 'viewer' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

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
        { error: 'Only document owners can share documents' },
        { status: 403 }
      );
    }

    // Find the user to be added
    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return NextResponse.json(
        { error: 'User with this email does not exist' },
        { status: 404 }
      );
    }

    // Check if user is already a collaborator
    const existingCollaboration = document.collaborators.find(
      (collab: { userId: { toString(): string }; role: string }) => 
        collab.userId.toString() === userToAdd._id.toString()
    );

    if (existingCollaboration) {
      // Update role if user already exists
      existingCollaboration.role = role;
    } else {
      // Add new collaborator
      document.collaborators.push({
        userId: userToAdd._id,
        email: userToAdd.email,
        role,
        addedAt: new Date(),
      });
    }

    await document.save();

    return NextResponse.json({
      message: 'Document shared successfully',
      collaborator: {
        userId: userToAdd._id,
        email: userToAdd.email,
        name: userToAdd.name,
        role,
      },
    });
  } catch (error) {
    console.error('Share document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}