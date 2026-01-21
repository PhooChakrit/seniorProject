#!/usr/bin/env python
import pika
import os
import json
import subprocess
import time
import sys

# Configuration
RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672/%2F')
QUEUE_NAME = os.environ.get('QUEUE_NAME', 'crispr_tasks')
# Path to the CRISPR-PLANTv2 main script (assuming it's in the cloned repo directory)
CRISPR_SCRIPT = '/app/CRISPR-PLANTv2/CRISPR_PLANT_v2.py'
GENOMES_DIR = '/data/genomes'

def main():
    print(" [x] Starting Worker...")
    
    # Connect to RabbitMQ with retry logic
    while True:
        try:
            params = pika.URLParameters(RABBITMQ_URL)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            break
        except pika.exceptions.AMQPConnectionError:
            print(" [!] RabbitMQ not reachable, retrying in 5 seconds...")
            time.sleep(5)

    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    print(" [x] Connected to RabbitMQ. Waiting for messages in queue: %s" % QUEUE_NAME)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(QUEUE_NAME, callback)

    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
    connection.close()

def callback(ch, method, properties, body):
    print(" [x] Received task")
    try:
        # Expecting JSON body
        task_data = json.loads(body)
        print(" [x] Data: %s" % str(task_data))
        
        if not genome_file:
             # Fallback: check if 'args' is provided directly
             print(" [x] No 'genome_file' specific field, checking for 'args'...")

        # Construct command dynamically
        # Allow passing full argument list for maximum flexibility
        # e.g. {"args": ["-i", "/data/genomes/oryza/..."]}
        script_args = task_data.get('args', [])
        
        # If genome_file was provided, we can prepend it if not in args (backward compat)
        if genome_file and "-i" not in script_args:
             input_path = os.path.join(GENOMES_DIR, genome_file)
             if not os.path.exists(input_path):
                 raise ValueError("Genome file not found at %s" % input_path)
        
        # Extract configuration options for the pipeline
        pipeline_env = os.environ.copy()
        options = task_data.get('options', {})
        if options:
            print(" [x] Applying configuration options: %s" % str(options))
            for key, value in options.items():
                pipeline_env[key] = str(value)

        # Use the shell script wrapper for the pipeline
        cmd = ["/bin/bash", "/app/run_pipeline.sh", input_path]
        
        print(" [x] Executing Pipeline: %s" % " ".join(cmd))
        
        # Capture start time
        start_time = time.time()
        
        # Execute Subprocess
        # Redirect stdout/stderr to capture logs
        return_code = subprocess.call(cmd, env=pipeline_env)
        
        end_time = time.time()
        duration = end_time - start_time
        print(" [x] Execution Duration: %.2f seconds" % duration)

        
        if return_code == 0:
            print(" [x] Task completed successfully")
        else:
            print(" [!] Task failed with return code: %d" % return_code)

    except Exception as e:
        print(" [!] Error processing task: %s" % str(e))
        # Depending on logic, might want to reject or nack. 
        # For now, we auto-ack to prevent loops if it's a poison message, 
        # or rely on manual ack logic.
        # ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    # Acknowledge message
    ch.basic_ack(delivery_tag=method.delivery_tag)
    print(" [x] Done")

if __name__ == '__main__':
    main()
