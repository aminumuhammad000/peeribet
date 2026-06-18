import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let storage: any;

if (process.env.CLOUDINARY_API_KEY) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: any, file: any) => {
      return {
        folder: 'peeribet_profiles',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        public_id: `profile_${req.user?._id || Date.now()}`,
      };
    },
  });
} else {
  // Fallback to local storage if Cloudinary is not configured
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
      cb(null, uploadDir);
    },
    filename: function (req: any, file: any, cb: any) {
      cb(null, `profile_${req.user?._id || Date.now()}_${file.originalname}`);
    }

  });
}

export const upload = multer({ storage: storage });
export default cloudinary;
