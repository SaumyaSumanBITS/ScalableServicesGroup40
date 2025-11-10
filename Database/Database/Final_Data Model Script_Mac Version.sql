----- User DB/Schema -------
create schema event_user;
CREATE TABLE event_user.etsr_users ( userid INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(25), createdat TIMESTAMP NOT NULL );

----- Venue DB/Schema -------
create schema event_venue;
CREATE TABLE event_venue.etsr_venues ( venueid INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, city VARCHAR(100) NOT NULL, capacity INTEGER NOT NULL );

----- Event DB/Schema -------
create schema event_event;
CREATE TABLE event_event.etsr_venues ( venueid INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, city VARCHAR(100) NOT NULL, capacity INTEGER NOT NULL );
CREATE TABLE event_event.etsr_events ( eventid INTEGER PRIMARY KEY, venueid INTEGER NOT NULL REFERENCES etsr_venues(venueid), title VARCHAR(255) NOT NULL, eventtype VARCHAR(50) NOT NULL, eventdate TIMESTAMP NOT NULL, baseprice NUMERIC(12,2) NOT NULL, status VARCHAR(50) NOT NULL );

----- Order DB/Schema -------
create schema event_order;
CREATE TABLE event_order.etsr_users ( userid INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(25), createdat TIMESTAMP NOT NULL );
CREATE TABLE event_order.etsr_venues ( venueid INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, city VARCHAR(100) NOT NULL, capacity INTEGER NOT NULL );
CREATE TABLE event_order.etsr_events ( eventid INTEGER PRIMARY KEY, venueid INTEGER NOT NULL REFERENCES etsr_venues(venueid), title VARCHAR(255) NOT NULL, eventtype VARCHAR(50) NOT NULL, eventdate TIMESTAMP NOT NULL, baseprice NUMERIC(12,2) NOT NULL, status VARCHAR(50) NOT NULL );
CREATE TABLE event_order.etsr_orders ( orderid INTEGER PRIMARY KEY, userid INTEGER NOT NULL REFERENCES etsr_users(userid), eventid INTEGER NOT NULL REFERENCES etsr_events(eventid), status VARCHAR(50) NOT NULL, paymentstatus VARCHAR(50) NOT NULL, ordertotal NUMERIC(12,2) NOT NULL, createdat TIMESTAMP NOT NULL );

----- Seats DB/Schema -------
create schema event_seats;
CREATE TABLE event_seats.etsr_venues ( venueid INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, city VARCHAR(100) NOT NULL, capacity INTEGER NOT NULL );
CREATE TABLE event_seats.etsr_events ( eventid INTEGER PRIMARY KEY, venueid INTEGER NOT NULL REFERENCES etsr_venues(venueid), title VARCHAR(255) NOT NULL, eventtype VARCHAR(50) NOT NULL, eventdate TIMESTAMP NOT NULL, baseprice NUMERIC(12,2) NOT NULL, status VARCHAR(50) NOT NULL );
CREATE TABLE event_seats.etsr_seats ( seatid INTEGER PRIMARY KEY, eventid INTEGER NOT NULL REFERENCES etsr_events(eventid), section VARCHAR(50), row_num VARCHAR(50), seatnumber INTEGER, price NUMERIC(12,2) );

----- Tickets DB/Schema -------
create schema event_tickets;
CREATE TABLE event_tickets.etsr_users ( userid INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(25), createdat TIMESTAMP NOT NULL );
CREATE TABLE event_tickets.etsr_venues ( venueid INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, city VARCHAR(100) NOT NULL, capacity INTEGER NOT NULL );
CREATE TABLE event_tickets.etsr_events ( eventid INTEGER PRIMARY KEY, venueid INTEGER NOT NULL REFERENCES etsr_venues(venueid), title VARCHAR(255) NOT NULL, eventtype VARCHAR(50) NOT NULL, eventdate TIMESTAMP NOT NULL, baseprice NUMERIC(12,2) NOT NULL, status VARCHAR(50) NOT NULL );
CREATE TABLE event_tickets.etsr_orders ( orderid INTEGER PRIMARY KEY, userid INTEGER NOT NULL REFERENCES etsr_users(userid), eventid INTEGER NOT NULL REFERENCES etsr_events(eventid), status VARCHAR(50) NOT NULL, paymentstatus VARCHAR(50) NOT NULL, ordertotal NUMERIC(12,2) NOT NULL, createdat TIMESTAMP NOT NULL );
CREATE TABLE event_tickets.etsr_seats ( seatid INTEGER PRIMARY KEY, eventid INTEGER NOT NULL REFERENCES etsr_events(eventid), section VARCHAR(50), row_num VARCHAR(50), seatnumber INTEGER, price NUMERIC(12,2) );
CREATE TABLE event_tickets.etsr_tickets ( ticketid INTEGER PRIMARY KEY, orderid INTEGER NOT NULL REFERENCES etsr_orders(orderid), eventid INTEGER NOT NULL REFERENCES etsr_events(eventid), seatid INTEGER REFERENCES etsr_seats(seatid), pricepaid NUMERIC(12,2) );

