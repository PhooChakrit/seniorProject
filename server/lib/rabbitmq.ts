import * as amqp from 'amqplib';

class RabbitMQService {
  private connection: any = null;
  private channel: any = null;
  private queueName = 'crispr_tasks';

  async connect() {
    if (this.connection) return;

    const amqpUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';
    console.log(`Connecting to RabbitMQ at ${amqpUrl}`);

    try {
      const conn = await amqp.connect(amqpUrl);
      this.connection = conn;
      this.channel = await conn.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publishJob(jobData: any) {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) throw new Error('RabbitMQ channel not available');

    const message = JSON.stringify(jobData);
    const sent = this.channel.sendToQueue(this.queueName, Buffer.from(message), {
      persistent: true,
    });

    if (sent) {
      console.log('Job sent to queue:', message);
    } else {
      console.error('Failed to send job to queue');
    }
    return sent;
  }
}

export const rabbitMQ = new RabbitMQService();
