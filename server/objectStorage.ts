import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Detect which backend to use
// IMPORTANT: Replit native SDK (@replit/object-storage) has a bug where uploadFromBytes only saves 1 byte
// Always use GCS approach which works correctly with the sidecar credentials
// Priority: PRIVATE_OBJECT_DIR (GCS via sidecar - WORKS) > REPLIT_OBJECT_STORAGE_BUCKET_ID (native SDK - BROKEN)
const USE_REPLIT_NATIVE = false; // Disabled due to SDK bug - only saves 1 byte
const HAS_GCS_CONFIG = !!process.env.PRIVATE_OBJECT_DIR || !!process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID;
const STORAGE_CONFIGURED = HAS_GCS_CONFIG;

// Native Replit Object Storage client (zero config, auto-connects)
let replitClient: any = null;

// Lazy initialization of Replit client
async function getReplitClient(): Promise<any> {
  if (!USE_REPLIT_NATIVE) return null;
  if (replitClient) return replitClient;
  
  try {
    // Dynamic import for ESM compatibility
    const { Client } = await import("@replit/object-storage");
    replitClient = new Client();
    return replitClient;
  } catch (err) {
    console.error('[ObjectStorage] Failed to load @replit/object-storage:', err);
    return null;
  }
}

// GCS client with Replit sidecar credentials (fallback for staging/dev)
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

// Get bucket name for GCS via sidecar
function getGcsBucketName(): string {
  // First try PRIVATE_OBJECT_DIR (standard approach)
  const dir = process.env.PRIVATE_OBJECT_DIR || "";
  let cleaned = dir.replace(/^\/+/, "").split("/")[0];
  
  // If not found, try extracting from REPLIT_OBJECT_STORAGE_BUCKET_ID
  if (!cleaned && process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID) {
    // The bucket ID often matches the bucket name pattern
    cleaned = process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID;
  }
  
  if (!cleaned) {
    throw new Error("Storage not configured. Neither REPLIT_OBJECT_STORAGE_BUCKET_ID nor PRIVATE_OBJECT_DIR is set.");
  }
  return cleaned;
}

// Check if storage is configured
export function isStorageConfigured(): boolean {
  return STORAGE_CONFIGURED;
}

// Export backend info for health checks
export function getStorageBackend(): string {
  // Always use GCS via sidecar (Replit native SDK is broken)
  return "@google-cloud/storage";
}

export function getStorageConfig() {
  const replitBucket = process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID || 'NOT_SET';
  const privateDir = process.env.PRIVATE_OBJECT_DIR || 'NOT_SET';
  const backend = getStorageBackend();
  
  return {
    backend,
    replitBucketId: replitBucket !== 'NOT_SET' ? 'SET' : 'NOT_SET',
    replitBucketIdValue: replitBucket.substring(0, 50),
    privateObjectDir: privateDir !== 'NOT_SET' ? 'SET' : 'NOT_SET',
    privateObjectDirValue: privateDir.substring(0, 50),
    resolvedSource: USE_REPLIT_NATIVE ? 'REPLIT_OBJECT_STORAGE_BUCKET_ID' : 'PRIVATE_OBJECT_DIR',
  };
}

// Log storage configuration on module load
const logStorageConfig = () => {
  const config = getStorageConfig();
  console.log(`[Storage] backend=${config.backend} source=${config.resolvedSource} replitBucket=${config.replitBucketIdValue.substring(0, 30)} privateDir=${config.privateObjectDirValue.substring(0, 30)}`);
};

