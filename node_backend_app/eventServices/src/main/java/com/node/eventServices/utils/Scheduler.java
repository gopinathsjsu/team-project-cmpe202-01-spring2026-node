package com.node.eventServices.utils;

import com.node.eventServices.repository.EventRepository;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.node.eventServices.service.EventManagementService;

import java.time.LocalDate;

@Component
@Slf4j
public class Scheduler {

    @Autowired
    private EventManagementService eventService;

    // runs every day at 11:59:00 PM
    @Scheduled(cron = "0 59 11 * * *")
    public void markPassedEventsCompleted() {
        LocalDate today = LocalDate.now();
        eventService.markEventsCompletedBefore(today);
        log.info("Scheduler: marked events completed with date before {}", today);
    }
}
