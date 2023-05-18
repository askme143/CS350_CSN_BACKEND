export const storageConfig = {
  projectId: process.env['GCP_PROJECT_ID'],
  clientEmail: process.env['GCP_CLIENT_EMAIL'],
  privateKey: process.env['GCP_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
  mediaBucket: process.env['GCP_STORAGE_MEDIA_BUCKET'] as string,
};
