-- Door Kit master (PARAMETER DOORS sheet). One row per door code; the
-- quotation builder looks a door code up here and auto-fills its parameters.
CREATE TABLE IF NOT EXISTS master_door (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sr_no             integer GENERATED ALWAYS AS IDENTITY,
  door_code         text,
  door_type         text,
  door_config       text,
  frame_profile     text,
  frame_material    text,
  shutter_type      text,
  shutter_material  text,
  insulation        text,
  rate_per_sqm      numeric,
  install_per_sqm   numeric,
  orientation       text,
  finish            text,
  shade             text,
  shade_finish      text,
  width             numeric,
  height            numeric,
  qty               numeric,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS master_door_code_idx ON master_door (door_code);
