#!/usr/bin/env python
# -*- coding: utf-8 -*-
import pika
import os
import json
import subprocess
import time
import sys

# For Python 2/3 compatibility
try:
    from urllib2 import Request, urlopen, HTTPError
except ImportError:
    from urllib.request import Request, urlopen
    from urllib.error import HTTPError

# Configuration
RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672/%2F')
QUEUE_NAME = os.environ.get('QUEUE_NAME', 'crispr_tasks')
API_URL = os.environ.get('API_URL', 'http://api:3000')
CRISPR_SCRIPT = '/app/CRISPR-PLANTv2/CRISPR_PLANT_v2.py'
GENOMES_DIR = '/data/genomes'


def load_variety_config(genomes_dir):
    """
    One folder per cultivar under genomes_dir, each with genome.json:
    { "id", "label", "fasta", "gff3" } — same layout as JBrowse / analysis.
    """
    config = {}
    if not os.path.isdir(genomes_dir):
        return config
    try:
        names = os.listdir(genomes_dir)
    except OSError:
        return config
    for name in names:
        sub = os.path.join(genomes_dir, name)
        if not os.path.isdir(sub) or name.startswith('.'):
            continue
        manifest_path = os.path.join(sub, 'genome.json')
        if not os.path.isfile(manifest_path):
            continue
        try:
            with open(manifest_path) as f:
                data = json.load(f)
        except (ValueError, IOError):
            continue
        vid = data.get('id')
        fasta_rel = data.get('fasta')
        if not vid or not fasta_rel:
            continue
        genome_rel = os.path.join(name, fasta_rel).replace('\\', '/')
        key = str(vid)
        if key in config:
            print(" [warn] duplicate variety id %r; keeping %s" % (key, config[key].get('folder')))
            continue
        config[key] = {
            'genome_file': genome_rel,
            'name': data.get('label', key),
            'folder': name,
            'gff3': data.get('gff3'),
        }
    return config


VARIETY_CONFIG = load_variety_config(GENOMES_DIR)
if not VARIETY_CONFIG:
    VARIETY_CONFIG = {
        'kdml105': {
            'genome_file': 'KDML/KDML105.fasta',
            'name': 'KDML105 (Thai Hom Mali Rice)',
            'folder': 'KDML',
            'gff3': 'KDML105.gff3',
        }
    }

SPECIES_CONFIG = VARIETY_CONFIG

if VARIETY_CONFIG:
    print(" [x] Varieties: %s" % sorted(VARIETY_CONFIG.keys()))


def update_job_status(job_id, status, result=None, error=None):
    """
    Call API to update job status in database.
    """
    try:
        url = "%s/api/genome/jobs/update" % API_URL
        data = {
            'jobId': job_id,
            'status': status
        }
        if result:
            data['result'] = result
        if error:
            data['error'] = error
        
        json_data = json.dumps(data)
        
        # Python 2/3 compatible request
        if sys.version_info[0] >= 3:
            json_bytes = json_data.encode('utf-8')
        else:
            json_bytes = json_data
            
        req = Request(url, data=json_bytes)
        req.add_header('Content-Type', 'application/json')
        
        response = urlopen(req, timeout=10)
        print(" [x] Updated job status: %s -> %s" % (job_id, status))
        return True
    except HTTPError as e:
        print(" [!] Failed to update job status: HTTP %s" % e.code)
        return False
    except Exception as e:
        print(" [!] Failed to update job status: %s" % str(e))
        return False


def send_notification(job_id, status, output_file=None, error_msg=None):
    """
    Call API to trigger email notification for job completion.
    """
    try:
        url = "%s/api/analysis/notify/%s" % (API_URL, job_id)
        data = {
            'status': status,
            'outputFile': output_file,
            'error': error_msg
        }
        
        json_data = json.dumps(data)
        
        if sys.version_info[0] >= 3:
            json_bytes = json_data.encode('utf-8')
        else:
            json_bytes = json_data
            
        req = Request(url, data=json_bytes)
        req.add_header('Content-Type', 'application/json')
        
        response = urlopen(req, timeout=30)
        print(" [x] Notification sent for job: %s" % job_id)
        return True
    except HTTPError as e:
        print(" [!] Failed to send notification: HTTP %s" % e.code)
        return False
    except Exception as e:
        print(" [!] Failed to send notification: %s" % str(e))
        return False


