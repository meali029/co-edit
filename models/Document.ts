import mongoose, { Document, Schema } from 'mongoose';

export interface ICollaborator {
  userId: mongoose.Types.ObjectId;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: Date;
}

export interface IShareLink {
  token: string;
  role: 'editor' | 'viewer';
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface IDocument extends Document {
  title: string;
  originalFileName?: string;
  fileType: 'docx' | 'pdf' | 'html';
  filePath?: string;
  content: string; // HTML content for editing
  yjsSnapshot?: Buffer; // Yjs document snapshot
  collaborators: ICollaborator[];
  shareLinks: IShareLink[];
  isPublic: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: mongoose.Types.ObjectId;
}

const CollaboratorSchema = new Schema<ICollaborator>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'editor', 'viewer'],
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const ShareLinkSchema = new Schema<IShareLink>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['editor', 'viewer'],
    required: true,
  },
  expiresAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DocumentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
    },
    fileType: {
      type: String,
      enum: ['docx', 'pdf', 'html'],
      required: true,
    },
    filePath: {
      type: String,
    },
    content: {
      type: String,
      default: '',
    },
    yjsSnapshot: {
      type: Buffer,
    },
    collaborators: [CollaboratorSchema],
    shareLinks: [ShareLinkSchema],
    isPublic: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
DocumentSchema.index({ createdBy: 1 });
DocumentSchema.index({ 'collaborators.userId': 1 });
DocumentSchema.index({ 'collaborators.email': 1 });

const DocumentModel = mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

export default DocumentModel;