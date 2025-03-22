#!/bin/bash
FILE=${1:-diagram.mmd}           # Default to 'diagram.mmd' if no argument is given
OUTFILE=${2:-output_diagram.svg} # Default to 'diagram.mmd' if no argument is given
npx mmdc -i "$FILE" -o "$OUTFILE"
