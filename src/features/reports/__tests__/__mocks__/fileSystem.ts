export const cacheDirectory = "file:///app_cache/";

export const getInfoAsync = jest.fn().mockResolvedValue({ exists: true, isDirectory: true });
export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);
export const readAsStringAsync = jest.fn().mockResolvedValue("{}");

export const createDownloadResumable = jest.fn((url, fileUri, options, callback) => {
  return {
    downloadAsync: jest.fn().mockImplementation(async () => {
      if (callback) {
        callback({ totalBytesWritten: 1000, totalBytesExpectedToWrite: 1000 });
      }
      return {
        uri: fileUri,
        status: 200,
        headers: {},
        mimeType: fileUri.endsWith(".pdf")
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    }),
    cancelAsync: jest.fn().mockResolvedValue(undefined),
  };
});
