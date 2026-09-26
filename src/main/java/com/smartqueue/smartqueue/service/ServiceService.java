package com.smartqueue.smartqueue.service;

import com.smartqueue.smartqueue.model.Service;
import com.smartqueue.smartqueue.repository.ServiceRepository;

import java.util.List;

@org.springframework.stereotype.Service
public class ServiceService {

    private final ServiceRepository serviceRepository;

    public ServiceService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    public Service createService(Service service) {
        return serviceRepository.save(service);
    }

    public List<Service> getAllServices() {
        return serviceRepository.findAll();
    }

    public void deleteService(Long id) {
        serviceRepository.deleteById(id);
    }
}