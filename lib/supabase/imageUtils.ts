import { createClient } from './server';

/**
 * Converts a Supabase storage path or URL to a signed URL
 * Handles both public and private buckets
 */
export async function getImageUrl(storedUrl: string): Promise<string> {
  if (!storedUrl) return '';

  // If it's a storage path (format: supabase://bucket-name/file-path)
  if (storedUrl.startsWith('supabase://')) {
    const path = storedUrl.replace('supabase://', '');
    const [bucketName, ...pathParts] = path.split('/');
    const filePath = pathParts.join('/');

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error || !data) {
      console.error('Failed to create signed URL:', error);
      return '';
    }

    return data.signedUrl;
  }

  // If it's already a Supabase storage URL, try to extract path and create signed URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && storedUrl.includes(supabaseUrl)) {
    try {
      // Extract bucket and file path from URL
      // Format: https://project.supabase.co/storage/v1/object/public/bucket-name/file-path
      // or: https://project.supabase.co/storage/v1/object/sign/bucket-name/file-path
      const urlMatch = storedUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
      if (urlMatch) {
        const [, bucketName, filePath] = urlMatch;
        // Decode URL-encoded path
        const decodedPath = decodeURIComponent(filePath);
        const supabase = await createClient();
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(decodedPath, 3600);

        if (!error && data) {
          return data.signedUrl;
        }
      }
    } catch (error) {
      // If URL parsing fails, fall through to return original URL
      console.error('Failed to parse Supabase URL:', error);
    }
  }

  // For external URLs (from recipe imports), return as-is
  return storedUrl;
}

/**
 * Converts multiple image URLs (useful for batch processing)
 */
export async function getImageUrls(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(url => getImageUrl(url)));
}