----- Payments DB/Schema -------
create schema event_payments;
CREATE TABLE event_payments.etsr_users ( userid INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(255) NOT NULL, phone VARCHAR(25), createdat TIMESTAMP NOT NULL);
CREATE TABLE event_payments.etsr_venues ( venueid INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, city VARCHAR(100) NOT NULL, capacity INTEGER NOT NULL );
CREATE TABLE event_payments.etsr_events ( eventid INTEGER PRIMARY KEY, venueid INTEGER NOT NULL REFERENCES etsr_venues(venueid), title VARCHAR(255) NOT NULL, eventtype VARCHAR(50) NOT NULL, eventdate TIMESTAMP NOT NULL, baseprice NUMERIC(12,2) NOT NULL, status VARCHAR(50) NOT NULL );
CREATE TABLE event_payments.etsr_orders ( orderid INTEGER PRIMARY KEY, userid INTEGER NOT NULL REFERENCES etsr_users(userid), eventid INTEGER NOT NULL REFERENCES etsr_events(eventid), status VARCHAR(50) NOT NULL, paymentstatus VARCHAR(50) NOT NULL, ordertotal  NUMERIC(12,2) NOT NULL, createdat TIMESTAMP NOT NULL);
CREATE TABLE event_payments.etsr_payments ( paymentid INTEGER PRIMARY KEY, orderid INTEGER NOT NULL REFERENCES etsr_orders(orderid), amount NUMERIC(12,2) NOT NULL, method VARCHAR(50) NOT NULL, status VARCHAR(50) NOT NULL, reference VARCHAR(255), createdat TIMESTAMP NOT NULL);

SET GLOBAL event_scheduler = ON;
SHOW PROCESSLIST;
-- event_scheduler=ON;

---------------- User Data Refresh ------------------------
DELIMITER $$
CREATE EVENT event_user.event_user_refresh
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
INSERT INTO event_order.etsr_users (userid, name, email, phone, createdat)
SELECT src.userid, src.name, src.email, src.phone, src.createdat
FROM event_user.etsr_users AS src
LEFT JOIN event_order.etsr_users AS dest
ON src.userid = dest.userid
WHERE dest.userid IS NULL;
INSERT INTO event_tickets.etsr_users (userid, name, email, phone, createdat)
SELECT src.userid, src.name, src.email, src.phone, src.createdat
FROM event_user.etsr_users AS src
LEFT JOIN event_tickets.etsr_users AS dest
ON src.userid = dest.userid
WHERE dest.userid IS NULL;
INSERT INTO event_payments.etsr_users (userid, name, email, phone, createdat)
SELECT src.userid, src.name, src.email, src.phone, src.createdat
FROM event_user.etsr_users AS src
LEFT JOIN event_payments.etsr_users AS dest
ON src.userid = dest.userid
WHERE dest.userid IS NULL;
END $$
DELIMITER ;

---------------- Venues Data Refresh ------------------------

