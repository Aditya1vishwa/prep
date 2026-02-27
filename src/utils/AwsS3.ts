import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import {
    S3Client,
    DeleteObjectCommand,
    GetObjectCommand,
    GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    ...(process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY && {
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    }),
});

const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME || "",
};

interface UploadResult {
    url: string;
    data: unknown;
}

interface UploadOptions {
    ContentType?: string;
}

const AwsS3 = {
    upload: (
        fileBody: Buffer | NodeJS.ReadableStream,
        remotePath: string,
        options: UploadOptions = {}
    ): Promise<UploadResult> => {
        return new Promise((resolve, reject) => {
            const p: Record<string, unknown> = { ...s3Params };
            p.Key = remotePath;
            if (options.ContentType) {
                p.ContentType = options.ContentType;
            }
            p.Body = fileBody;

            const parallelUploads3 = new Upload({
                client,
                params: {
                    Bucket: process.env.AWS_BUCKET_NAME || "",
                    Key: remotePath,
                    Body: fileBody as Buffer,
                    ...(options.ContentType && { ContentType: options.ContentType }),
                },
            });

            parallelUploads3.done().then(
                (data) => {
                    const url = (data as { Key?: string }).Key || remotePath;
                    resolve({ url, data });
                },
                (err: Error) => {
                    console.error("S3 Upload Error:", err);
                    reject(err.toString());
                }
            );
        });
    },

    deleteObject: (remotePath: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const params = { ...s3Params, Key: remotePath };
            const command = new DeleteObjectCommand(params);
            client
                .send(command)
                .then(() => resolve())
                .catch((err: Error) => {
                    console.error("S3 Delete Error:", err);
                    reject(err);
                });
        });
    },

    deleteObjects: (remotePaths: string[]): Promise<void[]> => {
        return Promise.all(remotePaths.map((p) => AwsS3.deleteObject(p)));
    },

    getObject: async (objectKey: string): Promise<GetObjectCommandOutput> => {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME || "",
            Key: objectKey,
        });
        return client.send(command);
    },
};

export default AwsS3;
