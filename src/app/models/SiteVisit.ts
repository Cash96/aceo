import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ISiteVisit extends Document {
  user: string;
  url: string;
  rootDomain: string;
  accessedAt: Date;
  timeOnSite: number;
  rawTitle: string;
  genTitle: string;
  genDescription: string;
  genSubject: string;
}

const SiteVisitSchema = new Schema<ISiteVisit>({
  user: { type: String, required: true },
  url: { type: String, required: true },
  rootDomain: { type: String, required: true },
  accessedAt: { type: Date, required: true },
  timeOnSite: { type: Number, required: true },
  rawTitle: { type: String },
  genTitle: { type: String },
  genDescription: { type: String },
  genSubject: { type: String },
});

const SiteVisit =
  models.SiteVisit || model<ISiteVisit>('SiteVisit', SiteVisitSchema);

export default SiteVisit;
