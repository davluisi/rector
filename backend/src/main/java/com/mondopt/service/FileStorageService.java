package com.mondopt.service;

import java.io.InputStream;

public interface FileStorageService {

    /**
     * Uploads a file that is publicly accessible (e.g. profile images, exercise videos).
     * @param filename Name of the file
     * @param inputStream InputStream of the file content
     * @param contentType Content type (e.g. image/jpeg, video/mp4)
     * @return The public URL to access the file (via CloudFront if configured)
     */
    String uploadPublic(String filename, InputStream inputStream, String contentType);

    /**
     * Uploads a file that is private (e.g. PT certifications).
     * @param filename Name of the file
     * @param inputStream InputStream of the file content
     * @param contentType Content type (e.g. application/pdf)
     * @return The unique S3 key of the uploaded file
     */
    String uploadPrivate(String filename, InputStream inputStream, String contentType);

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
}