logStorageConfig();

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  async getObjectByStorageKey(storageKey: string): Promise<{ file: File | null; objectName: string }> {
    if (!storageKey || storageKey.trim() === '') {
      throw new ObjectNotFoundError();
    }
    
    // Use GCS via sidecar (Replit native SDK is disabled due to bug)
    const bucketName = getGcsBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(storageKey);
    
    console.log('[ObjectStorage] getObjectByStorageKey (GCS):', { bucketName, storageKey });
    const [exists] = await file.exists();
    
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return { file, objectName: storageKey };
  }

  async getObjectFile(objectPath: string): Promise<{ file: File | null; objectName: string }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const pathParts = objectPath.slice(1).split("/");
    if (pathParts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = pathParts.slice(1).join("/");
    
    // Use GCS via sidecar (Replit native SDK is disabled due to bug)
    const bucketName = getGcsBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(entityId);
    
    console.log('[ObjectStorage] getObjectFile (GCS):', { bucketName, entityId });
    const [exists] = await file.exists();
    
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return { file, objectName: entityId };
  }

  async downloadObject(objectInfo: { file?: File | null; objectName: string }, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Use GCS via sidecar (Replit native SDK is disabled due to bug)
      let file = objectInfo.file;
      if (!file) {
        const bucketName = getGcsBucketName();
        const bucket = objectStorageClient.bucket(bucketName);
        file = bucket.file(objectInfo.objectName);
      }

      console.log('[ObjectStorage] downloadObject (GCS):', objectInfo.objectName);
      
      const [metadata] = await file.getMetadata();
      
      const ext = objectInfo.objectName.split('.').pop()?.toLowerCase() || '';
      const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'txt': 'text/plain',
      };
      const contentType = metadata.contentType || contentTypes[ext] || 'application/octet-stream';
      
      res.set({
        "Content-Type": contentType,
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("[ObjectStorage] GCS stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("[ObjectStorage] Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async testConnection(): Promise<{ ok: boolean; error?: any; bucketInfo?: any }> {
    console.log('[ObjectStorage] ====== CONNECTION TEST ======');
    console.log('[ObjectStorage] Backend:', getStorageBackend());
    console.log('[ObjectStorage] REPLIT_OBJECT_STORAGE_BUCKET_ID:', process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID ? 'SET' : 'NOT SET');
    console.log('[ObjectStorage] PRIVATE_OBJECT_DIR:', process.env.PRIVATE_OBJECT_DIR || 'NOT SET');
    
    try {
      // Use GCS via sidecar (Replit native SDK is disabled due to bug)
      const bucketName = getGcsBucketName();
      console.log('[ObjectStorage] Testing GCS bucket:', bucketName);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const [files] = await bucket.getFiles({ maxResults: 1 });
      
      console.log('[ObjectStorage] GCS connection OK, sample files:', files.length);
      return { 
        ok: true, 
        bucketInfo: { 
          backend: '@google-cloud/storage',
          bucket: bucketName, 
          sampleCount: files.length 
        } 
      };
    } catch (err: any) {
      console.error('[ObjectStorage] Connection test exception:', err.message);
      return { 
        ok: false, 
        error: { 
          message: err.message, 
          code: err.code,
          status: err.response?.status,
          backend: getStorageBackend()
        } 
      };
    }
  }

  async uploadBuffer(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    console.log('[ObjectStorage] ====== UPLOAD START ======');
    console.log('[ObjectStorage] backend:', getStorageBackend());
    console.log('[ObjectStorage] File:', { filename, contentType, bufferSize: buffer.length });
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid buffer: empty or undefined');
    }
    
    const objectId = randomUUID();
    const extension = filename.includes('.') ? filename.split('.').pop() : 'jpg';
    const objectName = `artworks/${objectId}.${extension}`;

    console.log('[ObjectStorage] Target objectName:', objectName);
    
    try {
      // Use GCS via sidecar (Replit native SDK is disabled due to bug)
      const bucketName = getGcsBucketName();
      console.log('[ObjectStorage] Using GCS bucket:', bucketName);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      console.log('[ObjectStorage] Starting GCS upload...');
      await file.save(buffer, {
        contentType: contentType,
        resumable: false,
      });
      
      console.log('[ObjectStorage] GCS upload SUCCESS:', objectName, 'bytes:', buffer.length);
    } catch (err: any) {
      console.error('[ObjectStorage] Upload EXCEPTION:', err.message);
      throw new Error(`Storage write failed: ${err.message}`);
    }

    const resultPath = `/objects/${objectName}`;
    console.log('[ObjectStorage] uploadBuffer END - returning:', resultPath);
    return resultPath;
  }

  async deleteObject(storageKey: string): Promise<void> {
    console.log('[ObjectStorage] ====== DELETE START ======');
    console.log('[ObjectStorage] backend:', getStorageBackend());
    console.log('[ObjectStorage] Key:', storageKey);
    
    if (!storageKey || storageKey.trim() === '') {
      throw new Error('Invalid storage key: empty or undefined');
    }
    
    try {
      // Use GCS via sidecar (Replit native SDK is disabled due to bug)
      const bucketName = getGcsBucketName();
      console.log('[ObjectStorage] Using GCS delete for bucket:', bucketName);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(storageKey);
      
      console.log('[ObjectStorage] Starting GCS delete...');
      await file.delete();
      
      console.log('[ObjectStorage] GCS delete SUCCESS:', storageKey);
    } catch (err: any) {
      console.error('[ObjectStorage] Delete EXCEPTION:', err.message);
      throw new Error(`Storage delete failed: ${err.message}`);
    }
    
    console.log('[ObjectStorage] deleteObject END - deleted:', storageKey);
  }
}
