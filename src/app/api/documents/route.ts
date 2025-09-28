import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '../../../../lib/dbConnect';
import DocumentModel from '../../../../models/Document';
import User from '../../../../models/User';

export async function GET(request: NextRequest) {
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

    // Find documents where user is a collaborator
    const documents = await DocumentModel.find({
      'collaborators.userId': user._id,
    })
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 })
      .select('title fileType createdAt updatedAt collaborators createdBy');

    const documentsWithUserRole = documents.map(doc => {
      const userCollaboration = doc.collaborators.find(
        collab => collab.userId.toString() === user._id.toString()
      );

      return {
        id: doc._id,
        title: doc.title,
        fileType: doc.fileType,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        createdBy: doc.createdBy,
        userRole: userCollaboration?.role || 'viewer',
        collaboratorCount: doc.collaborators.length,
      };
    });

    return NextResponse.json({
      documents: documentsWithUserRole,
    });
  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}