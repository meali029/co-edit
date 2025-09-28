import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '../../../../../lib/dbConnect';
import DocumentModel from '../../../../../models/Document';
import User from '../../../../../models/User';

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

    // Find the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the document
    const document = await DocumentModel.findById(id)
      .populate('collaborators.userId', 'name email')
      .populate('createdBy', 'name email');

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this document
    const userCollaboration = document.collaborators.find(
      (collab: { userId: { _id: { toString(): string } }; permission: string }) => 
        collab.userId._id.toString() === user._id.toString()
    );

    if (!userCollaboration) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      document: {
        id: document._id,
        title: document.title,
        content: document.content,
        fileType: document.fileType,
        originalFileName: document.originalFileName,
        collaborators: document.collaborators,
        createdBy: document.createdBy,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        userRole: userCollaboration.role,
      },
    });
  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { content, yjsSnapshot } = await request.json();

    await dbConnect();

    // Find the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
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

    // Check if user has edit access
    const userCollaboration = document.collaborators.find(
      (collab: { userId: { toString(): string }; role: string }) => 
        collab.userId.toString() === user._id.toString()
    );

    if (!userCollaboration || !['owner', 'editor'].includes(userCollaboration.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update document
    const updatedDocument = await DocumentModel.findByIdAndUpdate(
      id,
      {
        content: content || document.content,
        yjsSnapshot: yjsSnapshot ? Buffer.from(yjsSnapshot, 'base64') : document.yjsSnapshot,
        lastModifiedBy: user._id,
      },
      { new: true }
    );

    return NextResponse.json({
      message: 'Document updated successfully',
      document: {
        id: updatedDocument!._id,
        updatedAt: updatedDocument!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Document update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}