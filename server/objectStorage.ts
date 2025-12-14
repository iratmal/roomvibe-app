import { Client } from "@replit/object-storage";
import { Response } from "express";
import { randomUUID } from "crypto";

// Get bucket ID from PRIVATE_OBJECT_DIR (format: /bucket-name or bucket-name)
function getBucketId(): string {
  const dir = process.env.PRIVATE_OBJECT_DIR || "";
  const cleaned = dir.replace(/^\/+/, "").split("/")[0];
  if (!cleaned) {
    throw new Error("PRIVATE_OBJECT_DIR not set or invalid");
  }
  return cleaned;
}

// Lazy-init client to allow env vars to be loaded first
let _replitStorageClient: Client | null = null;
function getReplitStorageClient(): Client {
  if (!_replitStorageClient) {
    const bucketId = getBucketId();
    console.log('[ObjectStorage] Initializing Replit client with bucket:', bucketId);
    _replitStorageClient = new Client({ bucketId });
  }
  return _replitStorageClient;
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

  async getObjectFile(objectPath: string): Promise<{ objectName: string; exists: boolean }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const pathParts = objectPath.slice(1).split("/");
    if (pathParts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = pathParts.slice(1).join("/");
    
    const { ok, value: exists } = await getReplitStorageClient().exists(entityId);
    if (!ok || !exists) {
      throw new ObjectNotFoundError();
    }
    
    return { objectName: entityId, exists: true };
  }

  async downloadObject(objectInfo: { objectName: string }, res: Response, cacheTtlSec: number = 3600) {
    try {
      const stream = getReplitStorageClient().downloadAsStream(objectInfo.objectName);
      
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

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async uploadBuffer(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    console.log('[ObjectStorage] uploadBuffer START', { filename, contentType, bufferSize: buffer.length });
    
    const objectId = randomUUID();
    const extension = filename.includes('.') ? filename.split('.').pop() : 'jpg';
    const objectName = `artworks/${objectId}.${extension}`;

    console.log('[ObjectStorage] Uploading to:', objectName);
    
    try {
      const result = await getReplitStorageClient().uploadFromBytes(objectName, buffer);
      
      if (!result.ok) {
        console.error('[ObjectStorage] Upload FAILED:', result.error);
        throw new Error(`Storage write failed: ${result.error?.message || 'Unknown error'}`);
      }
      
      console.log('[ObjectStorage] Upload SUCCESS:', objectName);
    } catch (err: any) {
      const errMessage = err?.message || 'Unknown error';
      console.error('[ObjectStorage] Upload FAILED:', errMessage);
      console.error('[ObjectStorage] Full error:', err);
      throw new Error(`Storage write failed: ${errMessage}`);
    }

    const resultPath = `/objects/artworks/${objectId}.${extension}`;
    console.log('[ObjectStorage] uploadBuffer END - returning:', resultPath);
    return resultPath;
  }
}
