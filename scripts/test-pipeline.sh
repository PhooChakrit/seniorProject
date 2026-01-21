#!/bin/bash
# =============================================================================
# CRISPR-PLANT Pipeline Test Script
# =============================================================================
# Description: Benchmark and test the CRISPR pipeline on genome files
# Usage: ./scripts/test-pipeline.sh [options]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
GENOME_DIR="/data/genomes"
OUTPUT_DIR="/data/genomes/test_output"
VERBOSE=false

# Print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "\n${CYAN}=== $1 ===${NC}\n"; }

# Show usage
usage() {
    cat << EOF
CRISPR-PLANT Pipeline Test Script

Usage: $0 [options]

Options:
    -f, --file FILE     Run pipeline on specific FASTA file
    -d, --dir DIR       Run pipeline on all FASTA files in directory
    -l, --list          List available genome files
    -b, --benchmark     Run full benchmark (all files in genomes dir)
    -c, --check         Check if all dependencies are installed
    -h, --help          Show this help message

Examples:
    $0 --list                    # List available genome files
    $0 --check                   # Check dependencies
    $0 -f /data/genomes/oryza/genome.fa   # Run on specific file
    $0 --benchmark               # Run benchmark on all files

EOF
}

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    local deps=("fuzznuc" "vsearch" "python")
    local all_ok=true
    
    for dep in "${deps[@]}"; do
        if command -v "$dep" &> /dev/null; then
            version=$($dep --version 2>&1 | head -1 || echo "unknown")
            print_success "$dep is installed: $version"
        else
            print_error "$dep is NOT installed"
            all_ok=false
        fi
    done
    
    echo ""
    if [ "$all_ok" = true ]; then
        print_success "All dependencies are installed!"
        return 0
    else
        print_error "Some dependencies are missing"
        return 1
    fi
}

# List available genome files
list_genomes() {
    print_header "Available Genome Files"
    
    if [ ! -d "$GENOME_DIR" ]; then
        print_error "Genome directory not found: $GENOME_DIR"
        exit 1
    fi
    
    echo "Searching in: $GENOME_DIR"
    echo ""
    
    local count=0
    while IFS= read -r -d '' file; do
        size=$(du -h "$file" | cut -f1)
        basename=$(basename "$file")
        dirname=$(dirname "$file")
        printf "  %-50s %s\n" "$basename" "($size)"
        ((count++))
    done < <(find "$GENOME_DIR" -type f \( -name "*.fa" -o -name "*.fasta" -o -name "*.fna" \) -print0 2>/dev/null)
    
    echo ""
    print_info "Found $count genome file(s)"
}

