#!/bin/bash

# Supabase配置
SUPABASE_URL="https://hdkayzkpjmmxjkbxrglo.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2F5emtwam1teGprYnhyZ2xvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg1MzQxMSwiZXhwIjoyMDkxNDI5NDExfQ.8Mg61xsfvNnwyL8pI1Ks1zncq7YQQ-_svTYcy-xehfU"
BUCKET="website"

echo "开始上传文件到Supabase Storage..."

# 上传index.html
echo "上传 index.html..."
curl -X POST \
  "${SUPABASE_URL}/storage/v1/object/${BUCKET}/index.html" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: text/html" \
  -H "x-upsert: true" \
  --data-binary @dist/index.html

# 上传assets目录下的所有文件
for file in dist/assets/*; do
  filename=$(basename "$file")
  ext="${filename##*.}"
  
  # 根据扩展名设置Content-Type
  case $ext in
    js)
      content_type="application/javascript"
      ;;
    css)
      content_type="text/css"
      ;;
    html)
      content_type="text/html"
      ;;
    *)
      content_type="application/octet-stream"
      ;;
  esac
  
  echo "上传 assets/${filename} (Content-Type: ${content_type})..."
  curl -X POST \
    "${SUPABASE_URL}/storage/v1/object/${BUCKET}/assets/${filename}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: ${content_type}" \
    -H "x-upsert: true" \
    --data-binary @"$file"
done

echo ""
echo "上传完成！"
