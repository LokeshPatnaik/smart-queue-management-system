package com.smartqueue.smartqueue.controller;

import com.smartqueue.smartqueue.model.QueueTicket;
import com.smartqueue.smartqueue.service.QueueTicketService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/tickets")
public class QueueTicketController {

    private final QueueTicketService queueTicketService;

    public QueueTicketController(QueueTicketService queueTicketService) {
        this.queueTicketService = queueTicketService;
    }

    // Create ticket
    @PostMapping
    public QueueTicket createTicket(
            @RequestBody QueueTicket ticket,
            Authentication authentication) {

        String customerEmail = authentication.getName();

        return queueTicketService.createTicket(
                ticket,
                customerEmail
        );
    }

    // Get all tickets
    @GetMapping
    public List<QueueTicket> getAllTickets() {
        return queueTicketService.getAllTickets();
    }

    // Get queue position
    @GetMapping("/{id}/queue-position")
    public Map<String, Integer> getQueuePosition(
            @PathVariable Long id) {

        int peopleAhead = queueTicketService.getPeopleAhead(id);

        int estimatedWait =
                queueTicketService.getEstimatedWaitTime(id);

        return Map.of(
                "peopleAhead", peopleAhead,
                "estimatedWaitMinutes", estimatedWait
        );
    }

    // Call next customer
    @PostMapping("/call-next/{serviceId}")
    public QueueTicket callNext(@PathVariable Long serviceId) {
        return queueTicketService.callNext(serviceId);
    }

    // Complete customer
    @PostMapping("/{id}/complete")
    public QueueTicket completeTicket(@PathVariable Long id) {
        return queueTicketService.completeTicket(id);
    }
}