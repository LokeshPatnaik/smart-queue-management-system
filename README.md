<div align="center">

# 🏦 Smart Queue Management System

### A digital queue management platform for modern banking services

Reduce physical waiting, improve queue visibility, and help staff manage customer flow efficiently.

<br>

![Java](https://img.shields.io/badge/Java-21%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

## 📌 Overview

**Smart Queue Management System** is a full-stack web application designed for banking environments where customers traditionally wait in physical queues.

The system provides a digital queue experience where customers can reserve their place remotely, receive a queue token, and monitor their progress while bank staff manage the queue through a dedicated dashboard.

### 👤 Customers can

- Register and securely log in
- Select a banking service
- Generate a digital queue token
- View their queue position
- View estimated waiting time
- Track ticket status

### 👨‍💼 Staff can

- Log in through a dedicated staff interface
- View waiting customers
- Monitor queue statistics
- Call the next customer
- Manage customers currently being served
- Complete customer service

The project combines a **React frontend**, **Spring Boot REST backend**, **PostgreSQL database**, and **JWT-based authentication**.

---

# 🎯 Problem Statement

Traditional banking queues can result in:

- Long physical waiting times
- Unclear queue positions
- Difficulty monitoring customer flow
- Inefficient manual queue management
- Poor visibility into service progress

This project provides a digital alternative where customers receive a queue token and can monitor their progress while staff manage the queue through a dedicated dashboard.

---

# ✨ Key Features

## 👤 Customer

- Customer registration
- Customer login
- JWT authentication
- Banking service selection
- Digital queue token generation
- Queue position tracking
- Estimated waiting time
- Ticket status tracking

## 👨‍💼 Staff

- Dedicated staff login
- Staff dashboard
- Waiting queue visualization
- Queue statistics
- Call Next customer
- Serving status
- Complete customer service

## 🔐 Security

- JWT-based authentication
- Role-based authorization
- Protected customer/staff endpoints
- Password hashing
- Environment-based sensitive configuration

---

# 🔄 System Workflow

```text
                    ┌─────────────────────┐
                    │      Customer       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Register / Login    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Select Bank Service │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Generate Token      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Waiting Queue       │
                    │ Position + ETA      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Staff Calls Next    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      SERVING        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      COMPLETED      │
                    └─────────────────────┘
