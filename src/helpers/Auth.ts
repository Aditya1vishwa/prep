import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const authHelpers = {
    hashPassword: async (plainPassword: string): Promise<string> => {
        if (!plainPassword) {
            throw new Error("Password is required");
        }
        return bcrypt.hash(plainPassword, SALT_ROUNDS);
    },

    comparePassword: async (
        plainPassword: string,
        hashedPassword: string
    ): Promise<boolean> => {
        if (!plainPassword || !hashedPassword) {
            return false;
        }
        return bcrypt.compare(plainPassword, hashedPassword);
    },
};

export default authHelpers;
