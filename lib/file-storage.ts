import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")

/**
 * Initialize the upload directory if it doesn't exist
 */
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * Upload a file to local storage
 * @param file - The file to upload
 * @returns Object with url and size
 */
export async function uploadFile(file: File): Promise<{ url: string; size: number }> {
  await ensureUploadDir()

  // Generate unique filename with timestamp
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const fileName = `${timestamp}-${sanitizedName}`
  const filePath = join(UPLOAD_DIR, fileName)

  // Convert File to Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Write file to disk
  await writeFile(filePath, buffer)

  // Return public URL (accessible via /uploads/filename)
  return {
    url: `/uploads/${fileName}`,
    size: file.size,
  }
}

/**
 * Delete a file from local storage
 * @param fileUrl - The URL of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const { unlink } = await import("fs/promises")
    const fileName = fileUrl.split("/").pop()
    if (fileName) {
      const filePath = join(UPLOAD_DIR, fileName)
      if (existsSync(filePath)) {
        await unlink(filePath)
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error)
  }
}