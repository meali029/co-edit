import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '../../../../../../lib/dbConnect';
import DocumentModel from '../../../../../../models/Document';
import User from '../../../../../../models/User';
import { DocumentProcessor } from '../../../../../../lib/documentProcessor';

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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'docx';

    if (!['docx', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be docx or pdf' },
        { status: 400 }
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
    const document = await DocumentModel.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this document
    const userCollaboration = document.collaborators.find(
      (collab: { userId: { toString(): string }; permission: string }) => 
        collab.userId.toString() === user._id.toString()
    );

    if (!userCollaboration) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate the export
    let buffer: Buffer;
    let mimeType: string;
    let fileName: string;

    if (format === 'docx') {
      buffer = await DocumentProcessor.generateDocx(document.content, document.title);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileName = `${document.title}.docx`;
    } else {
      buffer = DocumentProcessor.generatePdf(document.content);
      mimeType = 'application/pdf';
      fileName = `${document.title}.pdf`;
    }

    return new NextResponse(buffer as BodyInit, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}