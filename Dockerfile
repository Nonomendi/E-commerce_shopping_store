FROM ubuntu:22.04
MAINTAINER Tech Team "nomendi022@student.wethinkcode.co.za"
WORKDIR /app

COPY . .

RUN apt-get update
RUN apt-get install -y openjdk-11-jre
RUN apt-get install -y maven
RUN apt-get install -y git
RUN mvn clean package

ADD  target/robot_worlds-1.0-SNAPSHOT-jar-with-dependencies.jar /src/robot-world-server.jar

WORKDIR /src
EXPOSE 5000

CMD ["java", "-jar", "robot-world-server.jar"]


