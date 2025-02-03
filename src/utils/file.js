import fs from 'fs/promises';

export const deleteFile = async (path) => {
  try {
    await fs.unlink(path);
  } catch (error) {
    console.log('error', error);
  }
};
