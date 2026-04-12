package com.node.eventServices;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.node.eventServices.repository")
public class EventServicesApplication {

    public static void main(String[] args) {
        SpringApplication.run(EventServicesApplication.class, args);
    }

}
