import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  // Contructor initializes the S3 client with credentials and bucket information from environment variables
  constructor(private readonly configService: ConfigService) {
    this.region = String(this.configService.getOrThrow<string>('AWS_REGION'));
    this.bucketName = String(
      this.configService.getOrThrow<string>('AWS_BUCKET_NAME'),
    );

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: String(
          this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        ),
        secretAccessKey: String(
          this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
        ),
      },
    });
  }

  // Uploads a file to AWS S3 and returns its public URL
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      // Generate a unique filename using a UUID and preserve the original file extension
      const originalName = String(file.originalname || 'upload');
      const parts = originalName.split('.');
      const fileExtension = parts.length > 1 ? String(parts.pop()) : 'tmp';

      const uniqueFilename = `${folder}/${randomUUID()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFilename,
        Body: file.buffer,
        ContentType: String(file.mimetype),
      });

      // Send the command to S3 to upload the file
      await this.s3Client.send(command);

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${uniqueFilename}`;
    } catch (error: unknown) {
      // Log the error message and throw an internal server error exception if the upload fails
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown S3 Upload Error';
      this.logger.error(`Failed to upload file to S3: ${errorMessage}`);
      throw new InternalServerErrorException('Error uploading file to storage');
    }
  }

  /**
   * Deletes a file from AWS S3 using its full URL.
   * @param fileUrl The public URL of the file stored in the database
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const key = decodeURIComponent(url.pathname.substring(1));

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown S3 Delete Error';
      this.logger.error(`Failed to delete file from S3: ${errorMessage}`);
      throw new InternalServerErrorException(
        'Error deleting file from storage',
      );
    }
  }
}
