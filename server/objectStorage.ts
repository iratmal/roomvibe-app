import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Detect which backend to use
// Priority: REPLIT_OBJECT_STORAGE_BUCKET_ID (native Replit) > PRIVATE_OBJECT_DIR (GCS fallback)
const USE_REPLIT_NATIVE = !!process.env.REPLIT_OBJECT_STORAGE_BUCKET_ID;
const HAS_GCS_CONFIG = !!process.env.PRIVATE_OBJECT_DIR;
const STORAGE_CONFIGURED = USE_REPLIT_NATIVE || HAS_GCS_CONFIG;

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

// Get bucket name for GCS fallback
function getGcsBucketName(): string {
  const dir = process.env.PRIVATE_OBJECT_DIR || "";
  const cleaned = dir.replace(/^\/+/, "").split("/")[0];
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
  return USE_REPLIT_NATIVE ? "replit-object-storage" : "@google-cloud/storage";
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

  async getObjectFile(objectPath: string): Promise<{ file: File | null; objectName: string }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const pathParts = objectPath.slice(1).split("/");
    if (pathParts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = pathParts.slice(1).join("/");
    
    const client = await getReplitClient();
    if (USE_REPLIT_NATIVE && client) {
      // For Replit native, check if object exists
      // exists() returns { ok: boolean, value: boolean } where value indicates existence
      const existsResult = await client.exists(entityId);
      console.log('[ObjectStorage] getObjectFile (Replit):', { entityId, existsResult });
      
      if (!existsResult.ok) {
        console.error('[ObjectStorage] exists() call failed:', existsResult.error);
        throw new ObjectNotFoundError();
      }
      if (!existsResult.value) {
        console.error('[ObjectStorage] Object does not exist:', entityId);
        throw new ObjectNotFoundError();
      }
      return { file: null, objectName: entityId };
    }
    
    // GCS fallback
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
      const client = await getReplitClient();
      if (USE_REPLIT_NATIVE && client) {
        // Use Replit native SDK
        console.log('[ObjectStorage] downloadObject (Replit):', objectInfo.objectName);
        
        const { ok, value: stream, error } = await client.downloadAsStream(objectInfo.objectName);
        
        if (!ok || !stream) {
          console.error('[ObjectStorage] Replit download error:', error);
          if (!res.headersSent) {
            res.status(404).json({ error: "File not found" });
          }
          return;
        }
        
        // Determine content type from extension
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
        const contentType = contentTypes[ext] || 'application/octet-stream';
        
        res.set({
          "Content-Type": contentType,
          "Cache-Control": `public, max-age=${cacheTtlSec}`,
        });

        stream.pipe(res);
        return;
      }
      
      // GCS fallback
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
      const client = await getReplitClient();
      if (USE_REPLIT_NATIVE && client) {
        // Test Replit native connection
        const { ok, value, error } = await client.list();
        
        if (!ok) {
          console.error('[ObjectStorage] Replit connection test failed:', error);
          return { 
            ok: false, 
            error: { 
              message: error?.message || 'List failed',
              backend: 'replit-object-storage'
            } 
          };
        }
        
        console.log('[ObjectStorage] Replit connection OK, objects:', value?.length || 0);
        return { 
          ok: true, 
          bucketInfo: { 
            backend: 'replit-object-storage',
            objectCount: value?.length || 0 
          } 
        };
      }
      
      // GCS fallback test
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
      const client = await getReplitClient();
      if (USE_REPLIT_NATIVE && client) {
        // Use Replit native SDK
        console.log('[ObjectStorage] Using Replit native upload...');
        const { ok, error } = await client.uploadFromBytes(objectName, buffer);
        
        if (!ok) {
          console.error('[ObjectStorage] Replit upload failed:', error);
          throw new Error(`Replit storage write failed: ${error?.message || 'Unknown error'}`);
        }
        
        console.log('[ObjectStorage] Replit upload SUCCESS:', objectName);
      } else {
        // GCS fallback
        const bucketName = getGcsBucketName();
        console.log('[ObjectStorage] Using GCS bucket:', bucketName);
        
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        
        console.log('[ObjectStorage] Starting GCS upload...');
        await file.save(buffer, {
          contentType: contentType,
          resumable: false,
        });
        
        console.log('[ObjectStorage] GCS upload SUCCESS:', objectName);
      }
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
      const client = await getReplitClient();
      if (USE_REPLIT_NATIVE && client) {
        console.log('[ObjectStorage] Using Replit native delete...');
        const { ok, error } = await client.delete(storageKey);
        
        if (!ok) {
          console.error('[ObjectStorage] Replit delete failed:', error);
          throw new Error(`Replit storage delete failed: ${error?.message || 'Unknown error'}`);
        }
        
        console.log('[ObjectStorage] Replit delete SUCCESS:', storageKey);
      } else {
        const bucketName = getGcsBucketName();
        console.log('[ObjectStorage] Using GCS delete for bucket:', bucketName);
        
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(storageKey);
        
        console.log('[ObjectStorage] Starting GCS delete...');
        await file.delete();
        
        console.log('[ObjectStorage] GCS delete SUCCESS:', storageKey);
      }
    } catch (err: any) {
      console.error('[ObjectStorage] Delete EXCEPTION:', err.message);
      throw new Error(`Storage delete failed: ${err.message}`);
    }
    
    console.log('[ObjectStorage] deleteObject END - deleted:', storageKey);
  }
}
