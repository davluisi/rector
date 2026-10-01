package com.rector.service.impl;

import com.rector.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.UUID;

@Service
public class S3StorageService implements FileStorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;
    private final String cloudFrontUrl;

    public S3StorageService(
            S3Client s3Client,
            S3Presigner s3Presigner,
            @Value("${aws.s3.bucket}") String bucketName,
            @Value("${aws.cloudfront.url:}") String cloudFrontUrl) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucketName = bucketName;
        this.cloudFrontUrl = cloudFrontUrl;
    }

    @Override
    public String uploadImmagineProfilo(String filename, InputStream inputStream, String contentType) {
        String uniqueName = generateUniqueName(filename);
        String key = "immagini-profilo/" + uniqueName;
        uploadToS3(key, inputStream, contentType);

        if (cloudFrontUrl != null && !cloudFrontUrl.trim().isEmpty()) {
            String cleanCfUrl = cloudFrontUrl.endsWith("/") ? cloudFrontUrl : cloudFrontUrl + "/";
            return cleanCfUrl + key;
        }

        // Fallback to S3 direct URL
        return String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
    }

    @Override
    public String uploadVideoEsercizio(String filename, InputStream inputStream, String contentType) {
        String uniqueName = generateUniqueName(filename);
        String key = "video-esercizi-pt/" + uniqueName;
        uploadToS3(key, inputStream, contentType);

        if (cloudFrontUrl != null && !cloudFrontUrl.trim().isEmpty()) {
            String cleanCfUrl = cloudFrontUrl.endsWith("/") ? cloudFrontUrl : cloudFrontUrl + "/";
            return cleanCfUrl + key;
        }

        // Fallback to S3 direct URL
        return String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
    }

    @Override
    public String uploadAnteprimaEsercizio(String filename, InputStream inputStream, String contentType) {
        String uniqueName = generateUniqueName(filename);
        String key = "anteprime-esercizi-pt/" + uniqueName;
        uploadToS3(key, inputStream, contentType);

        if (cloudFrontUrl != null && !cloudFrontUrl.trim().isEmpty()) {
            String cleanCfUrl = cloudFrontUrl.endsWith("/") ? cloudFrontUrl : cloudFrontUrl + "/";
            return cleanCfUrl + key;
        }

        // Fallback to S3 direct URL
        return String.format("https://%s.s3.amazonaws.com/%s", bucketName, key);
    }

    @Override
    public String uploadDocumentoPt(String filename, InputStream inputStream, String contentType) {
        String uniqueName = generateUniqueName(filename);
        String key = "documenti-pt/" + uniqueName;
        uploadToS3(key, inputStream, contentType);
        return key;
    }

    @Override
    public String uploadTemp(String filename, InputStream inputStream, String contentType) {
        String uniqueName = generateUniqueName(filename);
        String key = "temp/" + uniqueName;
        uploadToS3(key, inputStream, contentType);
        return key;
    }

    @Override
    public String generatePresignedUrl(String key, long durationSeconds) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofSeconds(durationSeconds))
            .getObjectRequest(builder -> builder.bucket(bucketName).key(key))
            .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
    }

    @Override
    public void delete(String key) {
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build();
        s3Client.deleteObject(deleteRequest);
    }

    private void uploadToS3(String key, InputStream inputStream, String contentType) {
        try {
            byte[] bytes = inputStream.readAllBytes();
            PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();
            s3Client.putObject(putRequest, RequestBody.fromBytes(bytes));
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file input stream for S3 upload", e);
        }
    }

    private String generateUniqueName(String filename) {
        String cleanName = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        return UUID.randomUUID().toString() + "_" + cleanName;
    }

    @Override
    public java.util.List<String> listKeys(String prefix) {
        ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
            .bucket(bucketName)
            .prefix(prefix)
            .build();
        ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);
        java.util.List<String> keys = new java.util.ArrayList<>();
        for (S3Object s3Object : listResponse.contents()) {
            keys.add(s3Object.key());
        }
        return keys;
    }
}
