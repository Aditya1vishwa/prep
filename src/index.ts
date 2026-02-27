import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./app.js";
import mongodbConnection from "./db/mongodb/mongodbConnection.js";

mongodbConnection()
    .then(() => {
        const PORT = process.env.PORT || 8002;
        app.listen(PORT, () => {
            console.log(`🚀 Server running at port: ${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });
