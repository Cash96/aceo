import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IFileRecord extends Document {
  name: string;
  googleId: string;
  openaiId?: string;
  lastModified: Date;
  department: string;
  vectorStoreId: string;
  uploadedAt?: Date;
}

const FileRecordSchema = new Schema<IFileRecord>({
  name: { type: String, required: true },
  googleId: { type: String, required: true, unique: true },
  openaiId: { type: String },
  lastModified: { type: Date, required: true },
  department: { type: String, required: true },
  vectorStoreId: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

// Prevent model overwrite in dev (important with Next.js hot reload)
export const FileRecord = models.FileRecord || model<IFileRecord>('FileRecord', FileRecordSchema);

export default FileRecord;
