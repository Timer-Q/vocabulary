export interface MediaUploadUrl {
  bucket: string;
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
}
