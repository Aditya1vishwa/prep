import fs from "fs";
import path from "path";
import AwsS3 from "../utils/AwsS3.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TempObject {
    tempName: string;
    tempPath: string;
    ext: string;
}

export interface UploadOptions {
    tempPath: string;
    finalPath: string;
    contentType?: string;
}

export interface UploadResult {
    fileName: string;
    filePath: string;
    fileUrl: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL =
    process.env.UPLOAD_BASE_URL || "http://localhost:8002/uploads";
const STORAGE_TYPE = (process.env.STORAGE_TYPE || "local") as "local" | "s3";
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || "";

// ─── Local Helpers ────────────────────────────────────────────────────────────

const ensureDir = (dir: string): void => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// ─── Upload Helper ────────────────────────────────────────────────────────────

const uploadHelper = {
    /**
     * Get a standardised temp file object from a multer file
     */
    getTempObject: (file: Express.Multer.File | undefined): TempObject | null => {
        if (!file) return null;
        return {
            tempName: file.filename,
            tempPath: file.path,
            ext: path.extname(file.originalname),
        };
    },

    /**
     * Upload a file to local disk or S3 depending on STORAGE_TYPE env var.
     * - Local: moves file from tempPath to finalPath inside /uploads dir
     * - S3:    uploads file buffer from tempPath to finalPath as S3 key
     */
    uploadFile: async ({
        tempPath,
        finalPath,
        contentType,
    }: UploadOptions): Promise<UploadResult> => {
        if (STORAGE_TYPE === "s3") {
            // ── S3 Upload ──
            const fileBuffer = fs.readFileSync(tempPath);
            const options = contentType ? { ContentType: contentType } : {};
            const result = await AwsS3.upload(fileBuffer, finalPath, options);

            // Remove temp file after S3 upload
            try {
                fs.unlinkSync(tempPath);
            } catch {
                // ignore cleanup errors
            }

            const fileUrl = S3_PUBLIC_URL
                ? `${S3_PUBLIC_URL}/${finalPath}`
                : result.url;

            return {
                fileName: path.basename(finalPath),
                filePath: finalPath,
                fileUrl,
            };
        } else {
            // ── Local Upload ──
            const localFinalPath = path.join("uploads", finalPath);
            const dir = path.dirname(localFinalPath);
            ensureDir(dir);
            fs.renameSync(tempPath, localFinalPath);
            const fileName = path.basename(localFinalPath);

            return {
                fileName,
                filePath: localFinalPath,
                fileUrl: `${BASE_URL}/${finalPath.replace(/\\/g, "/")}`,
            };
        }
    },

    /**
     * Delete a file from local disk or S3.
     * Pass the stored filePath/key as returned by uploadFile.
     */
    deleteFile: async (filePath: string): Promise<void> => {
        if (!filePath) return;

        if (STORAGE_TYPE === "s3") {
            await AwsS3.deleteObject(filePath);
        } else {
            const absPath = path.resolve(filePath);
            if (fs.existsSync(absPath)) {
                fs.unlinkSync(absPath);
            }
        }
    },

    /**
     * Delete an entire folder (local) or all objects under a prefix (S3).
     * For S3 you should pass the prefix string (e.g. "uploads/users/userId/").
     * Pass paths as array of keys when STORAGE_TYPE=s3.
     */
    deleteFolder: async (folderPathOrPrefix: string): Promise<void> => {
        if (!folderPathOrPrefix) return;

        if (STORAGE_TYPE === "s3") {
            // For S3 we can only delete known keys; caller should provide them.
            // This variant deletes the prefix itself if it's treated as a key.
            await AwsS3.deleteObject(folderPathOrPrefix);
        } else {
            const absPath = path.resolve(folderPathOrPrefix);
            if (fs.existsSync(absPath)) {
                fs.rmSync(absPath, { recursive: true, force: true });
            }
        }
    },

    // ── Legacy alias (kept for backward-compat) ──────────────────────────────
    upload: async ({
        tempPath,
        finalPath,
    }: {
        tempPath: string;
        finalPath: string;
    }): Promise<UploadResult> => {
        return uploadHelper.uploadFile({ tempPath, finalPath });
    },

    remove: async (filePath: string): Promise<void> => {
        return uploadHelper.deleteFile(filePath);
    },
};

export default uploadHelper;
