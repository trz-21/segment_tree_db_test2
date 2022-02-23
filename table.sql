CREATE TABLE example(
	id text primary key,
	val numeric,
	time timestamptz
);

CREATE INDEX example_time_key on example using btree(time);

SELECT SUM(val) FROM example WHERE time > '' AND time < '';


CREATE TABLE example_tree(
	id text primary key,
	val numeric,
	is_full boolean,
	left_id text,
	right_id text,
	start_time timestamptz,
	end_time timestamptz
)

WITH info AS (
	SELECT SUM(val)::numeric as val, DATE_TRUNC('minute', time::timestamptz) AS time
	FROM example
	GROUP BY DATE_TRUNC('minute', time::timestamptz)
)
SELECT * from info;