def main():
    print(" [x] Starting Worker...")
    print(" [x] API URL: %s" % API_URL)
    
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


def process_region_analysis(task_data):
    """
    Process region analysis request - NEW FLOW.
    Uses variety (rice type) + startPos/endPos to run pipeline.
    """
    job_id = task_data.get('jobId', 'unknown')
    variety = task_data.get('variety')
    start_pos = int(task_data.get('startPos', 0))
    end_pos = int(task_data.get('endPos', 0))
    options = task_data.get('options', {})
    contig = task_data.get('contig') or options.get('contig', 'ptg000001l')
    
    print(" [x] Processing REGION ANALYSIS:")
    print("     Job ID: %s" % job_id)
    print("     Variety: %s" % variety)
    print("     Region: %s - %s" % (start_pos, end_pos))
    print("     Contig: %s" % contig)
    print("     Options: %s" % str(options))
    
    # Update status to processing
    update_job_status(job_id, 'processing')
    
    # Validate variety
    if variety not in VARIETY_CONFIG:
        error_msg = "Unknown variety: %s. Available: %s" % (variety, list(VARIETY_CONFIG.keys()))
        update_job_status(job_id, 'failed', error=error_msg)
        raise ValueError(error_msg)
    
    # Get genome file path
    variety_config = VARIETY_CONFIG[variety]
    genome_file = os.path.join(GENOMES_DIR, variety_config['genome_file'])
    
    if not os.path.exists(genome_file):
        error_msg = "Genome file not found: %s" % genome_file
        update_job_status(job_id, 'failed', error=error_msg)
        raise ValueError(error_msg)
    
    # Extract pipeline options
    pam = options.get('pam', 'NGG')
    spacer_length = options.get('spacerLength', 20)
    mismatches = options.get('mismatches', 3)
    
    print("     PAM: %s" % pam)
    print("     Spacer Length: %s" % spacer_length)
    print("     Mismatches: %s" % mismatches)
    
    # Build command with all parameters (including jobId for unique output)
    cmd = [
        "/bin/bash", 
        "/app/scripts/complete_pipeline_run.sh", 
        genome_file, 
        variety,
        str(start_pos),
        str(end_pos),
        pam,
        str(spacer_length),
        str(mismatches),
        job_id,  # Add jobId for unique output filename
        contig
    ]
    
    print(" [x] Executing: %s" % " ".join(cmd))
    
    start_time = time.time()
    
    try:
        # Run the pipeline
        return_code = subprocess.call(cmd)
        end_time = time.time()
        duration = end_time - start_time
        print(" [x] Execution Duration: %.2f seconds" % duration)
        
        if return_code == 0:
            # Read output file path (unique per job)
            output_dir = os.path.dirname(genome_file)
            output_file = os.path.join(output_dir, 'output', '%s.tsv' % job_id)
            
            result = {
                'status': 'completed',
                'duration': duration,
                'outputFile': output_file,
                'variety': variety,
                'region': {'start': start_pos, 'end': end_pos}
            }
            
            update_job_status(job_id, 'completed', result=result)
            
            # Send email notification
            send_notification(job_id, 'completed', output_file=output_file)
            
            return result
        else:
            error_msg = "Pipeline failed with return code: %d" % return_code
            update_job_status(job_id, 'failed', error=error_msg)
            send_notification(job_id, 'failed', error_msg=error_msg)
            return {'status': 'failed', 'return_code': return_code}
            
    except Exception as e:
        error_msg = str(e)
        print(" [!] Pipeline error: %s" % error_msg)
        update_job_status(job_id, 'failed', error=error_msg)
        return {'status': 'failed', 'error': error_msg}


