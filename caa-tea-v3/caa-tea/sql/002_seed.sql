-- ============================================================
--  CAA-TEA · Datos de demostración
-- ============================================================

-- Adulto demo (PIN: 1234 → bcrypt de "1234")
INSERT INTO users (id, name, role, pin_hash) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'María (mamá)',
   'adult',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LMTIxDYifz2');
   -- PIN demo: 1234

-- Niño demo
INSERT INTO users (id, name, role, avatar_color) VALUES
  ('00000000-0000-0000-0000-000000000002',
   'Mateo',
   'child',
   '#1D9E75');

-- Vinculación
INSERT INTO adult_child_links (adult_id, child_id) VALUES
  ('00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002');

-- Agenda de hoy (demo)
INSERT INTO schedules (child_id, date, slot_now, slot_next, slot_later) VALUES
  ('00000000-0000-0000-0000-000000000002',
   CURRENT_DATE,
   '{"pictoId": 2510, "label": "Desayunar", "imageUrl": "https://static.arasaac.org/pictograms/2510/2510_300.png", "completed": false}',
   '{"pictoId": 6386, "label": "Colegio", "imageUrl": "https://static.arasaac.org/pictograms/6386/6386_300.png", "completed": false}',
   '{"pictoId": 3196, "label": "Jugar", "imageUrl": "https://static.arasaac.org/pictograms/3196/3196_300.png", "completed": false}');
