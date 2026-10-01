-- BINHAI AUTO: объединение вариантов брендов в каталоге.
-- Меняется только public.cars.brand; source_id, цены, фото и характеристики не затрагиваются.
-- Beijing переводится в Hyundai только для записей с моделью Hyundai/ix35,
-- потому что Beijing/BAIC сам по себе является отдельным брендом.

begin;

update public.cars
set brand = 'Mercedes-Benz'
where lower(trim(coalesce(brand, ''))) like '%mercedes%'
   or lower(trim(coalesce(brand, ''))) like '%мерседес%'
   or trim(coalesce(brand, '')) like '%奔驰%';

update public.cars
set brand = 'Haval'
where lower(trim(coalesce(brand, ''))) in ('haval', 'havall')
   or lower(trim(coalesce(brand, ''))) like '%хавал%'
   or trim(coalesce(brand, '')) like '%哈弗%';

update public.cars
set brand = 'Jetour'
where lower(trim(coalesce(brand, ''))) in ('jetour', 'jietu')
   or lower(trim(coalesce(brand, ''))) like '%джетур%'
   or trim(coalesce(brand, '')) like '%捷途%';

update public.cars
set brand = 'GAC'
where lower(trim(coalesce(brand, ''))) in ('gac', 'guangzhou')
   or lower(trim(coalesce(brand, ''))) like '%гуанчжоу%'
   or trim(coalesce(brand, '')) like '%广州%'
   or trim(coalesce(brand, '')) like '%广汽%';

update public.cars
set brand = 'Hyundai'
where lower(trim(coalesce(brand, ''))) in ('beijing', 'beijing-hyundai', 'бэйцзин', 'пекинская', 'пекин')
  and (lower(coalesce(model, '')) like '%hyundai%'
       or lower(coalesce(model, '')) like '%ix35%'
       or lower(coalesce(model, '')) like '%ix-35%');

update public.cars
set brand = 'BAW'
where lower(trim(coalesce(brand, ''))) = 'baic'
  and (lower(coalesce(model, '')) like '%m7%'
       or lower(coalesce(model, '')) like '%руйшэн%'
       or lower(coalesce(model, '')) like '%ruisheng%'
       or lower(coalesce(model, '')) like '%вейцзя%'
       or lower(coalesce(model, '')) like '%wangpai%');

select brand, count(*) as cars_count
from public.cars
where lower(trim(coalesce(brand, ''))) in (
  'mercedes-benz', 'haval', 'jetour', 'gac', 'hyundai',
  'mercedes', 'havall', 'jietu', 'guangzhou', 'beijing'
)
group by brand
order by brand;

commit;
