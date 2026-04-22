// Database related types
export interface Option {
  id: number;
  optionKey: string;
  optionValue: string | null;
}

export interface CreateOptionInput {
  optionKey: string;
  optionValue?: string | null;
}

export interface UpdateOptionInput {
  optionValue?: string | null;
}

export interface MediaLibrary {
  id: number;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  title?: string | null;
  description?: string | null;
  uploadedBy?: number | null;
  createdAt: Date;
}

export interface Store {
  id: number;
  storeName: string;
  slug: string;
  description?: string | null;
  ownerUserId: number;
  logoImageId?: number | null;
  bannerImageId?: number | null;
  status: boolean;
  createdAt: Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  imageId?: number | null;
  bannerImageId?: number | null;
  parentCategoryId?: number | null;
  createdAt: Date;
}