def process_region_search(task_data):
    """
    Process region search request (legacy).
    Extracts sequence from genome for given chromosome and position range.
    """
    job_id = task_data.get('jobId', 'unknown')
    species = task_data.get('species')
    chromosome = task_data.get('chromosome')
    from_pos = task_data.get('fromPosition')
    to_pos = task_data.get('toPosition')
    
    print(" [x] Processing REGION SEARCH:")
    print("     Job ID: %s" % job_id)
    print("     Species: %s" % species)
    print("     Chromosome: %s" % chromosome)
    print("     From: %s to %s" % (from_pos, to_pos))
    
    # Update status to processing
    update_job_status(job_id, 'processing')
    
    # Get genome file path
    if species not in SPECIES_CONFIG:
        error_msg = "Unknown species: %s" % species
        update_job_status(job_id, 'failed', error=error_msg)
        raise ValueError(error_msg)
    
    genome_file = os.path.join(GENOMES_DIR, SPECIES_CONFIG[species]['genome_file'])
    
    # Simulate processing time
    time.sleep(2)
    
    result = {
        'message': 'Region search completed',
        'params': {
            'species': species,
            'chromosome': chromosome,
            'fromPosition': from_pos,
            'toPosition': to_pos
        },
        'genomeFileExists': os.path.exists(genome_file)
    }
    
    if not os.path.exists(genome_file):
        result['note'] = 'Genome file not available for actual extraction'
    
    print(" [x] Region search completed")
    
    # Update status to completed
    update_job_status(job_id, 'completed', result=result)
    
    return result


def process_gene_search(task_data):
    """
    Process gene search request (legacy).
    Looks up gene coordinates and extracts corresponding region.
    """
    job_id = task_data.get('jobId', 'unknown')
    species = task_data.get('species')
    gene_id = task_data.get('geneId')
    
    print(" [x] Processing GENE SEARCH:")
    print("     Job ID: %s" % job_id)
    print("     Species: %s" % species)
    print("     Gene ID: %s" % gene_id)
    
    # Update status to processing
    update_job_status(job_id, 'processing')
    
    # Get genome file path
    if species not in SPECIES_CONFIG:
        error_msg = "Unknown species: %s" % species
        update_job_status(job_id, 'failed', error=error_msg)
        raise ValueError(error_msg)
    
    # Simulate processing time
    time.sleep(2)
    
    result = {
        'message': 'Gene search completed',
        'params': {
            'species': species,
            'geneId': gene_id
        }
    }
    
    print(" [x] Gene search completed")
    
    # Update status to completed
    update_job_status(job_id, 'completed', result=result)
    
    return result


def process_pipeline(task_data):
    """
    Process legacy pipeline task (existing functionality).
    """
    genome_file = task_data.get('genome_file')
    
    if not genome_file:
        print(" [x] No 'genome_file' specific field, checking for 'args'...")
        script_args = task_data.get('args', [])
        if not script_args:
            raise ValueError("No genome_file or args provided")
        input_path = None
    else:
        input_path = os.path.join(GENOMES_DIR, genome_file)
        if not os.path.exists(input_path):
            raise ValueError("Genome file not found at %s" % input_path)
    
    pipeline_env = os.environ.copy()
    options = task_data.get('options', {})
    if options:
        print(" [x] Applying configuration options: %s" % str(options))
        for key, value in options.items():
            pipeline_env[key] = str(value)

    if input_path:
        cmd = ["/bin/bash", "/app/run_pipeline.sh", input_path]
    else:
        cmd = ["/bin/bash", "/app/run_pipeline.sh"] + task_data.get('args', [])
    
    print(" [x] Executing Pipeline: %s" % " ".join(cmd))
    
    start_time = time.time()
    return_code = subprocess.call(cmd, env=pipeline_env)
    end_time = time.time()
    duration = end_time - start_time
    print(" [x] Execution Duration: %.2f seconds" % duration)

    if return_code == 0:
        print(" [x] Pipeline completed successfully")
        return {'status': 'completed', 'duration': duration}
    else:
        print(" [!] Pipeline failed with return code: %d" % return_code)
        return {'status': 'failed', 'return_code': return_code, 'duration': duration}


