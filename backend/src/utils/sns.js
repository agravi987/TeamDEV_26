const { PublishCommand } = require('@aws-sdk/client-sns');
const { snsClient } = require('../config/aws');

/**
 * Send an SMS message using AWS SNS
 * @param {string} phoneNumber - The phone number in E.164 format (e.g., +1234567890)
 * @param {string} message - The message content
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    if (!process.env.SNS_ENABLED || process.env.SNS_ENABLED === 'false') {
      console.log(`[SNS Disabled] Would have sent SMS to ${phoneNumber}: ${message}`);
      return;
    }

    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
    });
    
    const response = await snsClient.send(command);
    console.log(`[SNS] SMS sent to ${phoneNumber}. MessageId: ${response.MessageId}`);
    return response;
  } catch (error) {
    console.error(`[SNS Error] Failed to send SMS to ${phoneNumber}:`, error.message);
  }
};

/**
 * Send an Email or Notification to a Topic ARN using AWS SNS
 * @param {string} topicArn - The SNS Topic ARN to publish to
 * @param {string} subject - The subject of the message
 * @param {string} message - The message content
 */
const publishToTopic = async (topicArn, subject, message) => {
  try {
    if (!process.env.SNS_ENABLED || process.env.SNS_ENABLED === 'false') {
      console.log(`[SNS Disabled] Would have published to ${topicArn}. Subject: ${subject}`);
      return;
    }

    const command = new PublishCommand({
      TopicArn: topicArn,
      Subject: subject,
      Message: message,
    });
    
    const response = await snsClient.send(command);
    console.log(`[SNS] Message published to Topic. MessageId: ${response.MessageId}`);
    return response;
  } catch (error) {
    console.error(`[SNS Error] Failed to publish to topic ${topicArn}:`, error.message);
  }
};

module.exports = {
  sendSMS,
  publishToTopic,
};
