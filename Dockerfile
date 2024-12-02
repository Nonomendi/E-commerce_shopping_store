FROM maven:3.9.8 AS builder
COPY pom.xml pom.xml
RUN mkdir Server
COPY Server/pom.xml Server/pom.xml
COPY Server/src Server/src
RUN cd Server && mvn clean package -DskipTests

FROM openjdk:20
COPY --from=builder Server/target/Server-1.0-SNAPSHOT-jar-with-dependencies.jar app.jar
EXPOSE 5000
ENTRYPOINT ["java", "-jar", "app.jar"]