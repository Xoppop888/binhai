-- BINHAI AUTO: объединение вариантов бренда Mercedes-Benz.
-- Меняет только отображаемое поле brand, source_id и карточки не затрагивает.

begin;

update public.cars
set brand = 'Mercedes-Benz'
where lower(trim(coalesce(brand, ''))) like '%mercedes%'
   or lower(trim(coalesce(brand, ''))) like '%мерседес%'
   or trim(coalesce(brand, '')) like '%奔驰%';

select brand, count(*) as cars_count
from public.cars
where lower(trim(coalesce(brand, ''))) like '%mercedes%'
   or lower(trim(coalesce(brand, ''))) like '%мерседес%'
   or trim(coalesce(brand, '')) like '%奔驰%'
group by brand
order by brand;

commit;
