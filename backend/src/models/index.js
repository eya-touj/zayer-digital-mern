const mongoose = require('mongoose');

const { Schema } = mongoose;
const timestamps = { timestamps: true, versionKey: false };

const AdminSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 190 },
  passwordHash: { type: String, required: true, select: false },
  active: { type: Boolean, default: true },
}, timestamps);

const ItemSchema = new Schema({
  page: { type: String, required: true, trim: true, index: true },
  section: { type: String, required: true, trim: true, index: true },
  sort_order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  title_en: { type: String, default: '' }, title_fr: { type: String, default: '' },
  sub_en: { type: String, default: '' }, sub_fr: { type: String, default: '' },
  text_en: { type: String, default: '' }, text_fr: { type: String, default: '' },
  meta: { type: String, default: '' }, image_url: { type: String, default: '' }, link_url: { type: String, default: '' },
}, { ...timestamps, strict: false });

const JobSchema = new Schema({
  sort_order: { type: Number, default: 0 }, visible: { type: Boolean, default: true },
  dept: { type: String, default: '' }, title_en: { type: String, required: true }, title_fr: { type: String, required: true },
  location: { type: String, default: 'Tunis, Tunisia' }, location_en: { type: String, default: '' }, location_fr: { type: String, default: '' },
  experience: { type: String, default: '' }, experience_en: { type: String, default: '' }, experience_fr: { type: String, default: '' },
  description_en: { type: String, default: '' }, description_fr: { type: String, default: '' },
}, timestamps);

const MessageSchema = new Schema({
  kind: { type: String, enum: ['contact', 'application'], default: 'contact', index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 190 },
  phone: { type: String, default: '', maxlength: 60 }, subject: { type: String, default: '', maxlength: 255 },
  body: { type: String, required: true, maxlength: 5000 }, file_url: { type: String, default: '', maxlength: 500 },
  status: { type: String, enum: ['new', 'read', 'done', 'reviewed', 'accepted', 'rejected'], default: 'new', index: true },
}, timestamps);

const SettingSchema = new Schema({
  skey: { type: String, required: true, unique: true, trim: true },
  value_en: { type: String, default: '' }, value_fr: { type: String, default: '' },
}, timestamps);

const BlockSchema = new Schema({
  bkey: { type: String, required: true, unique: true, trim: true }, page: { type: String, required: true, index: true },
  value_en: { type: String, default: '' }, value_fr: { type: String, default: '' }, href: { type: String, default: '' },
  src: { type: String, default: '' }, alt: { type: String, default: '' }, visible: { type: Boolean, default: true },
}, timestamps);

const ComponentSchema = new Schema({
  page: { type: String, enum: ['home', 'services', 'about', 'careers', 'contact', 'formation', 'international', 'portfolio', 'devis'], required: true, index: true },
  title: { type: String, default: '', maxlength: 160 }, placement: { type: String, enum: ['top', 'bottom'], default: 'bottom' },
  sort_order: { type: Number, default: 0 }, visible: { type: Boolean, default: true },
  html_en: { type: String, default: '' }, html_fr: { type: String, default: '' }, css: { type: String, default: '' },
}, timestamps);

const PortfolioItemSchema = new Schema({
  seed_key: { type: String, default: '', index: true },
  tab_type: { type: String, required: true, index: true }, title: { type: String, required: true },
  title_en: { type: String, default: '' }, title_fr: { type: String, default: '' },
  description_en: { type: String, default: '' }, description_fr: { type: String, default: '' },
  media_url: { type: String, default: '' }, link_url: { type: String, default: '' }, category: { type: String, default: '' },
  category_en: { type: String, default: '' }, category_fr: { type: String, default: '' },
  sort_order: { type: Number, default: 0 }, visible: { type: Boolean, default: true },
}, timestamps);

const ContactBoxSchema = new Schema({
  label: { type: String, required: true }, label_en: { type: String, default: '' }, label_fr: { type: String, default: '' },
  value: { type: String, required: true }, value_en: { type: String, default: '' }, value_fr: { type: String, default: '' },
  icon: { type: String, default: 'mail' }, visible: { type: Boolean, default: true }, sort_order: { type: Number, default: 0 },
}, timestamps);
const ServiceItemSchema = new Schema({
  label: { type: String, required: true }, label_en: { type: String, default: '' }, label_fr: { type: String, default: '' },
  description: { type: String, default: '' }, description_en: { type: String, default: '' }, description_fr: { type: String, default: '' },
  category_en: { type: String, default: '' }, category_fr: { type: String, default: '' },
  price: { type: Number, min: 0, default: 0 }, visible: { type: Boolean, default: true }, sort_order: { type: Number, default: 0 },
}, timestamps);
const SocialItemSchema = new Schema({ label: { type: String, required: true }, label_en: { type: String, default: '' }, label_fr: { type: String, default: '' }, icon: { type: String, default: 'globe' }, url: { type: String, default: '' }, visible: { type: Boolean, default: true }, sort_order: { type: Number, default: 0 } }, timestamps);
const AuditLogSchema = new Schema({
  who: { type: String, required: true, maxlength: 190, index: true },
  action: { type: String, required: true, maxlength: 40 },
  resource: { type: String, required: true, maxlength: 80, index: true },
  recordId: { type: String, default: '', maxlength: 120 },
  date: { type: Date, default: Date.now, index: true },
}, { ...timestamps, strict: true });

const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);

module.exports = {
  Admin: model('Admin', AdminSchema), Item: model('Item', ItemSchema), Job: model('Job', JobSchema),
  Message: model('Message', MessageSchema), Setting: model('Setting', SettingSchema), Block: model('Block', BlockSchema),
  Component: model('Component', ComponentSchema), PortfolioItem: model('PortfolioItem', PortfolioItemSchema),
  ContactBox: model('ContactBox', ContactBoxSchema), ServiceItem: model('ServiceItem', ServiceItemSchema), SocialItem: model('SocialItem', SocialItemSchema),
  AuditLog: model('AuditLog', AuditLogSchema),
};