def process_custom_analysis(task_data):
    """
    Process custom analysis request from frontend (legacy).
    Runs the complete_pipeline_run.sh with user-specified parameters.
    """
    job_id = task_data.get('jobId', 'unknown')
    species = task_data.get('species')
    options = task_data.get('options', {})
    
    print(" [x] Processing CUSTOM ANALYSIS:")
    print("     Job ID: %s" % job_id)
    print("     Species: %s" % species)
    print("     Options: %s" % str(options))
    
    # Update status to processing
    update_job_status(job_id, 'processing')
    
    # Validate species
    if species not in SPECIES_CONFIG:
        error_msg = "Unknown species: %s" % species
        update_job_status(job_id, 'failed', error=error_msg)
        raise ValueError(error_msg)
    
    # Get genome file path
    genome_config = SPECIES_CONFIG[species]
    genome_file = os.path.join(GENOMES_DIR, genome_config['genome_file'])
    
    if not os.path.exists(genome_file):
        error_msg = "Genome file not found: %s" % genome_file
        update_job_status(job_id, 'failed', error=error_msg)
        raise ValueError(error_msg)
    
    # Build command (align with current script contract: arg8 = job_id)
    cmd = [
        "/bin/bash",
        "/app/scripts/complete_pipeline_run.sh",
        genome_file,
        species,
        "0",
        "0",
        "NGG",
        "20",
        "3",
        job_id,
    ]
    
    print(" [x] Executing: %s" % " ".join(cmd))
    
    start_time = time.time()
    
    try:
        # Run the pipeline
        return_code = subprocess.call(cmd)
        end_time = time.time()
        duration = end_time - start_time
        print(" [x] Execution Duration: %.2f seconds" % duration)
        
        if return_code == 0:
            # Read output file path (unique per job)
            output_dir = os.path.dirname(genome_file)
            output_file = os.path.join(output_dir, 'output', '%s.tsv' % job_id)
            
            result = {
                'status': 'completed',
                'duration': duration,
                'outputFile': output_file
            }
            
            update_job_status(job_id, 'completed', result=result)
            
            # Send email notification
            send_notification(job_id, 'completed', output_file=output_file)
            
            return result
        else:
            error_msg = "Pipeline failed with return code: %d" % return_code
            update_job_status(job_id, 'failed', error=error_msg)
            send_notification(job_id, 'failed', error_msg=error_msg)
            return {'status': 'failed', 'return_code': return_code}
            
    except Exception as e:
        error_msg = str(e)
        print(" [!] Pipeline error: %s" % error_msg)
        update_job_status(job_id, 'failed', error=error_msg)
        return {'status': 'failed', 'error': error_msg}


def callback(ch, method, properties, body):
    print(" [x] Received task")
    try:
        task_data = json.loads(body)
        print(" [x] Data: %s" % str(task_data))
        
        task_type = task_data.get('type')
        job_id = task_data.get('jobId')
        
        if task_type == 'region_analysis':
            # NEW: Handle region_analysis from updated frontend
            result = process_region_analysis(task_data)
            print(" [x] Region analysis result: %s" % str(result))
            
        elif task_type == 'region_search':
            result = process_region_search(task_data)
            print(" [x] Region search result: %s" % str(result))
            
        elif task_type == 'gene_search':
            result = process_gene_search(task_data)
            print(" [x] Gene search result: %s" % str(result))
            
        elif task_type == 'custom_analysis':
            result = process_custom_analysis(task_data)
            print(" [x] Custom analysis result: %s" % str(result))
            
        else:
            result = process_pipeline(task_data)
            print(" [x] Pipeline result: %s" % str(result))

    except Exception as e:
        error_msg = str(e)
        print(" [!] Error processing task: %s" % error_msg)
        
        # Try to update job status to failed if we have a job_id
        job_id = None
        try:
            task_data = json.loads(body)
            job_id = task_data.get('jobId')
        except:
            pass
        
        if job_id:
            update_job_status(job_id, 'failed', error=error_msg)

    ch.basic_ack(delivery_tag=method.delivery_tag)
    print(" [x] Done")

if __name__ == '__main__':
    main()
