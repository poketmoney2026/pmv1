import mongoose from "mongoose";

const { Schema } = mongoose;

const DownloadAssetSchema = new Schema(
  {
    key: { type: String, default: "android_app", unique: true, index: true },
    label: { type: String, default: "APP DOWNLOAD" },
    fileName: { type: String, default: "app.apk" },
    originalName: { type: String, default: "app.apk" },
    relativePath: { type: String, default: "/apps/app.apk" },
    mimeType: { type: String, default: "application/vnd.android.package-archive" },
    size: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "download_assets" }
);

export default mongoose.models.DownloadAsset || mongoose.model("DownloadAsset", DownloadAssetSchema);
