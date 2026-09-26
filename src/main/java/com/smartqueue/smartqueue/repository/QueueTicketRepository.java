package com.smartqueue.smartqueue.repository;

import com.smartqueue.smartqueue.model.QueueTicket;
import com.smartqueue.smartqueue.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QueueTicketRepository extends JpaRepository<QueueTicket, Long> {

    long countByService(Service service);

    List<QueueTicket> findByServiceAndStatusOrderByCreatedAtAsc(
            Service service,
            String status
    );
}