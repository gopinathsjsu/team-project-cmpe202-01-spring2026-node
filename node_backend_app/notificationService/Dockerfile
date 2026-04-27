FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests \
    && find /app/target -maxdepth 1 -type f -name "*.jar" ! -name "*-plain.jar" -exec cp {} /app/application.jar \;

FROM eclipse-temurin:17-jre
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/application.jar application.jar
EXPOSE 8083
ENTRYPOINT ["java","-jar","application.jar"]
