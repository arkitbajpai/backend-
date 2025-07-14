import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadonCloudniary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    fs.unlinkSync(localFilePath); // clean up local file

    console.log("✅ File uploaded on Cloudinary:", result.url);
    return result; // contains .url, .public_id etc.
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // remove failed upload
    }

    return null;
  }
};

export { uploadonCloudniary };
