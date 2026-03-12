#!/bin/bash
# =============================================================================
# CRISPR-PLANT Docker Test Runner
# =============================================================================
# Description: Run pipeline tests inside Docker container
# Usage: ./scripts/docker-test.sh [options]
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "\n${CYAN}════════════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}\n"; }

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Show usage
usage() {
    cat << EOF
CRISPR-PLANT Docker Test Runner

Usage: $0 [command] [options]

Commands:
    status          Check status of all services
    list            List available genome files
    check           Check worker dependencies
    test FILE       Run pipeline on specific file
    benchmark       Run benchmark on all files
    logs            Show worker logs
    shell           Open shell in worker container

Examples:
    $0 status                              # Check Docker services
    $0 list                                # List available genomes
    $0 check                               # Check dependencies
    $0 test oryza/Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa
    $0 benchmark                           # Run full benchmark

EOF
}

# Check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        exit 1
    fi
}

# Check if services are up
check_services() {
    print_header "Docker Services Status"
    
    cd "$PROJECT_DIR"
    docker compose ps 2>&1 | grep -v "WARN"
    
    echo ""
    
    # Check worker specifically
    if docker compose ps worker 2>&1 | grep -q "running"; then
        print_success "Worker service is running"
    else
        print_error "Worker service is NOT running"
        echo ""
        print_info "Start services with: docker compose up -d"
        exit 1
    fi
}

# List genome files
list_genomes() {
    print_header "Available Genome Files"
    
    cd "$PROJECT_DIR"
    docker compose exec worker bash -c "
        echo 'Searching in /data/genomes...'
        echo ''
        find /data/genomes -type f \( -name '*.fa' -o -name '*.fasta' -o -name '*.fna' \) -exec ls -lh {} \; 2>/dev/null | awk '{print \$NF, \"(\"\$5\")\"}' | sort
        echo ''
        echo 'Total files:' \$(find /data/genomes -type f \( -name '*.fa' -o -name '*.fasta' -o -name '*.fna' \) 2>/dev/null | wc -l)
    " 2>&1 | grep -v "WARN"
}

# Check dependencies
check_deps() {
    print_header "Checking Worker Dependencies"
    
    cd "$PROJECT_DIR"
    docker compose exec worker bash -c "
        echo '=== fuzznuc ==='
        fuzznuc -version 2>&1 | head -2 || echo 'NOT FOUND'
        echo ''
        echo '=== vsearch ==='
        vsearch --version 2>&1 | head -1 || echo 'NOT FOUND'
        echo ''
        echo '=== python ==='
        python --version 2>&1 || echo 'NOT FOUND'
        echo ''
        echo '=== pika ==='
        python -c 'import pika; print(\"pika:\", pika.__version__)' 2>&1 || echo 'NOT FOUND'
    " 2>&1 | grep -v "WARN"
}

