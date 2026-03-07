# Backend Dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Install compilers for code execution
RUN apk add --no-cache \
    python3 \
    gcc \
    g++ \
    musl-dev \
    nodejs

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
