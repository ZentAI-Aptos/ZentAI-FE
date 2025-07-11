import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API = `${process.env.REACT_APP_API_URL}/api`;

const chunkUpload = async ({ file, onProgress }) => {
  if (!file) {
    throw new Error('No file provided for upload.');
  }
  if (typeof onProgress !== 'function') {
    throw new Error('onProgress must be a function.');
  }

  const uploadId = uuidv4();

  // Step 1: Init upload session
  try {
    await axios.post(`${API}/upload/init-upload`, { uploadId });
  } catch (error) {
    console.error('Failed to init upload session:', error);
    throw new Error('Failed to initiate upload.');
  }

  const chunkSize = 1 * 1024 * 1024; // 1MB
  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadedChunks = 0;

  const queue = Array.from({ length: totalChunks }, (_, i) => i);
  const concurrentUploads = 4;

  const uploadChunk = async (chunkIndex) => {
    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex);
    formData.append('chunk', chunk);

    try {
      await axios.post(`${API}/upload/chunk`, formData);
      uploadedChunks++;
      onProgress(Math.round((uploadedChunks / totalChunks) * 100));
    } catch (error) {
      console.error(`Failed to upload chunk ${chunkIndex}:`, error);
      throw new Error(`Chunk ${chunkIndex} upload failed.`);
    }
  };

  const runPool = async () => {
    const workers = Array(concurrentUploads)
      .fill(null)
      .map(async () => {
        while (queue.length > 0) {
          const chunkIndex = queue.shift();
          if (chunkIndex !== undefined) {
            await uploadChunk(chunkIndex);
          }
        }
      });
    await Promise.all(workers);
  };

  // Step 2: Upload all chunks concurrently
  await runPool();

  // Step 3: Finalize upload session
  try {
    const resp = await axios.post(`${API}/upload/finalize`, { uploadId });

    if (!resp.data || !resp.data.fileId) {
      console.error('Finalize response invalid:', resp.data);
      throw new Error('Finalize upload failed: Invalid server response.');
    }

    const { fileId, fileName, filePath } = resp.data;
    console.log('Uploaded file:', { fileId, fileName, filePath });

    return { fileId, fileName, filePath };
  } catch (error) {
    console.error('Failed to finalize upload:', error);
    throw new Error('Failed to finalize upload.');
  }
};

export default chunkUpload;
