# API Index

This file lists the backend APIs by service and controller mappings.

## Identity Service

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/bootstrap-admin`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `PATCH /api/v1/me`
- `GET /api/v1/organizers/me`
- `PUT /api/v1/organizers/me`
- `POST /api/v1/admin/events/{eventId}/approve`
- `POST /api/v1/admin/events/{eventId}/reject`
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users/admin`
- `DELETE /api/v1/admin/users/admin/{userId}`
- `DELETE /api/v1/admin/users/{userId}`
- `PATCH /api/v1/admin/users/{userId}/reactivate`
- `DELETE /api/v1/admin/users/{userId}/hard-delete`
- `GET /api/v1/health`

## Event Service

- `POST /api/v1/events`
- `GET /api/v1/events`
- `GET /api/v1/events/{id}`
- `PUT /api/v1/events/{id}`
- `DELETE /api/v1/events/{id}`
- `DELETE /api/v1/events/all`
- `GET /api/v1/events/activeEvents`
- `GET /api/v1/events/filter`
- `GET /api/v1/events/status/{status}`
- `GET /api/v1/events/pending`
- `PUT /api/v1/events/{id}/approve`
- `PUT /api/v1/events/{id}/reject`
- `PATCH /api/v1/events/{id}/status`
- `GET /api/v1/events/organizer/{organizerId}`
- `GET /api/v1/events/search`
- `GET /api/v1/events/organizer/{organizerId}/status/{status}`
- `POST /api/v1/events/ticketType/{eventId}`
- `GET /api/v1/events/ticketType/{eventId}`
- `POST /api/v1/event/categories`
- `GET /api/v1/event/categories`

## Booking Service

- `POST /api/v1/bookings`
- `GET /api/v1/bookings/bookingById/{id}`
- `GET /api/v1/bookings/userBookingById/{id}`
- `GET /api/v1/bookings/allBookings`
- `GET /api/v1/bookings/reference/{reference}`
- `GET /api/v1/bookings/user/{userId}`
- `GET /api/v1/bookings/event/{eventId}`
- `GET /api/v1/bookings/event/{eventId}/` (trailing slash variant)
- `GET /api/v1/bookings/event/{eventId}/status/{status}`
- `GET /api/v1/bookings/event/{eventId}/availability`
- `PUT /api/v1/bookings/{id}/confirm`
- `PUT /api/v1/bookings/{id}/cancel`
- `PUT /api/v1/bookings/{id}/checkin`
- `DELETE /api/v1/bookings/{id}`
- `PUT /api/v1/bookings/{userId}/{eventId}/cancel`

## Ticket Type Service (bookingService)

- `POST /api/v1/ticket-types`
- `POST /api/v1/ticket-types/event/{eventId}`
- `GET /api/v1/ticket-types/event/{eventId}`
- `GET /api/v1/ticket-types/{id}`
- `PUT /api/v1/ticket-types/{id}`
- `DELETE /api/v1/ticket-types/{id}`

## Notification Service

- `POST /api/v1/notifications/fcm-token`
- `DELETE /api/v1/notifications/fcm-token/{userId}`
