create or replace function array_diff(array1 anyarray, array2 anyarray)
returns anyarray language sql immutable as $$
    select coalesce(array_agg(elem), '{}')
    from unnest(array1) elem
    where elem <> all(array2)
$$;
CREATE OR REPLACE AGGREGATE flatmap (anycompatiblearray)
(
    sfunc = array_cat,
    stype = ANYCOMPATIBLEARRAY,
    initcond = '{}'
);
create or replace function naturalsort(text)
    returns bytea language sql immutable strict as $f$
    select string_agg(convert_to(coalesce(r[2], length(length(r[1])::text) || length(r[1])::text || r[1]), 'SQL_ASCII'),'\x00')
    from regexp_matches($1, '0*([0-9]+)|([^0-9]+)', 'g') r;
$f$;

create index if not exists project_lost_date on projects(project_lost_date);
create index if not exists completion_date on projects(((completion).date));