# Run test on specific file
run_test() {
    local file="$1"
    
    if [ -z "$file" ]; then
        print_error "Please specify a genome file"
        echo ""
        echo "Usage: $0 test <relative_path_to_genome>"
        echo "Example: $0 test oryza/Oryza_sativa.IRGSP-1.0.dna.chromosome.1.fa"
        exit 1
    fi
    
    print_header "Running Pipeline Test"
    print_info "File: $file"
    echo ""
    
    cd "$PROJECT_DIR"
    
    # Check if file exists
    if ! docker compose exec worker test -f "/data/genomes/$file" 2>&1 | grep -q ""; then
        # File might exist, continue
        :
    fi
    
    # Run with timing
    docker compose exec worker bash -c "
        INPUT='/data/genomes/$file'
        
        if [ ! -f \"\$INPUT\" ]; then
            echo 'ERROR: File not found: \$INPUT'
            exit 1
        fi
        
        FILE_SIZE=\$(du -h \"\$INPUT\" | cut -f1)
        echo 'Input: \$INPUT'
        echo 'Size: \$FILE_SIZE'
        echo ''
        
        START=\$(date +%s)
        echo 'Start: '\$(date '+%Y-%m-%d %H:%M:%S')
        echo ''
        
        # Run pipeline
        /bin/bash /app/run_pipeline.sh \"\$INPUT\"
        
        END=\$(date +%s)
        DURATION=\$((END-START))
        
        echo ''
        echo '═══════════════════════════════════════════════════════════'
        echo '  RESULTS'
        echo '═══════════════════════════════════════════════════════════'
        echo ''
        echo \"Duration: \${DURATION} seconds\"
        
        WORK_DIR=\$(dirname \"\$INPUT\")
        cd \"\$WORK_DIR\"
        
        if [ -f GENOME_NGG_spacers.fa ]; then
            TOTAL=\$(grep -c '^>' GENOME_NGG_spacers.fa 2>/dev/null || echo 0)
            echo \"Total spacers: \$TOTAL\"
        fi
        
        if [ -f GENOME_NGG_spacers_unique.fa ]; then
            UNIQUE=\$(grep -c '^>' GENOME_NGG_spacers_unique.fa 2>/dev/null || echo 0)
            echo \"Unique spacers: \$UNIQUE\"
        fi
        
        echo ''
        echo 'Output files:'
        ls -lh GENOME_NGG_spacers* 2>/dev/null || echo 'No output files found'
    " 2>&1 | grep -v "WARN"
}

# Run benchmark
run_benchmark() {
    print_header "Running Full Benchmark"
    
    cd "$PROJECT_DIR"
    
    docker compose exec worker bash -c "
        echo 'Finding all FASTA files in /data/genomes...'
        echo ''
        
        TOTAL_START=\$(date +%s)
        FILE_COUNT=0
        
        for file in \$(find /data/genomes -type f \( -name '*.fa' -o -name '*.fasta' -o -name '*.fna' \) 2>/dev/null); do
            FILE_COUNT=\$((FILE_COUNT + 1))
            echo ''
            echo '─────────────────────────────────────────────────────────────'
            echo \"File \$FILE_COUNT: \$file\"
            echo '─────────────────────────────────────────────────────────────'
            
            FILE_SIZE=\$(du -h \"\$file\" | cut -f1)
            echo \"Size: \$FILE_SIZE\"
            
            START=\$(date +%s)
            
            /bin/bash /app/run_pipeline.sh \"\$file\" 2>&1
            
            END=\$(date +%s)
            DURATION=\$((END-START))
            echo \"Time: \${DURATION}s\"
        done
        
        TOTAL_END=\$(date +%s)
        TOTAL_DURATION=\$((TOTAL_END - TOTAL_START))
        
        echo ''
        echo '═══════════════════════════════════════════════════════════'
        echo '  BENCHMARK COMPLETE'
        echo '═══════════════════════════════════════════════════════════'
        echo ''
        echo \"Total files processed: \$FILE_COUNT\"
        echo \"Total time: \${TOTAL_DURATION}s\"
    " 2>&1 | grep -v "WARN"
}

# Show worker logs
show_logs() {
    cd "$PROJECT_DIR"
    docker compose logs -f worker 2>&1 | grep -v "WARN"
}

# Open shell
open_shell() {
    cd "$PROJECT_DIR"
    print_info "Opening shell in worker container..."
    print_info "Type 'exit' to leave"
    echo ""
    docker compose exec worker bash 2>&1 | grep -v "WARN" || docker compose exec worker sh
}

# Main
main() {
    check_docker
    
    case "${1:-}" in
        status)
            check_services
            ;;
        list)
            list_genomes
            ;;
        check)
            check_deps
            ;;
        test)
            shift
            run_test "$@"
            ;;
        benchmark)
            run_benchmark
            ;;
        logs)
            show_logs
            ;;
        shell)
            open_shell
            ;;
        -h|--help|help|"")
            usage
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            usage
            exit 1
            ;;
    esac
}

main "$@"
