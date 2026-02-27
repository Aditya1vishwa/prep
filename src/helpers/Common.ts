import fs from "fs";

const Common = {
    deleteLocalFiles: async (files: string | string[]): Promise<void> => {
        if (!files) return;
        const fileArray = Array.isArray(files) ? files : [files];
        for (const file of fileArray) {
            try {
                await fs.promises.unlink(file);
            } catch (err) {
                const error = err as NodeJS.ErrnoException;
                if (error.code !== "ENOENT") {
                    console.error(`Error deleting file: ${file}`, err);
                }
            }
        }
    },
};

export default Common;
