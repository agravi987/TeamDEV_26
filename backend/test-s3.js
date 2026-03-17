const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env' }); // or load from process.env

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

async function testPut() {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: 'test-upload.txt',
      Body: 'Hello world',
      ContentType: 'text/plain',
    };
    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command);
    console.log('Success!', data);
  } catch (err) {
    console.error('Error occurred:', err.name, err.message);
  }
}

testPut();