DELIMITER $$
CREATE EVENT event_venue.event_venue_refresh
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
INSERT INTO event_event.etsr_venues (venueid, name, city, capacity)
SELECT src.venueid, src.name, src.city, src.capacity
FROM event_venue.etsr_venues AS src
LEFT JOIN event_event.etsr_venues AS dest
ON src.venueid = dest.venueid
WHERE dest.venueid IS NULL;
INSERT INTO event_order.etsr_venues (venueid, name, city, capacity)
SELECT src.venueid, src.name, src.city, src.capacity
FROM event_venue.etsr_venues AS src
LEFT JOIN event_order.etsr_venues AS dest
ON src.venueid = dest.venueid
WHERE dest.venueid IS NULL;
INSERT INTO event_seats.etsr_venues (venueid, name, city, capacity)
SELECT src.venueid, src.name, src.city, src.capacity
FROM event_venue.etsr_venues AS src
LEFT JOIN event_seats.etsr_venues AS dest
ON src.venueid = dest.venueid
WHERE dest.venueid IS NULL;
INSERT INTO event_tickets.etsr_venues (venueid, name, city, capacity)
SELECT src.venueid, src.name, src.city, src.capacity
FROM event_venue.etsr_venues AS src
LEFT JOIN event_tickets.etsr_venues AS dest
ON src.venueid = dest.venueid
WHERE dest.venueid IS NULL;
INSERT INTO event_payments.etsr_venues (venueid, name, city, capacity)
SELECT src.venueid, src.name, src.city, src.capacity
FROM event_venue.etsr_venues AS src
LEFT JOIN event_payments.etsr_venues AS dest
ON src.venueid = dest.venueid
WHERE dest.venueid IS NULL;
END $$
DELIMITER ;


---------------- Events Data Refresh ------------------------

DELIMITER $$
CREATE EVENT event_event.event_events_refresh
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
INSERT INTO event_order.etsr_events (eventid , venueid , title , eventtype , eventdate , baseprice , status)
SELECT src.eventid , src.venueid , src.title , src.eventtype , src.eventdate , src.baseprice , src.status
FROM event_event.etsr_events AS src
LEFT JOIN event_order.etsr_events AS dest
ON src.eventid = dest.eventid
WHERE dest.eventid IS NULL;
INSERT INTO event_seats.etsr_events (eventid , venueid , title , eventtype , eventdate , baseprice , status)
SELECT src.eventid , src.venueid , src.title , src.eventtype , src.eventdate , src.baseprice , src.status
FROM event_event.etsr_events AS src
LEFT JOIN event_seats.etsr_events AS dest
ON src.eventid = dest.eventid
WHERE dest.eventid IS NULL;
INSERT INTO event_tickets.etsr_events (eventid , venueid , title , eventtype , eventdate , baseprice , status)
SELECT src.eventid , src.venueid , src.title , src.eventtype , src.eventdate , src.baseprice , src.status
FROM event_event.etsr_events AS src
LEFT JOIN event_tickets.etsr_events AS dest
ON src.eventid = dest.eventid
WHERE dest.eventid IS NULL;
INSERT INTO event_payments.etsr_events (eventid , venueid , title , eventtype , eventdate , baseprice , status)
SELECT src.eventid , src.venueid , src.title , src.eventtype , src.eventdate , src.baseprice , src.status
FROM event_event.etsr_events AS src
LEFT JOIN event_payments.etsr_events AS dest
ON src.eventid = dest.eventid
WHERE dest.eventid IS NULL;
END $$
DELIMITER ;

---------------- Order Data Refresh ------------------------

DELIMITER $$
CREATE EVENT event_order.event_orders_refresh
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
INSERT INTO event_tickets.etsr_orders (orderid , userid , eventid , status , paymentstatus, ordertotal , createdat)
SELECT src.orderid , src.userid , src.eventid , src.status , src.paymentstatus, src.ordertotal , src.createdat
FROM event_order.etsr_orders AS src
LEFT JOIN event_tickets.etsr_orders AS dest
ON src.orderid = dest.orderid
WHERE dest.orderid IS NULL;
INSERT INTO event_payments.etsr_orders (orderid , userid , eventid , status , paymentstatus, ordertotal , createdat)
SELECT src.orderid , src.userid , src.eventid , src.status , src.paymentstatus, src.ordertotal , src.createdat
FROM event_order.etsr_orders AS src
LEFT JOIN event_payments.etsr_orders AS dest
ON src.orderid = dest.orderid
WHERE dest.orderid IS NULL;
END $$
DELIMITER ;

---------------- Seats Data Refresh ------------------------
DELIMITER $$
CREATE EVENT event_seats.event_seats_refresh
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
INSERT INTO event_tickets.etsr_seats (seatid , eventid , section , row_num , seatnumber , price )
SELECT src.seatid , src.eventid , src.section , src.row_num , src.seatnumber , src.price
FROM event_seats.etsr_seats AS src
LEFT JOIN event_tickets.etsr_seats AS dest
ON src.seatid = dest.seatid
WHERE dest.seatid IS NULL;
END $$
DELIMITER ;
