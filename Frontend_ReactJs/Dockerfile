# Step 1: Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Sao chép package.json và lockfile để tải trước dependency (giúp tận dụng cache)
COPY package*.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Nhận biến API URL lúc build, nếu không truyền sẽ mặc định là localhost:8082
ARG VITE_API_BASE_URL=http://localhost:8082/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build ứng dụng sang các file tĩnh (trong thư mục dist)
RUN npm run build

# Step 2: Production stage
FROM nginx:alpine

# Sao chép các file tĩnh đã build vào thư mục phục vụ của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sao chép file cấu hình Nginx tùy chỉnh vào container
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
