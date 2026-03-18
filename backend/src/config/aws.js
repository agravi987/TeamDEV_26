const { S3Client } = require('@aws-sdk/client-s3');
const { SNSClient } = require('@aws-sdk/client-sns');
require('dotenv').config();

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
};
const region = process.env.AWS_REGION;

const s3Client = new S3Client({
  region,
  credentials,
});

const snsClient = new SNSClient({
  region,
  credentials,
});

module.exports = { s3Client, snsClient };
