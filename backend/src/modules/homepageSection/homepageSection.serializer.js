import { serializeMediaRef } from '../media/media.serializer.js';

const serializeBannerRef = (banner) => {
  if (!banner) return null;
  const plain = typeof banner.toObject === 'function' ? banner.toObject() : banner;
  return {
    id: plain._id,
    title: plain.title,
    primaryMedia: serializeMediaRef(plain.primaryMedia),
    linkUrl: plain.linkUrl,
  };
};

export const serializeHomepageSection = (section) => {
  const plain = typeof section.toObject === 'function' ? section.toObject() : section;

  return {
    id: plain._id,
    internalTitle: plain.internalTitle,
    type: plain.type,
    banner: serializeBannerRef(plain.banner),
    heading: plain.heading,
    body: plain.body,
    primaryMedia: serializeMediaRef(plain.primaryMedia),
    order: plain.order,
    isActive: plain.isActive,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeHomepageSectionList = (sections) => sections.map(serializeHomepageSection);
