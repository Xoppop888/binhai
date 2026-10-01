-- BINHAI AUTO: объединение вариантов брендов в каталоге.
-- Меняются только public.cars.brand и public.cars.model; source_id, цены, фото и характеристики не затрагиваются.
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
set brand = 'GAC Trumpchi'
where lower(trim(coalesce(brand, ''))) = 'gac'
  and (lower(trim(coalesce(model, ''))) like 'trumpchi %'
       or lower(trim(coalesce(model, ''))) like 'chuanqi %'
       or trim(coalesce(model, '')) like '传祺 %');

update public.cars
set model = trim(regexp_replace(model, '^(Trumpchi|Chuanqi|чуаньци|传祺)[[:space:]]*', '', 1, 1, 'i'))
where brand = 'GAC Trumpchi';

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

update public.cars
set model = 'M7'
where brand = 'BAW'
  and lower(coalesce(model, '')) like '%m7%';

update public.cars
set brand = case
  when lower(trim(coalesce(brand, ''))) in ('бьюик', 'буик') then 'Buick'
  when lower(trim(coalesce(brand, ''))) = 'фольксваген' then 'Volkswagen'
  when lower(trim(coalesce(brand, ''))) in ('хавей', 'хавейл') then 'Haval'
  when lower(trim(coalesce(brand, ''))) = 'хонда' then 'Honda'
  when lower(trim(coalesce(brand, ''))) = 'мазда' then 'Mazda'
  when lower(trim(coalesce(brand, ''))) = 'мицубиси' then 'Mitsubishi'
  when lower(trim(coalesce(brand, ''))) = 'ниссан' then 'Nissan'
  when lower(trim(coalesce(brand, ''))) = 'пежо' then 'Peugeot'
  when lower(trim(coalesce(brand, ''))) = 'шкода' then 'Skoda'
  when lower(trim(coalesce(brand, ''))) = 'тойота' then 'Toyota'
  when lower(trim(coalesce(brand, ''))) = 'киа' then 'Kia'
  else brand
end
where lower(trim(coalesce(brand, ''))) in (
  'бьюик', 'буик', 'фольксваген', 'хавей', 'хавейл', 'хонда', 'мазда',
  'мицубиси', 'ниссан', 'пежо', 'шкода', 'тойота', 'киа'
);

update public.cars
set brand = 'GAC Trumpchi'
where lower(trim(coalesce(brand, ''))) in ('гавчи', 'гуанчжоу')
   or (lower(trim(coalesce(brand, ''))) = 'gac'
       and lower(coalesce(model, '')) ~ 'trumpchi|chuanqi|chuantsi|чуаньци|传祺');

update public.cars
set brand = 'Hyundai'
where lower(trim(coalesce(brand, ''))) in ('бэйцзин', 'пекинская', 'пекин')
  and lower(coalesce(model, '')) ~ 'hyundai|ix35';

update public.cars
set model = trim(regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(coalesce(model, ''), '(^|[[:space:],])(модель|model)([[:space:],]|$)', '\1\3', 1, 0, 'i'),
      '^Auto[[:space:],]+', '', 1, 1, 'i'
    ),
    '^(Trumpchi|Chuanqi|Chuantsi|чуаньци|传祺)[[:space:],]*', '', 1, 1, 'i'
  ),
  '[[:space:]]+', ' ', 'g'
))
where coalesce(model, '') <> '';

update public.cars
set model = case
  when lower(model) in ('кх1', 'кх-1') then 'KX1'
  when lower(model) like '%аутлендер%' or lower(model) like '%аутлэндер%' then 'Outlander'
  when lower(model) like '%королла%' then 'Corolla'
  when lower(model) like '%кашкай%' then 'Qashqai'
  when lower(model) like '%сильфи%' or lower(model) like '%силфи%' then 'Sylphy'
  when lower(model) like '%гольф%' then 'Golf'
  when lower(model) like '%ламандо%' then 'Lamando'
  when lower(model) like '%сагитар%' then 'Sagitar'
  when lower(model) like '%везел%' then 'Vezel'
  when lower(model) like '%читу%' then 'Chitu'
  when lower(model) like '%камик%' then 'Kamiq'
  when lower(model) like '%карок%' then 'Karoq'
  when lower(model) like '%октавия%' then 'Octavia'
  when lower(model) like '%рапид%' then 'Rapid'
  when lower(model) like '%суперб%' then 'Superb'
  when lower(model) like '%монза%' then 'Monza'
  when lower(model) like '%аксела%' or lower(model) like '%акселера%' then regexp_replace(model, 'Акселера?', 'Axela', 1, 0, 'i')
  when lower(model) ~ '^3[[:space:][:punct:]]*(й|я)?[[:space:]-]*серии$' then '3 Series'
  when lower(model) like '%hyundai ix35%' then 'ix35'
  else model
end
where coalesce(model, '') <> '';

update public.cars
set model = 'M8'
where brand = 'GAC Trumpchi'
  and lower(coalesce(model, '')) like '%m8%';

update public.cars
set model = 'GS4'
where brand = 'GAC Trumpchi'
  and lower(coalesce(model, '')) like '%gs4%';

update public.cars
set model = 'Vision X6'
where brand = 'Geely'
  and lower(coalesce(model, '')) like '%vision x6%';

update public.cars
set model = '3 Axela'
where brand = 'Mazda'
  and lower(coalesce(model, '')) like '%3%axela%';

update public.cars
set model = 'A 180 L'
where brand = 'Mercedes-Benz'
  and lower(replace(replace(trim(coalesce(model, '')), '‑', '-'), '–', '-')) in ('a-class', 'a-klass', 'a класс', 'a-класс');

update public.cars
set brand = case
  when lower(trim(coalesce(brand, ''))) = 'kia' then 'Kia'
  when lower(trim(coalesce(brand, ''))) = 'шевроле' then 'Chevrolet'
  else brand
end
where lower(trim(coalesce(brand, ''))) in ('kia', 'шевроле');

update public.cars
set model = case
  when lower(trim(coalesce(model, ''))) = 'a‑класс' then 'A-Class'
  when lower(trim(coalesce(model, ''))) = 'левин' then 'Levin'
  when lower(trim(coalesce(model, ''))) = 'яpис l x' or lower(trim(coalesce(model, ''))) = 'ярис l x' then 'Yaris L X'
  when lower(trim(coalesce(model, ''))) like 'tiggo 8%' then 'Tiggo 8'
  when lower(trim(coalesce(model, ''))) like '2008%' then '2008'
  when lower(trim(coalesce(model, ''))) like 'automobile binyue%' then trim(regexp_replace(model, '^Automobile[[:space:]]+', '', 1, 1, 'i'))
  else model
end
where lower(trim(coalesce(model, ''))) in ('a‑класс', 'левин', 'ярис l x', 'яpис l x')
   or lower(trim(coalesce(model, ''))) like 'tiggo 8%'
   or lower(trim(coalesce(model, ''))) like '2008%'
   or lower(trim(coalesce(model, ''))) like 'automobile binyue%';

select brand, count(*) as cars_count
from public.cars
where lower(trim(coalesce(brand, ''))) in (
  'mercedes-benz', 'haval', 'jetour', 'gac', 'hyundai',
  'mercedes', 'havall', 'jietu', 'guangzhou', 'beijing'
)
group by brand
order by brand;

commit;