# Run pipeline on a single file
run_pipeline() {
    local input_file="$1"
    local test_name="${2:-test}"
    
    if [ ! -f "$input_file" ]; then
        print_error "File not found: $input_file"
        return 1
    fi
    
    local file_size=$(du -h "$input_file" | cut -f1)
    local file_name=$(basename "$input_file")
    local work_dir=$(dirname "$input_file")
    
    print_header "Running Pipeline: $file_name"
    echo "File size: $file_size"
    echo "Working directory: $work_dir"
    echo ""
    
    # Record start time
    local start_time=$(date +%s)
    local start_date=$(date '+%Y-%m-%d %H:%M:%S')
    echo "Start time: $start_date"
    echo ""
    
    # Run the pipeline
    cd "$work_dir"
    
    # Step 1: fuzznuc
    print_info "[1/3] Running fuzznuc (PAM detection)..."
    local step1_start=$(date +%s)
    fuzznuc -sequence "$input_file" -pattern "${PAM_PATTERN:-N(20)NGG}" -outfile GENOME_NGG_spacers.fuzznuc 2>&1
    local step1_end=$(date +%s)
    local step1_time=$((step1_end - step1_start))
    print_success "fuzznuc completed in ${step1_time}s"
    
    # Step 2: Convert to FASTA
    print_info "[2/3] Converting to FASTA..."
    local step2_start=$(date +%s)
    python /app/CRISPR-PLANTv2/python-scripts/cp_fuzznuc_to_fasta.py \
        GENOME_NGG_spacers.fuzznuc \
        GENOME_NGG_spacers.fa \
        GENOME_NGG_spacers.ids 2>&1
    local step2_end=$(date +%s)
    local step2_time=$((step2_end - step2_start))
    print_success "Conversion completed in ${step2_time}s"
    
    # Step 3: VSEARCH clustering
    print_info "[3/3] Running vsearch clustering..."
    local step3_start=$(date +%s)
    vsearch --derep_fulllength GENOME_NGG_spacers.fa \
            --output GENOME_NGG_spacers_unique.fa \
            --sizeout \
            --minseqlength "${MIN_SEQ_LENGTH:-20}" 2>&1
    local step3_end=$(date +%s)
    local step3_time=$((step3_end - step3_start))
    print_success "Clustering completed in ${step3_time}s"
    
    # Record end time
    local end_time=$(date +%s)
    local end_date=$(date '+%Y-%m-%d %H:%M:%S')
    local total_time=$((end_time - start_time))
    
    # Count results
    local total_spacers=$(grep -c "^>" GENOME_NGG_spacers.fa 2>/dev/null || echo "0")
    local unique_spacers=$(grep -c "^>" GENOME_NGG_spacers_unique.fa 2>/dev/null || echo "0")
    
    # Print summary
    echo ""
    print_header "Pipeline Summary"
    echo "┌─────────────────────────────────────────────────────┐"
    printf "│ %-20s %-30s │\n" "Input file:" "$file_name"
    printf "│ %-20s %-30s │\n" "File size:" "$file_size"
    echo "├─────────────────────────────────────────────────────┤"
    printf "│ %-20s %-30s │\n" "Step 1 (fuzznuc):" "${step1_time}s"
    printf "│ %-20s %-30s │\n" "Step 2 (convert):" "${step2_time}s"
    printf "│ %-20s %-30s │\n" "Step 3 (vsearch):" "${step3_time}s"
    echo "├─────────────────────────────────────────────────────┤"
    printf "│ %-20s %-30s │\n" "Total time:" "${total_time}s"
    printf "│ %-20s %-30s │\n" "Total spacers:" "$total_spacers"
    printf "│ %-20s %-30s │\n" "Unique spacers:" "$unique_spacers"
    echo "└─────────────────────────────────────────────────────┘"
    
    # Return results as JSON-like format for parsing
    echo ""
    echo "RESULT_JSON: {\"file\": \"$file_name\", \"size\": \"$file_size\", \"total_time\": $total_time, \"spacers\": $total_spacers, \"unique\": $unique_spacers}"
    
    return 0
}

# Run benchmark on all genome files
run_benchmark() {
    print_header "Starting Full Benchmark"
    
    local results=()
    local total_files=0
    local total_time=0
    
    # Find all FASTA files
    while IFS= read -r -d '' file; do
        ((total_files++))
        echo ""
        print_info "Processing file $total_files: $(basename "$file")"
        
        if run_pipeline "$file" "benchmark"; then
            print_success "Completed: $(basename "$file")"
        else
            print_error "Failed: $(basename "$file")"
        fi
        
        echo ""
        echo "─────────────────────────────────────────────────────"
    done < <(find "$GENOME_DIR" -type f \( -name "*.fa" -o -name "*.fasta" -o -name "*.fna" \) -print0 2>/dev/null)
    
    echo ""
    print_header "Benchmark Complete"
    print_info "Processed $total_files file(s)"
}

# Main function
main() {
    # Parse arguments
    if [ $# -eq 0 ]; then
        usage
        exit 0
    fi
    
    while [ $# -gt 0 ]; do
        case "$1" in
            -h|--help)
                usage
                exit 0
                ;;
            -l|--list)
                list_genomes
                exit 0
                ;;
            -c|--check)
                check_dependencies
                exit $?
                ;;
            -f|--file)
                shift
                if [ -z "$1" ]; then
                    print_error "No file specified"
                    exit 1
                fi
                run_pipeline "$1"
                exit $?
                ;;
            -d|--dir)
                shift
                if [ -z "$1" ]; then
                    print_error "No directory specified"
                    exit 1
                fi
                GENOME_DIR="$1"
                run_benchmark
                exit $?
                ;;
            -b|--benchmark)
                run_benchmark
                exit $?
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
        shift
    done
}

# Run main
main "$@"
