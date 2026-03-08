create table if not exists mediators (
  code text primary key,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into mediators (code, name)
values
  ('742776', 'MEDOR 742776'),
  ('755224', 'MEDOR 755224'),
  ('742826', 'MEDOR 742826')
on conflict (code) do nothing;

create table if not exists monthly_metrics (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  month integer not null check (month between 1 and 12),
  mediator_code text not null references mediators(code),
  renovacion_pct numeric(6,2) not null,
  tasa_np_pct numeric(6,2) not null,
  polizas_np integer not null,
  polizas integer not null,
  net_inflow numeric(14,2) not null,
  gwp numeric(14,2) not null,
  crecimiento_pct numeric(6,2) not null,
  gwpnp numeric(14,2) not null,
  cor numeric(6,2) not null,
  devolucion_recibos_pct numeric(6,2) default 0,
  gwpnp_salud numeric(14,2) not null default 0,
  gwpnp_particulares numeric(14,2) not null default 0,
  gwpnp_auto numeric(14,2) not null default 0,
  gwpnp_hogar numeric(14,2) not null default 0,
  gwpnp_decesos numeric(14,2) not null default 0,
  gwpnp_comunidades numeric(14,2) not null default 0,
  gwpnp_empresa numeric(14,2) not null default 0,
  gwpnp_flota numeric(14,2) not null default 0,
  gwpnp_comercio numeric(14,2) not null default 0,
  gwpnp_industria numeric(14,2) not null default 0,
  gwpnp_accidentes numeric(14,2) not null default 0,
  gwpnp_oficina numeric(14,2) not null default 0,
  gwpnp_rc numeric(14,2) not null default 0,
  gwpnp_transporte numeric(14,2) not null default 0,
  gwpnp_psc numeric(14,2) not null default 0,
  gwpnp_salud_colectivo numeric(14,2) not null default 0,
  gwpnp_vida_colectivo numeric(14,2) not null default 0,
  gwpnp_vida numeric(14,2) not null default 0,
  gwpnp_ahorro numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(year, month, mediator_code)
);

create table if not exists annual_objectives (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  rapel_anual jsonb not null,
  rapel_cuatrimestral jsonb not null,
  grados jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_monthly_metrics_updated_at
before update on monthly_metrics
for each row execute function update_updated_at_column();

create trigger update_annual_objectives_updated_at
before update on annual_objectives
for each row execute function update_updated_at_column();
