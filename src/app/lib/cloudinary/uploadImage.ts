import cloudinary from "./cloudinary";

export async function uploadLocalFiletoCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString('base64');
  const dataURI = `data:${file.type};base64,${base64String}`;

  const uploadResult = await cloudinary.uploader.upload(dataURI, {
    folder: 'user_uploads'
  })

  return uploadResult.secure_url;
}