import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// GCS client with Replit sidecar credentials (from blueprint)
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

// Extract bucket name from PRIVATE_OBJECT_DIR (format: /bucket-name or bucket-name)
function getBucketName(): string {
  const dir = process.env.PRIVATE_OBJECT_DIR || "";
  const cleaned = dir.replace(/^\/+/, "").split("/")[0];
  if (!cleaned) {
    throw new Error("PRIVATE_OBJECT_DIR not set or invalid");
  }
  return cleaned;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  async getObjectFile(objectPath: string): Promise<{ file: File; objectName: string }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const pathParts = objectPath.slice(1).split("/");
    if (pathParts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = pathParts.slice(1).join("/");
    const bucketName = getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(entityId);
    
    console.log('[ObjectStorage] getObjectFile:', { bucketName, entityId });
    const [exists] = await file.exists();
    
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    
    return { file, objectName: entityId };
  }

  async downloadObject(objectInfo: { file?: File; objectName: string }, res: Response, cacheTtlSec: number = 3600) {
    try {
      let file = objectInfo.file;
      if (!file) {
        const bucketName = getBucketName();
        const bucket = objectStorageClient.bucket(bucketName);
        file = bucket.file(objectInfo.objectName);
      }

      console.log('[ObjectStorage] downloadObject:', objectInfo.objectName);
      
      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Determine content type
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
        console.error("[ObjectStorage] Stream error:", err);
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
    console.log('[ObjectStorage] Backend: @google-cloud/storage with sidecar');
    console.log('[ObjectStorage] PRIVATE_OBJECT_DIR:', process.env.PRIVATE_OBJECT_DIR || 'NOT SET');
    
    try {
      const bucketName = getBucketName();
      console.log('[ObjectStorage] Testing bucket:', bucketName);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const [files] = await bucket.getFiles({ maxResults: 1 });
      
      console.log('[ObjectStorage] Connection OK, sample files:', files.length);
      return { ok: true, bucketInfo: { bucket: bucketName, sampleCount: files.length } };
    } catch (err: any) {
      console.error('[ObjectStorage] Connection test exception:', err.message);
      console.error('[ObjectStorage] Error code:', err.code);
      console.error('[ObjectStorage] Error status:', err.response?.status);
      console.error('[ObjectStorage] Error data:', JSON.stringify(err.response?.data || err.errors || {}, null, 2));
      return { 
        ok: false, 
        error: { 
          message: err.message, 
          code: err.code,
          status: err.response?.status,
          errors: err.errors
        } 
      };
    }
  }

  async uploadBuffer(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    console.log('[ObjectStorage] ====== UPLOAD START ======');
    console.log('[ObjectStorage] backend=@google-cloud/storage with sidecar');
    console.log('[ObjectStorage] PRIVATE_OBJECT_DIR:', process.env.PRIVATE_OBJECT_DIR || 'NOT SET');
    console.log('[ObjectStorage] NODE_ENV:', process.env.NODE_ENV);
    console.log('[ObjectStorage] APP_ENV:', process.env.APP_ENV);
    console.log('[ObjectStorage] File:', { filename, contentType, bufferSize: buffer.length });
    
    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid buffer: empty or undefined');
    }
    
    const objectId = randomUUID();
    const extension = filename.includes('.') ? filename.split('.').pop() : 'jpg';
    const objectName = `artworks/${objectId}.${extension}`;

    console.log('[ObjectStorage] Target objectName:', objectName);
    
    try {
      const bucketName = getBucketName();
      console.log('[ObjectStorage] Using bucket:', bucketName);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Direct upload using GCS save method
      console.log('[ObjectStorage] Starting direct upload...');
      await file.save(buffer, {
        contentType: contentType,
        resumable: false,
      });
      
      console.log('[ObjectStorage] Upload SUCCESS:', objectName);
    } catch (err: any) {
      console.error('[ObjectStorage] Upload EXCEPTION:', err.message);
      console.error('[ObjectStorage] Full error:', {
        message: err.message,
        code: err.code,
        errors: err.errors,
        response: err.response?.data
      });
      throw new Error(`Storage write failed: ${err.message}`);
    }

    const resultPath = `/objects/${objectName}`;
    console.log('[ObjectStorage] uploadBuffer END - returning:', resultPath);
    return resultPath;
  }
}
