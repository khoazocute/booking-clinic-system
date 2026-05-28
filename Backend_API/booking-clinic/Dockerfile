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

# Render web services scan for an open port; Spring Boot reads the real
# value from the PORT environment variable and falls back to 8082 locally.
EXPOSE 10000

# Khởi động ứng dụng với múi giờ Việt Nam
ENTRYPOINT ["java", "-Duser.timezone=Asia/Ho_Chi_Minh", "-jar", "app.jar"]
