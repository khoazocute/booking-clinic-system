# Step 1: Build stage
# static files are platform-independent: build once on the native builder, even for an arm64 image
FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app

# Sao chép package.json và lockfile để tải trước dependency (giúp tận dụng cache)
COPY package*.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Nhận biến API URL lúc build, nếu không truyền sẽ mặc định là localhost:8082
ARG VITE_API_BASE_URL=http://localhost:8082/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Google sign-in. The OAuth client ID is public (it ships in the page's JavaScript); .env is not copied into
# the image, so it has to be passed as a build argument. Empty = the Google button is hidden.
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

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
