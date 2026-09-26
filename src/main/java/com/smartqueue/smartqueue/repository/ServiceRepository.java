package com.smartqueue.smartqueue.repository;

import com.smartqueue.smartqueue.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRepository extends JpaRepository<Service, Long> {
}
