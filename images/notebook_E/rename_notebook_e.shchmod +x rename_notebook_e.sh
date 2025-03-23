#!/bin/bash

# Loop through all files matching the Notebook E pattern
for file in "Notebook E_page_"*.jpg; do
  if [ -f "$file" ]; then
    # Extract the number part
    number=$(echo "$file" | grep -o '[0-9]\+')
    
    # Create new filename with hyphen instead of underscore
    new_name="Notebook E_page-${number}.jpg"
    
    # Rename the file
    mv "$file" "$new_name"
    echo "Renamed: $file → $new_name"
  fi
done

echo "Renaming complete!"


