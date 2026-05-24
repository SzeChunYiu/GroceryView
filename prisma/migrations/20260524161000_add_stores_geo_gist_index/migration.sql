create extension if not exists cube;
create extension if not exists earthdistance;

create index if not exists stores_latitude_longitude_earth_gist_idx
  on stores
  using gist (ll_to_earth(latitude, longitude));
