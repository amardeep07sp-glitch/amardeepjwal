import { serializeMediaRef } from '../media/media.serializer.js';

export const serializeBanner = (banner) => {
  const plain = typeof banner.toObject === 'function' ? banner.toObject() : banner;

  return {
    id: plain._id,
    title: plain.title,
    subtitle: plain.subtitle,
    description: plain.description,
    ctaLabel: plain.ctaLabel,
    primaryMedia: serializeMediaRef(plain.primaryMedia),
    linkUrl: plain.linkUrl,
    altText: plain.altText,
    position: plain.position,
    order: plain.order,
    isActive: plain.isActive,
    startDate: plain.startDate,
    endDate: plain.endDate,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeBannerList = (banners) => banners.map(serializeBanner);
