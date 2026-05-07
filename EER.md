# Enhanced Entity-Relationship (EER) Diagram

This document contains the structural design of the IPL Ticket Management System database, visualizing how users, matches, venues, and bookings interact.

## Visual Representation (Mermaid)

```mermaid
erDiagram
    USER ||--o{ BOOKING : "places"
    USER ||--o{ OTP : "requests"
    MATCH ||--o{ BOOKING : "scheduled for"
    STADIUM ||--o{ MATCH : "hosts"
    STADIUM ||--o{ STAND : "contains"
    BOOKING ||--o{ AUDIT_LOG : "triggers"
    MATCH ||--o{ AUDIT_LOG : "triggers updates"

    USER {
        int user_id PK
        string username
        string email UK
        string password
        boolean is_admin
        timestamp created_at
    }

    MATCH {
        int match_id PK
        string title
        string team1
        string team2
        string date_time
        string venue
        text about_text
        text highlights
    }

    STADIUM {
        int stadium_id PK
        string name
        string city UK
        int capacity
    }

    STAND {
        int stand_id PK
        string city_key FK
        string name
        int price
        int capacity
    }

    BOOKING {
        int booking_id PK
        string user_email FK
        int match_id FK
        string match_title
        string stand_name
        int quantity
        int total_amount
        string payment_id UK
        string order_id UK
        timestamp created_at
    }

    OTP {
        int otp_id PK
        string email
        string otp
        datetime expires_at
    }

    AUDIT_LOG {
        int audit_log_id PK
        string action_type
        string table_name
        int record_id
        string user_email
        timestamp action_timestamp
        text details
    }
```

## Entity Descriptions

### 1. USER
- **user_id**: Unique identifier for each account.
- **is_admin**: Boolean flag allowing access to revenue analytics and global booking oversight.

### 2. MATCH
- **match_id**: Primary key for match fixtures.
- **venue**: Linked logically to `STADIUM.name`.

### 3. STADIUM & STAND
- **stadium_id**: Primary key for venues.
- **stand_id**: Primary key for seating sections.
- **city_key**: Links stands to a stadium via its city (e.g., 'Bangalore').

### 4. BOOKING
- **booking_id**: Primary key for each transaction.
- **match_id**: Foreign key linking the purchase to a specific game.
- **user_email**: Foreign key linking the purchase to an account.

### 5. AUDIT_LOG
- **audit_log_id**: Primary key for system logs.
- **record_id**: Generic reference to the ID of the affected row (in `matches` or `bookings`).

### 6. OTP
- **otp_id**: Primary key for temporary verification codes.
