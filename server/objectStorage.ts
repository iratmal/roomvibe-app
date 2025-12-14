import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

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

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async getUploadURL(filename: string): Promise<{ uploadURL: string; objectPath: string }> {
    const privateDirRaw = this.getPrivateObjectDir();
    const privateDir = privateDirRaw.replace(/^\/+/, "");
    const parts = privateDir.split("/").filter(Boolean);
    const bucketName = parts[0];
    const prefix = parts.slice(1).join("/");
    
    if (!bucketName) {
      throw new Error(`Invalid PRIVATE_OBJECT_DIR: "${privateDirRaw}" (bucketName empty)`);
    }
    
    const objectId = randomUUID();
    const extension = filename.includes('.') ? filename.split('.').pop() : 'jpg';
    const objectName = `artworks/${objectId}.${extension}`;
    const storedObjectName = prefix ? `${prefix}/${objectName}` : objectName;

    const uploadURL = await this.signObjectURL({
      bucketName,
      objectName: storedObjectName,
      method: "PUT",
      ttlSec: 900,
    });

    return {
      uploadURL,
      objectPath: `/objects/artworks/${objectId}.${extension}`
    };
  }

  async getObjectFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const pathParts = objectPath.slice(1).split("/");
    if (pathParts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = pathParts.slice(1).join("/");
    
    const privateDirRaw = this.getPrivateObjectDir();
    const privateDir = privateDirRaw.replace(/^\/+/, "");
    const dirParts = privateDir.split("/").filter(Boolean);
    const bucketName = dirParts[0];
    const prefix = dirParts.slice(1).join("/");
    
    if (!bucketName) {
      throw new Error(`Invalid PRIVATE_OBJECT_DIR: "${privateDirRaw}" (bucketName empty)`);
    }
    
    const objectName = prefix ? `${prefix}/${entityId}` : entityId;
    
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size?.toString() || "0",
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();

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
    
    const privateDirRaw = this.getPrivateObjectDir();
    const privateDir = privateDirRaw.replace(/^\/+/, "");
    
    const parts = privateDir.split("/").filter(Boolean);
    const bucketName = parts[0];
    const prefix = parts.slice(1).join("/");
    
    if (!bucketName) {
      throw new Error(`Invalid PRIVATE_OBJECT_DIR: "${privateDirRaw}" (bucketName empty)`);
    }
    
    const objectId = randomUUID();
    const extension = filename.includes('.') ? filename.split('.').pop() : 'jpg';
    const objectName = `artworks/${objectId}.${extension}`;
    const storedObjectName = prefix ? `${prefix}/${objectName}` : objectName;

    console.log('[ObjectStorage] Using PRIVATE_OBJECT_DIR:', privateDirRaw);
    console.log('[ObjectStorage] Parsed bucket/prefix:', { bucketName, prefix: prefix || '(none)', storedObjectName });

    try {
      console.log('[ObjectStorage] Getting signed URL for upload...', { bucketName, storedObjectName });
      
      const signedUrl = await this.signObjectURL({
        bucketName,
        objectName: storedObjectName,
        method: "PUT",
        ttlSec: 900,
      });
      
      console.log('[ObjectStorage] Got signed URL, uploading via PUT...', { size: buffer.length, contentType });
      
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
        },
        body: buffer,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[ObjectStorage] Signed URL upload FAILED', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          body: errorText,
        });
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
      }
      
      console.log('[ObjectStorage] Signed URL upload SUCCESS', { status: uploadResponse.status });
    } catch (err: any) {
      const errMessage = err?.message || err?.response?.data || err?.response || 'Unknown error';
      const errCode = err?.code || err?.statusCode || err?.response?.status;
      const errDetails = {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        statusCode: err?.statusCode,
        errors: err?.errors,
        response: err?.response?.data || err?.response,
      };
      console.error('[ObjectStorage] uploadBuffer FAILED', errDetails);
      console.error('[ObjectStorage] Full error stack:', err?.stack);
      
      const error = new Error(`Storage write failed: ${errMessage}`);
      (error as any).code = errCode;
      (error as any).statusCode = err?.statusCode;
      (error as any).details = errDetails;
      throw error;
    }

    const resultPath = `/objects/artworks/${objectId}.${extension}`;
    console.log('[ObjectStorage] uploadBuffer END - returning:', resultPath);
    return resultPath;
  }

  private parseObjectPath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");

    return { bucketName, objectName };
  }

  private async signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}, ` +
          `make sure you're running on Replit`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }
}
