import { File, Storage } from "@google-cloud/storage";
import { GEN_SITES_PROJECT_ID } from "../../config/env.js";

const storage = new Storage({ projectId: GEN_SITES_PROJECT_ID });

async function getExistingFile(
  bucketName: string,
  filePath: string,
): Promise<File> {
  const file = storage.bucket(bucketName).file(filePath);

  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`GCS file not found: gs://${bucketName}/${filePath}`);
  }

  return file;
}

export async function downloadToDestinationGCS(
  destination: string,
  filePath: string,
  bucketName: string,
): Promise<void> {
  const file = await getExistingFile(bucketName, filePath);
  await file.download({ destination });
}

export async function downloadContentsGCS<T = unknown>(
  filePath: string,
  bucketName: string,
): Promise<T> {
  const file = await getExistingFile(bucketName, filePath);
  const [contents] = await file.download();

  return JSON.parse(contents.toString("utf-8")) as T;
}
