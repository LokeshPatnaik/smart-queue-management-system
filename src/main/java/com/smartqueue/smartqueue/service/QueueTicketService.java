package com.smartqueue.smartqueue.service;

import com.smartqueue.smartqueue.model.QueueTicket;
import com.smartqueue.smartqueue.model.Service;
import com.smartqueue.smartqueue.model.User;
import com.smartqueue.smartqueue.repository.QueueTicketRepository;
import com.smartqueue.smartqueue.repository.ServiceRepository;
import com.smartqueue.smartqueue.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@org.springframework.stereotype.Service
public class QueueTicketService {

    private final QueueTicketRepository queueTicketRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;

    public QueueTicketService(
            QueueTicketRepository queueTicketRepository,
            ServiceRepository serviceRepository,
            UserRepository userRepository) {

        this.queueTicketRepository = queueTicketRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
    }

    // =====================================================
    // CREATE TICKET
    // =====================================================

    public QueueTicket createTicket(
            QueueTicket ticket,
            String customerEmail) {

        // Find the logged-in customer
        User customer = userRepository
                .findByEmail(customerEmail)
                .orElseThrow(() ->
                        new RuntimeException("Customer not found"));

        // Get selected service
        Long serviceId = ticket.getService().getId();

        Service service = serviceRepository
                .findById(serviceId)
                .orElseThrow(() ->
                        new RuntimeException("Service not found"));

        // Attach the actual customer
        ticket.setUser(customer);

        // Attach the actual service
        ticket.setService(service);

        // Generate token prefix
        String prefix = getPrefix(service.getName());

        // Count tickets for this service
        long count =
                queueTicketRepository.countByService(service);

        // Generate token number
        ticket.setTokenNumber(
                prefix + "-" + String.format("%03d", count + 1)
        );

        // Set initial status
        ticket.setStatus("WAITING");

        // Set creation time
        ticket.setCreatedAt(LocalDateTime.now());

        return queueTicketRepository.save(ticket);
    }

    // =====================================================
    // TOKEN PREFIX
    // =====================================================

    private String getPrefix(String serviceName) {

        if (serviceName.equalsIgnoreCase("Cash Withdrawal")) {
            return "CW";
        }

        if (serviceName.equalsIgnoreCase("Cash Deposit")) {
            return "CD";
        }

        if (serviceName.equalsIgnoreCase("Account Opening")) {
            return "AO";
        }

        if (serviceName.equalsIgnoreCase("KYC Update")) {
            return "KYC";
        }

        return "Q";
    }

    // =====================================================
    // GET ALL TICKETS
    // =====================================================

    public List<QueueTicket> getAllTickets() {
        return queueTicketRepository.findAll();
    }

    // =====================================================
    // PEOPLE AHEAD
    // =====================================================

    public int getPeopleAhead(Long ticketId) {

        QueueTicket ticket =
                queueTicketRepository.findById(ticketId)
                        .orElseThrow(() ->
                                new RuntimeException("Ticket not found"));

        List<QueueTicket> waitingTickets =
                queueTicketRepository
                        .findByServiceAndStatusOrderByCreatedAtAsc(
                                ticket.getService(),
                                "WAITING"
                        );

        int peopleAhead = 0;

        for (QueueTicket waitingTicket : waitingTickets) {

            if (waitingTicket.getId().equals(ticketId)) {
                break;
            }

            peopleAhead++;
        }

        return peopleAhead;
    }

    // =====================================================
    // ESTIMATED WAIT TIME
    // =====================================================

    public int getEstimatedWaitTime(Long ticketId) {

        int peopleAhead =
                getPeopleAhead(ticketId);

        return peopleAhead * 5;
    }

    // =====================================================
    // CALL NEXT CUSTOMER
    // =====================================================

    public QueueTicket callNext(Long serviceId) {

        Service service =
                serviceRepository.findById(serviceId)
                        .orElseThrow(() ->
                                new RuntimeException("Service not found"));

        List<QueueTicket> waitingTickets =
                queueTicketRepository
                        .findByServiceAndStatusOrderByCreatedAtAsc(
                                service,
                                "WAITING"
                        );

        if (waitingTickets.isEmpty()) {
            throw new RuntimeException(
                    "No waiting tickets"
            );
        }

        QueueTicket nextTicket =
                waitingTickets.get(0);

        nextTicket.setStatus("SERVING");

        nextTicket.setCalledAt(
                LocalDateTime.now()
        );

        return queueTicketRepository.save(nextTicket);
    }

    // =====================================================
    // COMPLETE TICKET
    // =====================================================

    public QueueTicket completeTicket(Long ticketId) {

        QueueTicket ticket =
                queueTicketRepository.findById(ticketId)
                        .orElseThrow(() ->
                                new RuntimeException("Ticket not found"));

        ticket.setStatus("COMPLETED");

        ticket.setCompletedAt(
                LocalDateTime.now()
        );

        return queueTicketRepository.save(ticket);
    }
}