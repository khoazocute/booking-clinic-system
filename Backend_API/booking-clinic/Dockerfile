# Step 1: Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Sao chép pom.xml trước để tải các dependency cần thiết (giúp tận dụng cache của Docker)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Sao chép mã nguồn và thực hiện build thành file .jar
COPY src ./src
RUN mvn clean package -DskipTests

# Step 2: Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Sao chép file jar từ build stage sang chạy bằng JRE tối giản
COPY --from=build /app/target/*.jar app.jar

# Spring Boot đang cấu hình cổng chạy là 8082
EXPOSE 8082

# Khởi động ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]
