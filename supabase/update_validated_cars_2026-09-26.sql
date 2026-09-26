-- Обновление подтверждённых данных по 23 автомобилям.
-- Выполнить после migration_005_cars_data_quality.sql.
-- Значения power_hp округлены из кВт: 1 кВт = 1.35962 л.с.

begin;

with validated(slug, fuel_type, power_hp, battery_kwh) as (
  values
    ('baic-manufakturing-ruyshen-veytszya-m7-model-1534864822785732608', 'ice', 133, null),
    ('changan-cs35-plus-1547906925971865600', 'ice', 150, null),
    ('changan-cs35-plus-1547558975026462720', 'ice', 150, null),
    ('chery-tiggo-8-model-1537027874919419904', 'ice', 147, null),
    ('jetour-x70-plus-1539228207954456576', 'ice', 156, null),
    ('jietu-x70-plus-1539562619523960832', 'ice', 156, null),
    ('jietu-x70-plus-1536689435174899712', 'ice', 156, null),
    ('kia-kkh1-1532429561645633536', 'ice', 100, null),
    ('kia-kkh1-1519107612204101632', 'ice', 100, null),
    ('kia-kkh1-1532018863786561536', 'ice', 100, null),
    ('kia-kkh1-1526994662251499520', 'ice', 100, null),
    ('kia-kkh1-1527058121215381504', 'ice', 100, null),
    ('kia-kkh1-1532436140330774528', 'ice', 100, null),
    ('wuling-motors-xingchen-1532761761086894080', 'ice', 147, null),
    ('byuik-gl6-1519251953232932864', 'hybrid', 156, null),
    ('byuik-gl6-1532764195775508480', 'hybrid', 156, null),
    ('gavchi-chuantsi-gs4-1519096493753131008', 'ice', 159, null),
    ('gavchi-chuantsi-gs4-model-1532765634456326144', 'ice', 159, null),
    ('guanchzhou-chuantsi-chuantsi-m8-model-1533780882885840896', 'ice', 231, null),
    ('toyota-bz3x-1529190694007803904', 'ev', 204, 65.3),
    ('khavey-m6-1538873704613810176', 'ice', 150, null),
    ('khavey-chitu-1536329286786617344', 'ice', 150, null),
    ('khavey-chitu-1534258630649581568', 'ice', 150, null)
)
update public.cars as c
set
  fuel_type = v.fuel_type,
  power_hp = v.power_hp,
  battery_kwh = v.battery_kwh
from validated as v
where c.slug = v.slug;

-- Защита от тихого неполного обновления:
-- количество должно быть ровно 23.
do $$
declare
  updated_count integer;
begin
  select count(*) into updated_count
  from public.cars
  where slug in (
    'baic-manufakturing-ruyshen-veytszya-m7-model-1534864822785732608',
    'changan-cs35-plus-1547906925971865600',
    'changan-cs35-plus-1547558975026462720',
    'chery-tiggo-8-model-1537027874919419904',
    'jetour-x70-plus-1539228207954456576',
    'jietu-x70-plus-1536689435174899712',
    'jietu-x70-plus-1539562619523960832',
    'kia-kkh1-1532429561645633536',
    'kia-kkh1-1519107612204101632',
    'kia-kkh1-1532018863786561536',
    'kia-kkh1-1526994662251499520',
    'kia-kkh1-1527058121215381504',
    'kia-kkh1-1532436140330774528',
    'wuling-motors-xingchen-1532761761086894080',
    'byuik-gl6-1519251953232932864',
    'byuik-gl6-1532764195775508480',
    'gavchi-chuantsi-gs4-1519096493753131008',
    'gavchi-chuantsi-gs4-model-1532765634456326144',
    'guanchzhou-chuantsi-chuantsi-m8-model-1533780882885840896',
    'toyota-bz3x-1529190694007803904',
    'khavey-m6-1538873704613810176',
    'khavey-chitu-1536329286786617344',
    'khavey-chitu-1534258630649581568'
  );
  if updated_count <> 23 then
    raise exception 'Expected 23 matching cars, found %', updated_count;
end $$;

commit;

-- Контроль после выполнения:
select slug, brand, model, fuel_type, power_hp, battery_kwh,
       data_quality_status, data_quality_issues
from public.cars
where slug in (
  'baic-manufakturing-ruyshen-veytszya-m7-model-1534864822785732608',
  'changan-cs35-plus-1547906925971865600',
  'changan-cs35-plus-1547558975026462720',
  'chery-tiggo-8-model-1537027874919419904',
  'jetour-x70-plus-1539228207954456576',
  'jietu-x70-plus-1536689435174899712',
  'jietu-x70-plus-1539562619523960832',
  'kia-kkh1-1532429561645633536',
  'kia-kkh1-1519107612204101632',
  'kia-kkh1-1532018863786561536',
  'kia-kkh1-1526994662251499520',
  'kia-kkh1-1527058121215381504',
  'kia-kkh1-1532436140330774528',
  'wuling-motors-xingchen-1532761761086894080',
  'byuik-gl6-1519251953232932864',
  'byuik-gl6-1532764195775508480',
  'gavchi-chuantsi-gs4-1519096493753131008',
  'gavchi-chuantsi-gs4-model-1532765634456326144',
  'guanchzhou-chuantsi-chuantsi-m8-model-1533780882885840896',
  'toyota-bz3x-1529190694007803904',
  'khavey-m6-1538873704613810176',
  'khavey-chitu-1536329286786617344',
  'khavey-chitu-1534258630649581568'
)
order by brand, model, slug;
