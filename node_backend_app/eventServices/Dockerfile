FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
# Repackaged boot jar + *-plain.jar both match *.jar; copy only the executable jar.
RUN mvn clean package -DskipTests \
    && find /app/target -maxdepth 1 -type f -name "*.jar" ! -name "*-plain.jar" -exec cp {} /app/application.jar \;

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/application.jar application.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","application.jar"]
