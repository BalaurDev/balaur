# BALAUR API Design Guidelines

This rule provides guidance for API design within the BALAUR framework.

## Description
API design in BALAUR should follow hypermedia and HATEOAS principles while maintaining clean, intuitive interfaces.

## Files
*.ts, *.js

## Instructions
- Design APIs with HATEOAS principles as the foundation of all interactions
- Use clear, consistent naming for all API endpoints, resources, and methods
- Implement proper resource linking with navigable relationships
- Every resource should be self-descriptive with clear documentation
- Design intuitive state transitions through hypermedia controls
- Implement proper status codes and error responses
- Ensure proper versioning strategy for APIs
- Design idempotent operations where appropriate to support retries
- Implement proper content negotiation
- Use consistent patterns for pagination, filtering, and sorting
- Follow REST maturity model principles to guide API design
- Provide discovery mechanisms for API consumers
- Support graceful API evolution with backward compatibility
- Implement proper rate limiting and throttling mechanisms
- Design APIs with security in mind, including proper authentication and authorization
- Document APIs using standardized formats (OpenAPI, JSON Schema)
- Test APIs thoroughly with both unit and integration tests
- Consider cacheability at the API design phase

## Reference Files
@file framework/core/resource.ts
@file apps/todo/app.ts 