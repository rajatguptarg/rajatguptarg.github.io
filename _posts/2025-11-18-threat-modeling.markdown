---
layout: post
title: "Threat Modeling: The Ultimate Guide"
date: 2025-11-18 00:00:00 +0100
categories: security threat-modeling devsecops
---

# Threat Modeling: The Ultimate Guide for Modern Engineering Teams

A proactive approach to building secure software in the DevSecOps era.

![Security diagram with shield and gears](data:image/png;base64,...) <!-- replace ... with original base64 data if you want the inline image -->

This guide emphasizes the critical need for **threat modeling** as a proactive security practice integrated into modern software development, instead of treating security as a final gate at the end of the lifecycle. It highlights the high cost of breaches and stresses building security into the development process from the start, aligned with the “shift left” movement.

## Why Threat Modeling Is Crucial Now: The DevSecOps Imperative

- **Modern relevance**  
  Threat modeling has roots in 20th century military planning, but its relevance is amplified today by DevSecOps, which integrates security into every stage of the software delivery lifecycle rather than isolating it at the end.

- **Continuous conversation**  
  Modern threat modeling is a continuous, collaborative conversation that runs through the entire SDLC. It involves developers, security professionals, architects, SREs, and product owners, rather than a one-time workshop run only by security.

- **Collaborative advantage**  
  This approach combines the deep context of the engineers who build the system with the broad view of patterns and attack techniques that security experts bring. Together they can identify realistic threats and practical mitigations.

![Security diagram with shield and gears](data:image/png;base64,...) <!-- replace ... with original base64 data -->

## Core Threat Modeling Methodologies

This guide introduces **STRIDE** as a proven and intuitive framework for categorizing threats. Developed at Microsoft in 1999, STRIDE gives teams a shared vocabulary for systematically thinking about how their systems can be attacked.

Using a simple example like a user profile service, you can walk through each STRIDE category.

### S – Spoofing: Impersonating another entity

- **Threat example**  
  An attacker uses stolen session cookies to act as a legitimate user.

- **Mitigations**  
  - Strict session validation on every request  
  - Short-lived tokens  
  - Multi-factor authentication

### T – Tampering: Modifying data or code

- **Threat example**  
  A malicious user intercepts an API call and changes their role from `user` to `admin`.

- **Mitigations**  
  - Digital signatures such as HMAC for data integrity  
  - Server-side validation of all critical fields  
  - Never trusting data from the client

### R – Repudiation: Denying an action was performed

- **Threat example**  
  A user deletes data and later denies doing so, with no way to prove it.

- **Mitigations**  
  - Comprehensive, immutable audit logs  
  - Logging who did what and when, with sufficient detail to reconstruct events

### I – Information Disclosure: Exposing information to unauthorized individuals

- **Threat example**  
  An API endpoint accidentally leaks sensitive personally identifiable information (PII).

- **Mitigations**  
  - Principle of least privilege in data access  
  - Endpoints that only return data strictly required by the client  
  - Encryption of data in transit (TLS) and at rest

### D – Denial of Service (DoS): Making a system or service unavailable

- **Threat example**  
  An unauthenticated, computationally expensive endpoint is spammed, overwhelming the server.

- **Mitigations**  
  - Rate limiting and throttling  
  - Circuit breakers and back-pressure  
  - Scalable infrastructure that can absorb and shed load gracefully

### E – Elevation of Privilege: Gaining unauthorized capabilities

- **Threat example**  
  A standard user accesses an administrative function just by guessing or constructing a predictable URL.

- **Mitigations**  
  - Robust, role-based access control (RBAC), enforced server-side on every request  
  - Defense-in-depth checks at API, service, and data layers

Other methodologies that teams sometimes use include:

- **PASTA**  
  A risk-centric, business-focused framework that aligns technical threats with business impact.
- **Attack Trees**  
  A visual way to map paths an attacker could take to reach a goal.

The important thing is consistency. Pick a primary method and make it part of how you design and review systems, instead of switching frameworks each time.

![Team collaborating on a whiteboard](data:image/png;base64,...) <!-- replace ... with original base64 data -->

## Threat Modeling as Code

To keep threat models up to date in fast-moving, agile environments, this guide highlights **Threat Modeling as Code**. Instead of treating threat models as separate documents that drift, you embed threat information directly into your source code as annotations.

Key ideas:

- **Workflow**  
  - Keep security context right next to implementation details.  
  - Use annotations or metadata in code to describe assets, threats, and mitigations.  
  - Generate up-to-date models automatically as part of CI/CD, rather than manually updating diagrams.

- **Tools**  
  - **OWASP pytm**  
  - **threatspec**  

These tools help scan annotated code and produce machine readable models plus human friendly reports.

### Example with `threatspec` in Go

```go
// @exposes Web:Form to #XSS due to lack of output encoding
// @mitigates MyService:Database against #SQLInjection by using prepared statements
func handler(w http.ResponseWriter, r *http.Request) {
    // 1. Get user input from the request
    userInput := r.URL.Query().Get("q")

    // 2. Query the database using a prepared statement (GOOD)
    rows, err := db.Query("SELECT name FROM users WHERE name = ?", userInput)
    if err != nil {
        // handle error
    }
    defer rows.Close()

    // ... process rows

    // 3. Render the input back to the user without encoding (BAD)
    fmt.Fprintf(w, "You searched for: %s", userInput)
}
