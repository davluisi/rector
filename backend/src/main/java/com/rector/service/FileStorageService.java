package com.rector.service;

import java.io.InputStream;

public interface FileStorageService {

    /**
     * Uploads a user profile image (publicly accessible).
     * @param filename Name of the file
     * @param inputStream InputStream of the file content
     * @param contentType Content type (e.g. image/jpeg, image/png)
     * @return The public URL to access the image (via CloudFront if configured)
     */
    String uploadImmagineProfilo(String filename, InputStream inputStream, String contentType);

    /**
     * Uploads a PT exercise explanation video (publicly accessible).
     * @param filename Name of the file
     * @param inputStream InputStream of the file content
     * @param contentType Content type (e.g. video/mp4)
     * @return The public URL to access the video (via CloudFront if configured)
     */
    String uploadVideoEsercizio(String filename, InputStream inputStream, String contentType);

    /**
     * Uploads a PT personal document or certification (private).
     * @param filename Name of the file
     * @param inputStream InputStream of the file content
     * @param contentType Content type (e.g. application/pdf)
     * @return The unique S3 key of the uploaded document under the documenti-pt/ prefix
     */
    String uploadDocumentoPt(String filename, InputStream inputStream, String contentType);

    /**
     * Uploads a file that is temporary and will auto-expire after 30 days (e.g. user execution videos).
     * @param filename Name of the file
     * @param inputStream InputStream of the file content
     * @param contentType Content type (e.g. video/mp4)
     * @return The unique S3 key of the uploaded file under the temp/ prefix
     */
    String uploadTemp(String filename, InputStream inputStream, String contentType);

    /**
     * Generates a temporary pre-signed URL for accessing a private or temporary file.
     * @param key The S3 key of the file
     * @param durationSeconds Duration in seconds for which the URL will be valid
     * @return The pre-signed URL
     */
    String generatePresignedUrl(String key, long durationSeconds);

    /**
     * Deletes a file from the S3 bucket using its key.
     * @param key The S3 key of the file
     */
    void delete(String key);

    /**
     * Lists all keys in the S3 bucket with the specified prefix.
     * @param prefix Prefix to filter keys by (e.g. "immagini-profilo/")
     * @return List of S3 keys matching the prefix
     */
    java.util.List<String> listKeys(String prefix);
}
