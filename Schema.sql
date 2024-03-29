-- This script was generated by a beta version of the ERD tool in pgAdmin 4.
-- Please log an issue at https://redmine.postgresql.org/projects/pgadmin4/issues/new if you find any bugs, including reproduction steps.
BEGIN;


CREATE TABLE IF NOT EXISTS public.users
(
    id serial,
    email character varying NOT NULL UNIQUE,
    name character varying NOT NULL,
    public_key character varying,
    password_hash character varying NOT NULL,
    password_salt character,
    PRIMARY KEY (id)
);



CREATE TABLE IF NOT EXISTS public.leases
(
    id serial,
    "user" bigint,
    capacity bigint,
    price bigint,
    start_date bigint,
    end_date bigint,
    signature character varying,
    PRIMARY KEY (id),
    CONSTRAINT user_fk FOREIGN KEY("user") REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.batches
(
    id serial,
    "user" bigint,
    lease bigint, 
    resource character varying,
    "name" character varying,
    description character varying ,
    PRIMARY KEY (id),
    CONSTRAINT user_fk FOREIGN KEY("user") REFERENCES public.users(id),
    CONSTRAINT lease_fk FOREIGN KEY(lease) REFERENCES public.leases(id)
);

CREATE TABLE IF NOT EXISTS public.tokens
(
    id serial,
    expires bigint,
    "user" bigint,
    signature character varying,
    token character varying,
    description character varying,
    PRIMARY KEY (id),
    CONSTRAINT user_fk FOREIGN KEY("user") REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.sessions
(
    id serial,
    "user" bigint,
    "token" bigint,
    expires bigint,
    PRIMARY KEY (id),
    CONSTRAINT user_fk FOREIGN KEY("user") REFERENCES public.users(id),
    CONSTRAINT token_fk FOREIGN KEY("token") REFERENCES public.tokens(id)
);

CREATE TABLE IF NOT EXISTS public.permissions
(
    id serial,
    "token" bigint,
    batch bigint,
    permission character varying,
    PRIMARY KEY (id),
    CONSTRAINT batch_fk FOREIGN KEY(batch) REFERENCES public.batches(id),
    CONSTRAINT token_fk FOREIGN KEY("token") REFERENCES public.tokens(id)
);

CREATE TABLE IF NOT EXISTS public.barcodes
(
    id serial,
    barcode character varying,
    batch bigint,
    PRIMARY KEY (id),
    CONSTRAINT batch_fk FOREIGN KEY(batch) REFERENCES public.batches(id)
);


END;